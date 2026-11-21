import type { Profile } from "@/lib/schemas";
import { t } from "@/lib/i18n";

interface Props {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
}

const MODES: { value: Profile["commuteMode"]; label: string }[] = [
  { value: "walk", label: "Walk" },
  { value: "cycle", label: "Cycle" },
  { value: "bike", label: "Motorbike/scooter" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "metro", label: "Metro/rail" },
  { value: "auto", label: "Auto-rickshaw" },
];

export function StepCommute({ profile, onChange }: Props) {
  const language = profile.language;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, "commuteStepTitle")}</legend>

      <div role="radiogroup" aria-label="Commute mode" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MODES.map((mode) => (
          <label
            key={mode.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:has-[:checked]:bg-blue-950"
          >
            <input type="radio" name="commuteMode" value={mode.value} checked={profile.commuteMode === mode.value} onChange={() => onChange({ commuteMode: mode.value })} className="h-4 w-4" />
            {mode.label}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <label htmlFor="commute-distance" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t(language, "commuteDistanceLabel")}
        </label>
        <input
          id="commute-distance"
          type="number"
          inputMode="decimal"
          min={0}
          max={200}
          value={profile.commuteDistanceKm}
          onChange={(e) => onChange({ commuteDistanceKm: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-right dark:border-slate-600 dark:bg-slate-900"
        />
      </div>
    </fieldset>
  );
}
