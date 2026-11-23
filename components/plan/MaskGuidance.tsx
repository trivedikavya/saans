/** Renders deterministic mask guidance (N95/FFP2, cloth, or none) per household member type. */
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { PlanSection } from "./PlanSection";

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
    <PlanSection
      headingId="mask-guidance-heading"
      heading={t(language, "maskGuidance")}
      items={guidance}
      getKey={(entry) => entry.memberType}
      renderItem={(entry) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold capitalize text-slate-900 dark:text-white">{entry.memberType}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RECOMMENDATION_STYLES[entry.recommendation]}`}>{RECOMMENDATION_LABELS[entry.recommendation]}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{entry.reason}</p>
        </>
      )}
    />
  );
}
