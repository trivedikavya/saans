import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";
import { ImpactChip } from "./ImpactChip";

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
    <section aria-labelledby="indoor-hacks-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="indoor-hacks-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "indoorHacks")}
      </h2>
      <ul className="flex flex-col gap-3">
        {hacks.map((hack) => (
          <li
            key={hack.id}
            className={`rounded-lg border p-3 ${hack.type === "myth" ? "border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" : "border-slate-100 dark:border-slate-800"}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{TYPE_LABELS[hack.type]}</p>
            <h3 className="font-semibold text-slate-900 dark:text-white">{hack.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{hack.description}</p>
            <ImpactChip impact={hack.impact} language={language} />
          </li>
        ))}
      </ul>
    </section>
  );
}
