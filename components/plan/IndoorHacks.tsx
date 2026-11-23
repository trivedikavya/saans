/** Renders the plan's indoor air hacks: ventilation timing, purifier placement, DIY air cleaner, cooking ventilation, and myth-busting. */
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";
import { PlanSection } from "./PlanSection";

const TYPE_LABELS: Record<PlanResponse["indoorHacks"][number]["type"], string> = {
  ventilate: "When to ventilate",
  seal: "When to seal",
  purifier: "Purifier placement",
  cooking: "Cooking ventilation",
  diy: "DIY air cleaner",
  myth: "Myth-busting",
};

export function IndoorHacks({ hacks, language }: { hacks: PlanResponse["indoorHacks"]; language: SupportedLanguage }) {
  return (
    <PlanSection
      headingId="indoor-hacks-heading"
      heading={t(language, "indoorHacks")}
      items={hacks}
      getKey={(hack) => hack.id}
      getItemClassName={(hack) => (hack.type === "myth" ? "rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50" : undefined)}
      renderItem={(hack) => (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{TYPE_LABELS[hack.type]}</p>
          <h3 className="font-semibold text-slate-900 dark:text-white">{hack.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{hack.description}</p>
          <ImpactChip impact={hack.impact} language={language} />
        </>
      )}
    />
  );
}
