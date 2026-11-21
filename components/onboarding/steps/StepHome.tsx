import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

export function StepHome({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "homeStepTitle")}</legend>

      <div className="flex flex-col gap-1">
        <label htmlFor="home-type" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Home type
        </label>
        <select
          id="home-type"
          value={profile.homeType}
          onChange={(e) => onChange({ homeType: e.target.value as Profile["homeType"] })}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="apartment">Apartment/flat</option>
          <option value="independent_house">Independent house</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ventilation" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Ventilation
        </label>
        <select
          id="ventilation"
          value={profile.ventilation}
          onChange={(e) => onChange({ ventilation: e.target.value as Profile["ventilation"] })}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="windows">Windows only</option>
          <option value="ac">Air conditioning only</option>
          <option value="both">Both windows and AC</option>
          <option value="none">Neither</option>
        </select>
      </div>

      <label htmlFor="owns-purifier" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
        <input id="owns-purifier" type="checkbox" checked={profile.ownsPurifier} onChange={(e) => onChange({ ownsPurifier: e.target.checked })} className="h-4 w-4" />
        {t(language, "purifierLabel")}
      </label>
    </fieldset>
  );
}
