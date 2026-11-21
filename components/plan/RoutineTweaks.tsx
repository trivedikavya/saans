import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";

export function RoutineTweaks({ tweaks, language }: { tweaks: PlanResponse["routineTweaks"]; language: SupportedLanguage }) {
  return (
    <section aria-labelledby="routine-tweaks-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="routine-tweaks-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "routineTweaks")}
      </h2>
      <ul className="flex flex-col gap-3">
        {tweaks.map((tweak) => (
          <li key={tweak.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{tweak.category}</p>
            <h3 className="font-semibold text-slate-900 dark:text-white">{tweak.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{tweak.description}</p>
            <ImpactChip impact={tweak.impact} language={language} />
          </li>
        ))}
      </ul>
    </section>
  );
}
