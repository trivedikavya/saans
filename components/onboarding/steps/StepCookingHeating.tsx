import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";
import { SelectField } from "../fields/SelectField";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

const COOKING_FUEL_OPTIONS = [
  { value: "lpg", label: "LPG" },
  { value: "induction", label: "Induction/electric" },
  { value: "wood", label: "Wood/biomass" },
  { value: "other", label: "Other" },
] as const;

const HEATING_METHOD_OPTIONS = [
  { value: "electric", label: "Electric" },
  { value: "gas", label: "Gas" },
  { value: "wood_coal", label: "Wood/coal" },
  { value: "none", label: "None" },
  { value: "other", label: "Other" },
] as const;

export function StepCookingHeating({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "cookingHeatingStepTitle")}</legend>

      <SelectField id="cooking-fuel" label="Cooking fuel" value={profile.cookingFuel} options={COOKING_FUEL_OPTIONS} onChange={(value) => onChange({ cookingFuel: value as Profile["cookingFuel"] })} />
      <SelectField
        id="heating-method"
        label="Heating method"
        value={profile.heatingMethod}
        options={HEATING_METHOD_OPTIONS}
        onChange={(value) => onChange({ heatingMethod: value as Profile["heatingMethod"] })}
      />
    </fieldset>
  );
}
