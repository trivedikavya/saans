import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";

export function SafetyOverrideNotice({ overrides, language }: { overrides: PlanResponse["meta"]["safetyOverrides"]; language: SupportedLanguage }) {
  if (overrides.length === 0) return null;

  return (
    <div role="status" className="flex flex-col gap-1 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
      <p className="font-semibold">{t(language, "safetyAdjustedBadge")}</p>
      <ul className="list-inside list-disc">
        {overrides.map((o, i) => (
          <li key={i}>{o.reason}</li>
        ))}
      </ul>
    </div>
  );
}
