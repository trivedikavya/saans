import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";

/** Shown whenever the plan came from the rule-based fallback instead of Gemini -- the app must never silently pretend AI is on. */
export function OfflineBadge({ language }: { language: SupportedLanguage }) {
  return (
    <p role="status" className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
      {t(language, "offlineModeBadge")}
    </p>
  );
}
