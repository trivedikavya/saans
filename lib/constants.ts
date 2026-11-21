/**
 * Single source of truth for AQI band thresholds, colors, and copy.
 *
 * Thresholds follow the US EPA AQI breakpoints for PM2.5 (the same scale
 * Open-Meteo's `us_aqi` field reports), so we band directly on that value
 * instead of re-deriving AQI from concentration ourselves.
 * Source: https://www.airnow.gov/aqi/aqi-basics/
 *
 * Colors are deliberately darker/more saturated than the "textbook" AQI
 * palette so that white foreground text clears WCAG AA (4.5:1) against
 * every band. Verified by `scripts/check-contrast.ts` (`npm run check:contrast`).
 * AQI state must never be conveyed by color alone: every badge pairs the
 * color with a distinct icon (lib/constants.ts -> AQI_ICON_KIND) and a text
 * label.
 */

export const AQI_BANDS = [
  {
    key: "good",
    label: "Good",
    range: [0, 50],
    bg: "#14532d",
    fg: "#ffffff",
    icon: "check" as const,
    summary: "Air quality is satisfactory for everyone.",
  },
  {
    key: "moderate",
    label: "Moderate",
    range: [51, 100],
    bg: "#854d0e",
    fg: "#ffffff",
    icon: "cloud" as const,
    summary: "Acceptable, but unusually sensitive people should watch for symptoms.",
  },
  {
    key: "usg",
    label: "Unhealthy for Sensitive Groups",
    range: [101, 150],
    bg: "#9a3412",
    fg: "#ffffff",
    icon: "mask" as const,
    summary: "Children, seniors, and people with heart/lung conditions should reduce prolonged outdoor exertion.",
  },
  {
    key: "unhealthy",
    label: "Unhealthy",
    range: [151, 200],
    bg: "#991b1b",
    fg: "#ffffff",
    icon: "alert" as const,
    summary: "Everyone may begin to experience health effects; sensitive groups more seriously.",
  },
  {
    key: "very-unhealthy",
    label: "Very Unhealthy",
    range: [201, 300],
    bg: "#6b21a8",
    fg: "#ffffff",
    icon: "alert-triangle" as const,
    summary: "Health alert: everyone may experience more serious health effects.",
  },
  {
    key: "hazardous",
    label: "Hazardous",
    range: [301, 500],
    bg: "#4c0519",
    fg: "#ffffff",
    icon: "hazard" as const,
    summary: "Health warning of emergency conditions. Entire population is more likely to be affected.",
  },
] as const;

export type AqiBandKey = (typeof AQI_BANDS)[number]["key"];
export type AqiBand = (typeof AQI_BANDS)[number];

/** AQI threshold above which the deterministic safety layer forbids any outdoor-exertion suggestion. */
export const NO_OUTDOOR_EXERTION_AQI_THRESHOLD = 200;

/** AQI threshold above which "stay indoors as much as possible" is mandatory guidance for everyone. */
export const STAY_INDOORS_AQI_THRESHOLD = 300;

/** AQI threshold above which N95/FFP2 masks are mandatory guidance (not optional) for all outdoor members. */
export const MANDATORY_MASK_AQI_THRESHOLD = 150;

export const SUPPORTED_LANGUAGES = ["en", "hi", "gu"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  gu: "ગુજરાતી (Gujarati)",
};

/** BCP-47 lang attribute values for <html lang> / aria purposes. */
export const LANGUAGE_BCP47: Record<SupportedLanguage, string> = {
  en: "en",
  hi: "hi",
  gu: "gu",
};
