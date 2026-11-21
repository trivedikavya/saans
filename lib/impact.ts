/**
 * Merges a (narrative-only, LLM-authored) plan with code-computed Impact
 * numbers and the deterministic mask guidance / best-outdoor-window data,
 * producing the final `PlanResponse` sent to the client. This is the one
 * and only place numbers are attached to plan items -- see lib/emissions.ts
 * and lib/aqi.ts for the underlying math.
 */
import { findBestOutdoorWindow, getAqiBand, getMaskGuidance, type HourlyAirPoint, type MemberType } from "./aqi";
import {
  avoidBurningImpact,
  carpoolImpact,
  cigaretteEquivalents,
  CORSI_ROSENTHAL_REDUCTION_FACTOR,
  COOKING_EXHAUST_REDUCTION_FACTOR,
  exposureReductionPercent,
  HEPA_PURIFIER_REDUCTION_FACTOR,
  heatingSwitchImpact,
  INDOOR_OUTDOOR_PM_RATIO_EXPORT,
  SEALED_WINDOWS_PEAK_HOURS_REDUCTION_FACTOR,
  transportSwitchImpact,
} from "./emissions";
import type { SafetyOverride } from "./safety";
import type { GeminiPlanNarrative, HourlyAirPointData, Impact, PlanResponse, Profile } from "./schemas";

/** A representative household assumption for alternatives that affect the whole home, not one person's commute. */
const ASSUMED_HOUSEHOLD_WASTE_BURN_KG_PER_WEEK = 5;
const ASSUMED_CARPOOL_OCCUPANTS = 3;

/** Typical outdoor-exposure duration (hours) assumed per routine-tweak category. Documented, conservative defaults. */
const ROUTINE_DURATION_HOURS: Record<string, number> = {
  commute: 1,
  school: 0.5,
  exercise: 0.75,
  errands: 0.5,
};

const INDOOR_OUTDOOR_PM_RATIO = INDOOR_OUTDOOR_PM_RATIO_EXPORT;
const INDOOR_EXPOSURE_HOURS_PER_DAY = 16; // waking hours spent mostly indoors

/** Prorates a short-duration exposure at `concentration` µg/m³ into the 24h-average heuristic cigarette-equivalent unit. */
function partialDayCigaretteEquivalents(concentrationUgM3: number, hours: number): number {
  return cigaretteEquivalents((concentrationUgM3 * hours) / 24);
}

function averagePm25ForHourRange(hourly: HourlyAirPointData[], startHour: number, endHour: number): number {
  const matches = hourly.filter((p) => {
    const h = new Date(p.time).getHours();
    return h >= startHour && h < endHour;
  });
  if (matches.length === 0) return hourly[0]?.pm25 ?? 0;
  return matches.reduce((sum, p) => sum + p.pm25, 0) / matches.length;
}

function average24hPm25(hourly: HourlyAirPointData[]): number {
  const slice = hourly.slice(0, 24);
  if (slice.length === 0) return 0;
  return slice.reduce((sum, p) => sum + p.pm25, 0) / slice.length;
}

function zeroImpact(): Impact {
  return { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided: 0, pmGramsAvoided: 0 };
}

export interface BuildPlanResponseParams {
  narrative: GeminiPlanNarrative;
  overrides: SafetyOverride[];
  source: "gemini" | "fallback";
  profile: Profile;
  usAqi: number;
  currentPm25: number;
  hourly: HourlyAirPointData[];
}

export function buildPlanResponse(params: BuildPlanResponseParams): PlanResponse {
  const { narrative, overrides, source, profile, usAqi, currentPm25, hourly } = params;

  const aqiBand = getAqiBand(usAqi).key;
  const bestWindow = findBestOutdoorWindow(hourly as HourlyAirPoint[]);
  const bestWindowPm25 = averagePm25ForHourRange(hourly, bestWindow.startHour, bestWindow.endHour);

  const routineTweaks = narrative.routineTweaks.map((tweak) => {
    const duration = ROUTINE_DURATION_HOURS[tweak.category] ?? 0.5;
    const baselineCig = partialDayCigaretteEquivalents(currentPm25, duration);
    const improvedCig = partialDayCigaretteEquivalents(bestWindowPm25, duration);
    const impact: Impact = {
      cigaretteEquivalents: Math.max(0, baselineCig - improvedCig),
      exposureReductionPercent: exposureReductionPercent(currentPm25, bestWindowPm25),
      co2eGramsAvoided: 0,
      pmGramsAvoided: 0,
    };
    return { ...tweak, impact };
  });

  const indoorOutdoorPm25 = currentPm25 * INDOOR_OUTDOOR_PM_RATIO;

  const indoorHacks = narrative.indoorHacks.map((hack) => {
    let reductionFactor = 0;
    switch (hack.type) {
      case "purifier":
        reductionFactor = HEPA_PURIFIER_REDUCTION_FACTOR;
        break;
      case "seal":
        reductionFactor = SEALED_WINDOWS_PEAK_HOURS_REDUCTION_FACTOR;
        break;
      case "diy":
        reductionFactor = CORSI_ROSENTHAL_REDUCTION_FACTOR;
        break;
      case "cooking":
        reductionFactor = COOKING_EXHAUST_REDUCTION_FACTOR;
        break;
      case "ventilate":
      case "myth":
      default:
        reductionFactor = 0;
    }

    if (reductionFactor === 0) {
      return { ...hack, impact: null };
    }

    const baseline = indoorOutdoorPm25;
    const reduced = indoorOutdoorPm25 * (1 - reductionFactor);
    const impact: Impact = {
      cigaretteEquivalents: Math.max(0, partialDayCigaretteEquivalents(baseline, INDOOR_EXPOSURE_HOURS_PER_DAY) - partialDayCigaretteEquivalents(reduced, INDOOR_EXPOSURE_HOURS_PER_DAY)),
      exposureReductionPercent: reductionFactor * 100,
      co2eGramsAvoided: 0,
      pmGramsAvoided: Math.max(0, baseline - reduced),
    };
    return { ...hack, impact };
  });

  const sustainableAlternatives = narrative.sustainableAlternatives.map((alt) => {
    switch (alt.type) {
      case "public_transport": {
        const cleanerMode = profile.commuteMode === "metro" || profile.commuteMode === "bus" ? "walk" : "metro";
        const { co2eGramsAvoided, pmGramsAvoided } = transportSwitchImpact(profile.commuteMode, cleanerMode, profile.commuteDistanceKm);
        return {
          ...alt,
          effort: "Low" as const,
          impact: { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided, pmGramsAvoided },
        };
      }
      case "carpool": {
        const { co2eGramsAvoided, pmGramsAvoided } = carpoolImpact(profile.commuteDistanceKm, ASSUMED_CARPOOL_OCCUPANTS);
        return {
          ...alt,
          effort: "Free" as const,
          impact: { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided, pmGramsAvoided },
        };
      }
      case "avoid_burning": {
        const { co2eGramsAvoided, pmGramsAvoided } = avoidBurningImpact(ASSUMED_HOUSEHOLD_WASTE_BURN_KG_PER_WEEK);
        return {
          ...alt,
          effort: "Free" as const,
          impact: { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided, pmGramsAvoided },
        };
      }
      case "electric_heating": {
        const { co2eGramsAvoided, pmGramsAvoided } = heatingSwitchImpact(profile.heatingMethod, "electric");
        return {
          ...alt,
          effort: "Medium" as const,
          impact: { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided, pmGramsAvoided },
        };
      }
      default:
        return { ...alt, effort: "Low" as const, impact: zeroImpact() };
    }
  });

  const memberTypes: MemberType[] = [];
  if (profile.household.child > 0) memberTypes.push("child");
  if (profile.household.adult > 0) memberTypes.push("adult");
  if (profile.household.senior > 0) memberTypes.push("senior");
  if (profile.hasSensitiveMember) memberTypes.push("sensitive");
  if (memberTypes.length === 0) memberTypes.push("adult");

  const maskGuidance = memberTypes.map((memberType) => {
    const computed = getMaskGuidance(usAqi, memberType);
    const narrativeReason = narrative.maskGuidanceReasons.find((r) => r.memberType === memberType)?.reason;
    return {
      memberType,
      recommendation: computed.recommendation,
      reason: narrativeReason ?? computed.reason,
    };
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      source,
      language: profile.language,
      aqiBand,
      safetyOverrides: overrides,
    },
    bestOutdoorWindow: {
      startHour: bestWindow.startHour,
      endHour: bestWindow.endHour,
      noSafeWindow: bestWindow.noSafeWindow,
      explanation: narrative.bestOutdoorWindowExplanation,
    },
    routineTweaks,
    indoorHacks,
    sustainableAlternatives,
    maskGuidance,
    disclaimer:
      "Saans gives general wellness and lifestyle guidance, not medical advice. The \"cigarette-equivalent\" figure is a communication heuristic (not a clinical dose measurement) for comparing air pollution exposure. If you or a family member has breathing difficulty, chest pain, or any medical emergency, contact a doctor or emergency services immediately.",
  };
}

export { average24hPm25 };
