import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

function CountField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
        className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right dark:border-slate-600 dark:bg-slate-900"
      />
    </div>
  );
}

export function StepHousehold({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "householdStepTitle")}</legend>
      <CountField id="household-child" label="Children" value={profile.household.child} onChange={(n) => onChange({ household: { ...profile.household, child: n } })} />
      <CountField id="household-adult" label="Adults" value={profile.household.adult} onChange={(n) => onChange({ household: { ...profile.household, adult: n } })} />
      <CountField id="household-senior" label="Seniors" value={profile.household.senior} onChange={(n) => onChange({ household: { ...profile.household, senior: n } })} />

      <label htmlFor="household-sensitive" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
        <input
          id="household-sensitive"
          type="checkbox"
          checked={profile.hasSensitiveMember}
          onChange={(e) => onChange({ hasSensitiveMember: e.target.checked })}
          className="h-4 w-4"
        />
        {t(language, "householdSensitiveLabel")}
      </label>
    </fieldset>
  );
}
