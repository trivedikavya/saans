"use client";

import { useAppState } from "@/app/providers";
import { t } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, toggleTheme, profile } = useAppState();
  const language = profile?.language ?? "en";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={theme === "dark" ? t(language, "themeToggleLight") : t(language, "themeToggleDark")}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
