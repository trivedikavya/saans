import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { BestWindowCallout } from "./BestWindowCallout";
import { IndoorHacks } from "./IndoorHacks";
import { MaskGuidance } from "./MaskGuidance";
import { OfflineBadge } from "./OfflineBadge";
import { RoutineTweaks } from "./RoutineTweaks";
import { SafetyOverrideNotice } from "./SafetyOverrideNotice";
import { SustainableAlternatives } from "./SustainableAlternatives";

export function PlanView({ plan, language }: { plan: PlanResponse; language: SupportedLanguage }) {
  return (
    <div aria-live="polite" className="flex flex-col gap-4">
      {plan.meta.source === "fallback" && <OfflineBadge language={language} />}
      <SafetyOverrideNotice overrides={plan.meta.safetyOverrides} language={language} />

      <BestWindowCallout window={plan.bestOutdoorWindow} language={language} />
      <RoutineTweaks tweaks={plan.routineTweaks} language={language} />
      <IndoorHacks hacks={plan.indoorHacks} language={language} />
      <SustainableAlternatives alternatives={plan.sustainableAlternatives} language={language} />
      <MaskGuidance guidance={plan.maskGuidance} language={language} />

      <p className="text-xs text-slate-600 dark:text-slate-400">
        <strong className="font-semibold">{t(language, "medicalDisclaimer")}:</strong> {plan.disclaimer}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">{t(language, "cigaretteEquivalentNote")}</p>
    </div>
  );
}
