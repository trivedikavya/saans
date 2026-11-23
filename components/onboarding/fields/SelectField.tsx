/** A labeled <select> with the onboarding wizard's standard styling -- used by every step that offers a closed set of choices (home type, ventilation, cooking fuel, heating method). */
export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
