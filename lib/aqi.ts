/**
 * Deterministic AQI rules engine.
 *
 * Every function here is pure and framework-agnostic so it can run in the
 * browser (What-If simulator), in API routes (plan generation), and in
 * Vitest without mocking anything. This is the "safety layer" the product
 * brief requires to run BEFORE and AFTER the LLM: mask rules, outdoor
 * windows, and stay-indoors thresholds are all computed here, never by
 * Gemini.
 */
import { AQI_BANDS, type AqiBand, MANDATORY_MASK_AQI_THRESHOLD, NO_OUTDOOR_EXERTION_AQI_THRESHOLD, STAY_INDOORS_AQI_THRESHOLD } from "./constants";

export type MemberType = "child" | "adult" | "senior" | "sensitive";
export type MaskRecommendation = "N95_FFP2" | "cloth" | "none";

/** Returns the AQI band a given US AQI value falls into. Clamped to the documented 0-500 scale. */
export function getAqiBand(usAqi: number): AqiBand {
  const clamped = Math.max(0, Math.min(500, Math.round(usAqi)));
  const band = AQI_BANDS.find((b) => clamped >= b.range[0] && clamped <= b.range[1]);
  // Anything above the last documented range (500) still counts as hazardous.
  return band ?? AQI_BANDS[AQI_BANDS.length - 1];
}

/** True once AQI crosses the threshold where everyone should minimize time outdoors. */
export function shouldStayIndoors(usAqi: number): boolean {
  return usAqi > STAY_INDOORS_AQI_THRESHOLD;
}

/** True when strenuous outdoor exercise (running, sports, brisk cycling) is unsafe to recommend at all. */
export function isOutdoorExertionUnsafe(usAqi: number): boolean {
  return usAqi > NO_OUTDOOR_EXERTION_AQI_THRESHOLD;
}

/**
 * Deterministic mask guidance by AQI band and household member type.
 * Sensitive members (asthma/heart/pregnancy flag) are stepped up one tier
 * earlier than the general population, matching common public-health
 * guidance of extra caution for at-risk groups.
 */
export function getMaskGuidance(usAqi: number, memberType: MemberType): { recommendation: MaskRecommendation; reason: string } {
  const sensitiveEarlyThreshold = 101; // USG band: sensitive groups mask up a tier earlier than everyone else.

  if (usAqi >= MANDATORY_MASK_AQI_THRESHOLD) {
    return {
      recommendation: "N95_FFP2",
      reason: `AQI ${usAqi} is in the Unhealthy range or worse; a well-fitted N95/FFP2 is recommended for anyone going outdoors.`,
    };
  }

  if (memberType === "sensitive" && usAqi >= sensitiveEarlyThreshold) {
    return {
      recommendation: "N95_FFP2",
      reason: `AQI ${usAqi} can affect sensitive groups (asthma, heart conditions, pregnancy); an N95/FFP2 is recommended even though it is only "Unhealthy for Sensitive Groups".`,
    };
  }

  if (usAqi >= 51) {
    return {
      recommendation: "cloth",
      reason: `AQI ${usAqi} is Moderate; a cloth/surgical mask offers modest protection for short outdoor trips.`,
    };
  }

  return {
    recommendation: "none",
    reason: `AQI ${usAqi} is Good; no mask is needed for outdoor activity.`,
  };
}

export interface HourlyAirPoint {
  /** ISO-8601 local timestamp as returned by Open-Meteo with timezone=auto. */
  time: string;
  pm25: number;
  usAqi: number;
}

export interface BestOutdoorWindow {
  startHour: number;
  endHour: number;
  averageAqi: number;
  /** True when even the best available window is still unhealthy-or-worse. */
  noSafeWindow: boolean;
}

const AWAKE_HOURS_START = 5;
const AWAKE_HOURS_END = 22; // exclusive
const DEFAULT_WINDOW_LENGTH_HOURS = 3;

/**
 * Scans the next `horizonHours` of hourly forecast data (restricted to
 * "awake" hours, 05:00-22:00, since recommending a 2am outdoor window is
 * not actionable for families) and returns the contiguous block with the
 * lowest average AQI. This is 100% deterministic math -- the LLM is only
 * ever given the result to *explain*, never to invent.
 */
export function findBestOutdoorWindow(
  hourly: HourlyAirPoint[],
  options: { windowLengthHours?: number; horizonHours?: number } = {}
): BestOutdoorWindow {
  const windowLength = options.windowLengthHours ?? DEFAULT_WINDOW_LENGTH_HOURS;
  const horizon = options.horizonHours ?? 24;

  const awake = hourly.slice(0, horizon).filter((point) => {
    const hour = new Date(point.time).getHours();
    return hour >= AWAKE_HOURS_START && hour < AWAKE_HOURS_END;
  });

  if (awake.length === 0) {
    return { startHour: AWAKE_HOURS_START, endHour: AWAKE_HOURS_START + windowLength, averageAqi: 0, noSafeWindow: true };
  }

  let best: BestOutdoorWindow | null = null;

  for (let i = 0; i + windowLength <= awake.length; i++) {
    const slice = awake.slice(i, i + windowLength);
    const averageAqi = slice.reduce((sum, p) => sum + p.usAqi, 0) / slice.length;
    const startHour = new Date(slice[0].time).getHours();
    const endHour = startHour + windowLength;

    if (!best || averageAqi < best.averageAqi) {
      best = { startHour, endHour, averageAqi, noSafeWindow: false };
    }
  }

  if (!best) {
    return { startHour: AWAKE_HOURS_START, endHour: AWAKE_HOURS_START + windowLength, averageAqi: 0, noSafeWindow: true };
  }

  return { ...best, noSafeWindow: isOutdoorExertionUnsafe(best.averageAqi) };
}
