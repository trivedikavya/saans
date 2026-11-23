import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";
import { SelectField } from "../fields/SelectField";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

const HOME_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment/flat" },
  { value: "independent_house", label: "Independent house" },
  { value: "other", label: "Other" },
] as const;

const VENTILATION_OPTIONS = [
  { value: "windows", label: "Windows only" },
  { value: "ac", label: "Air conditioning only" },
  { value: "both", label: "Both windows and AC" },
  { value: "none", label: "Neither" },
] as const;

export function StepHome({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "homeStepTitle")}</legend>

      <SelectField id="home-type" label="Home type" value={profile.homeType} options={HOME_TYPE_OPTIONS} onChange={(value) => onChange({ homeType: value as Profile["homeType"] })} />
      <SelectField id="ventilation" label="Ventilation" value={profile.ventilation} options={VENTILATION_OPTIONS} onChange={(value) => onChange({ ventilation: value as Profile["ventilation"] })} />

      <label htmlFor="owns-purifier" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
        <input id="owns-purifier" type="checkbox" checked={profile.ownsPurifier} onChange={(e) => onChange({ ownsPurifier: e.target.checked })} className="h-4 w-4" />
        {t(language, "purifierLabel")}
      </label>
    </fieldset>
  );
}
