"use client";

import { useAppState } from "@/app/providers";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { t } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { profile, setProfile } = useAppState();
  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-switcher" className="sr-only">
        {t(profile.language, "languageLabel")}
      </label>
      <select
        id="language-switcher"
        value={profile.language}
        onChange={(e) => setProfile({ ...profile, language: e.target.value as (typeof SUPPORTED_LANGUAGES)[number] })}
        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
