import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

export function StepCookingHeating({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "cookingHeatingStepTitle")}</legend>

      <div className="flex flex-col gap-1">
        <label htmlFor="cooking-fuel" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Cooking fuel
        </label>
        <select
          id="cooking-fuel"
          value={profile.cookingFuel}
          onChange={(e) => onChange({ cookingFuel: e.target.value as Profile["cookingFuel"] })}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="lpg">LPG</option>
          <option value="induction">Induction/electric</option>
          <option value="wood">Wood/biomass</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="heating-method" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Heating method
        </label>
        <select
          id="heating-method"
          value={profile.heatingMethod}
          onChange={(e) => onChange({ heatingMethod: e.target.value as Profile["heatingMethod"] })}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="electric">Electric</option>
          <option value="gas">Gas</option>
          <option value="wood_coal">Wood/coal</option>
          <option value="none">None</option>
          <option value="other">Other</option>
        </select>
      </div>
    </fieldset>
  );
}
