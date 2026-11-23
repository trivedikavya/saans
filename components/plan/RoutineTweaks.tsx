/** Renders the plan's "routine tweaks" (commute/school/exercise/errands timing suggestions). */
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";
import { PlanSection } from "./PlanSection";

export function RoutineTweaks({ tweaks, language }: { tweaks: PlanResponse["routineTweaks"]; language: SupportedLanguage }) {
  return (
    <PlanSection
      headingId="routine-tweaks-heading"
      heading={t(language, "routineTweaks")}
      items={tweaks}
      getKey={(tweak) => tweak.id}
      renderItem={(tweak) => (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{tweak.category}</p>
          <h3 className="font-semibold text-slate-900 dark:text-white">{tweak.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{tweak.description}</p>
          <ImpactChip impact={tweak.impact} language={language} />
        </>
      )}
    />
  );
}
