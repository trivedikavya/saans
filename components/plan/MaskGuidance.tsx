import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";

const RECOMMENDATION_LABELS: Record<PlanResponse["maskGuidance"][number]["recommendation"], string> = {
  N95_FFP2: "N95 / FFP2",
  cloth: "Cloth mask",
  none: "No mask needed",
};

const RECOMMENDATION_STYLES: Record<PlanResponse["maskGuidance"][number]["recommendation"], string> = {
  N95_FFP2: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  cloth: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200",
  none: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200",
};

export function MaskGuidance({ guidance, language }: { guidance: PlanResponse["maskGuidance"]; language: SupportedLanguage }) {
  return (
    <section aria-labelledby="mask-guidance-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="mask-guidance-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "maskGuidance")}
      </h2>
      <ul className="flex flex-col gap-3">
        {guidance.map((entry) => (
          <li key={entry.memberType} className="flex flex-col gap-1 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold capitalize text-slate-900 dark:text-white">{entry.memberType}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RECOMMENDATION_STYLES[entry.recommendation]}`}>{RECOMMENDATION_LABELS[entry.recommendation]}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{entry.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
