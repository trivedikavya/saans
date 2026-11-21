import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Profile } from "@/lib/schemas";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

export function StepLanguage({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "languageStepTitle")}</legend>
      <div role="radiogroup" aria-label="Language" className="flex flex-col gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <label
            key={lang}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:has-[:checked]:bg-blue-950"
          >
            <input type="radio" name="language" value={lang} checked={profile.language === lang} onChange={() => onChange({ language: lang })} className="h-4 w-4" />
            {LANGUAGE_LABELS[lang]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
