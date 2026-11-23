/** Renders the plan's sustainable alternatives (public transport, carpool, avoid burning, electric heating) with effort/cost tags. */
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";
import { PlanSection } from "./PlanSection";

const EFFORT_STYLES: Record<PlanResponse["sustainableAlternatives"][number]["effort"], string> = {
  Free: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200",
  Low: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200",
  Medium: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200",
};

export function SustainableAlternatives({ alternatives, language }: { alternatives: PlanResponse["sustainableAlternatives"]; language: SupportedLanguage }) {
  return (
    <PlanSection
      headingId="sustainable-alternatives-heading"
      heading={t(language, "sustainableAlternatives")}
      items={alternatives}
      getKey={(alt) => alt.id}
      renderItem={(alt) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{alt.title}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${EFFORT_STYLES[alt.effort]}`}>{alt.effort}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alt.description}</p>
          <ImpactChip impact={alt.impact} language={language} />
        </>
      )}
    />
  );
}
