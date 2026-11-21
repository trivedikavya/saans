import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { Impact } from "@/lib/schemas";

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Renders the two code-computed Impact numbers the product brief calls
 * for: exposure/cigarette-equivalents and emissions (CO2e/PM) avoided.
 * These numbers come straight from lib/impact.ts -- this component never
 * computes or alters them, it only formats what it's given.
 */
export function ImpactChip({ impact, language }: { impact: Impact | null; language: SupportedLanguage }) {
  if (!impact) return null;

  const hasExposureFigure = impact.cigaretteEquivalents > 0.01 || impact.exposureReductionPercent > 0.5;
  const hasEmissionsFigure = impact.co2eGramsAvoided > 0.5 || impact.pmGramsAvoided > 0.01;

  if (!hasExposureFigure && !hasEmissionsFigure) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {hasExposureFigure && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
          -{round(impact.cigaretteEquivalents, 2)} {t(language, "simulatorResultCigs")} ({round(impact.exposureReductionPercent, 0)}% {t(language, "simulatorResultExposure")})
        </span>
      )}
      {hasEmissionsFigure && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-200">
          -{round(impact.co2eGramsAvoided, 0)}g CO2e &middot; -{round(impact.pmGramsAvoided, 2)}g PM
        </span>
      )}
    </div>
  );
}
