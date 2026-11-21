/**
 * Deterministic safety layer.
 *
 * Runs TWICE around every Gemini call:
 *   1. BEFORE: `buildSafetyConstraintsPrompt` injects hard numeric rules
 *      into the system prompt so the model is told what it must not say.
 *   2. AFTER: `applySafetyOverrides` re-checks the model's (or the
 *      fallback template's) narrative text against the same rules and
 *      rewrites anything that violates them, logging a `SafetyOverride` so
 *      the UI can show "Adjusted for safety".
 *
 * Nothing here trusts the LLM to have followed instructions -- rule (2) is
 * what actually guarantees safety, rule (1) just reduces how often it has
 * to fire.
 */
import { isOutdoorExertionUnsafe, shouldStayIndoors } from "./aqi";
import type { GeminiPlanNarrative } from "./schemas";

export interface SafetyOverride {
  field: string;
  reason: string;
}

const UNSAFE_OUTDOOR_EXERTION_KEYWORDS = ["run", "jog", "outdoor exercise", "play outside", "outdoor sport", "outdoor workout", "cycle outside", "brisk walk outside"];
const ENCOURAGES_GOING_OUT_KEYWORDS = ["go outside", "head out", "enjoy the outdoors", "spend time outside", "great time to be outside"];
const DISMISSES_MASK_KEYWORDS = ["no mask needed", "mask is not necessary", "don't need a mask", "skip the mask"];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/** Hard constraints injected into the Gemini system prompt before generation. */
export function buildSafetyConstraintsPrompt(usAqi: number): string {
  const lines: string[] = [];

  if (isOutdoorExertionUnsafe(usAqi)) {
    lines.push(
      `- Current AQI is ${usAqi}, which is above the safe threshold for outdoor exertion. Do NOT suggest running, jogging, outdoor sport, or any strenuous outdoor exercise. Suggest indoor alternatives instead.`
    );
  }

  if (shouldStayIndoors(usAqi)) {
    lines.push(
      `- Current AQI is ${usAqi} (hazardous range). Do NOT encourage going outside or spending time outdoors for any reason beyond essential travel. Emphasize staying indoors.`
    );
  }

  if (lines.length === 0) {
    return "- No special outdoor-activity restrictions apply at the current AQI, but always mention sensible precautions.";
  }

  return lines.join("\n");
}

/**
 * Re-validates narrative text against the deterministic rules and rewrites
 * any violation. Returns the (possibly modified) narrative plus a list of
 * overrides applied, which the UI surfaces transparently.
 */
export function applySafetyOverrides(narrative: GeminiPlanNarrative, usAqi: number): { narrative: GeminiPlanNarrative; overrides: SafetyOverride[] } {
  const overrides: SafetyOverride[] = [];
  const next: GeminiPlanNarrative = structuredClone(narrative);

  if (isOutdoorExertionUnsafe(usAqi)) {
    next.routineTweaks = next.routineTweaks.map((tweak) => {
      if (tweak.category === "exercise" && containsAny(`${tweak.title} ${tweak.description}`, UNSAFE_OUTDOOR_EXERTION_KEYWORDS)) {
        overrides.push({
          field: `routineTweaks.${tweak.id}`,
          reason: `AQI ${usAqi} makes outdoor exertion unsafe; the suggestion was replaced with an indoor alternative.`,
        });
        return {
          ...tweak,
          title: "Move exercise indoors",
          description: `At AQI ${usAqi}, outdoor exercise is not safe. Swap today's session for indoor stretching, bodyweight training, or a well-ventilated indoor space instead.`,
        };
      }
      return tweak;
    });
  }

  if (shouldStayIndoors(usAqi) && containsAny(next.bestOutdoorWindowExplanation, ENCOURAGES_GOING_OUT_KEYWORDS)) {
    overrides.push({
      field: "bestOutdoorWindowExplanation",
      reason: `AQI ${usAqi} is hazardous; text that encouraged going outside was replaced with a stay-indoors message.`,
    });
    next.bestOutdoorWindowExplanation = `AQI ${usAqi} is in the hazardous range today. There is no genuinely safe outdoor window -- keep outdoor time to essential trips only, and wear an N95/FFP2 mask if you must go out.`;
  }

  next.maskGuidanceReasons = next.maskGuidanceReasons.map((entry) => {
    if (usAqi >= 150 && containsAny(entry.reason, DISMISSES_MASK_KEYWORDS)) {
      overrides.push({
        field: `maskGuidanceReasons.${entry.memberType}`,
        reason: `AQI ${usAqi} requires mask use; text dismissing masks was corrected.`,
      });
      return {
        ...entry,
        reason: `AQI ${usAqi} is Unhealthy or worse; a well-fitted N95/FFP2 mask is recommended outdoors.`,
      };
    }
    return entry;
  });

  return { narrative: next, overrides };
}
