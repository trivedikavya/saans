import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";

const EFFORT_STYLES: Record<PlanResponse["sustainableAlternatives"][number]["effort"], string> = {
  Free: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200",
  Low: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200",
  Medium: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200",
};

export function SustainableAlternatives({ alternatives, language }: { alternatives: PlanResponse["sustainableAlternatives"]; language: SupportedLanguage }) {
  return (
    <section aria-labelledby="sustainable-alternatives-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="sustainable-alternatives-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "sustainableAlternatives")}
      </h2>
      <ul className="flex flex-col gap-3">
        {alternatives.map((alt) => (
          <li key={alt.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">{alt.title}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${EFFORT_STYLES[alt.effort]}`}>{alt.effort}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alt.description}</p>
            <ImpactChip impact={alt.impact} language={language} />
          </li>
        ))}
      </ul>
    </section>
  );
}
