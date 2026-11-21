"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import { PLEDGE_ITEMS, sumPledgeImpact } from "@/lib/pledge";
import { getStoredPledgeChecks, setStoredPledgeChecks } from "@/lib/storage";

export function NeighborhoodPledge({ language }: { language: SupportedLanguage }) {
  const [checked, setChecked] = useState<string[]>([]);

  // One-time client-only hydration from localStorage (no server-side value exists to read during render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(getStoredPledgeChecks());
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      setStoredPledgeChecks(next);
      return next;
    });
  }

  const totals = sumPledgeImpact(checked);

  return (
    <section aria-labelledby="pledge-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 id="pledge-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
        {t(language, "pledgeTitle")}
      </h3>
      <p aria-live="polite" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        {t(language, "pledgeCounter", { count: checked.length, total: PLEDGE_ITEMS.length })} &middot; {Math.round(totals.co2eGramsAvoidedPerDay)}g CO2e &middot; {totals.pmGramsAvoidedPerDay.toFixed(2)}g PM avoided/day
      </p>
      <ul className="flex flex-col gap-2">
        {PLEDGE_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} className="h-4 w-4" />
              {item.label[language]}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
