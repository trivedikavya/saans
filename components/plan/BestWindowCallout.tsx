/** Displays the deterministically-computed "best outdoor window" (see lib/aqi.ts findBestOutdoorWindow) and the LLM's plain-language explanation of it. */
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { PlanResponse } from "@/lib/schemas";

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:00 ${period}`;
}

export function BestWindowCallout({ window, language }: { window: PlanResponse["bestOutdoorWindow"]; language: SupportedLanguage }) {
  return (
    <section aria-labelledby="best-window-heading" className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
      <h2 id="best-window-heading" className="text-base font-semibold text-blue-900 dark:text-blue-200">
        {window.noSafeWindow ? t(language, "noSafeWindowToday") : t(language, "bestOutdoorWindow")}
      </h2>
      {!window.noSafeWindow && (
        <p className="mt-1 text-lg font-bold text-blue-800 dark:text-blue-100">
          {formatHour(window.startHour)} &ndash; {formatHour(window.endHour)}
        </p>
      )}
      <p className="mt-2 text-sm text-blue-900/80 dark:text-blue-200/80">{window.explanation}</p>
    </section>
  );
}
