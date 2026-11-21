"use client";

import { useMemo, useState } from "react";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import { DEFAULT_SIMULATOR_TOGGLES, simulateImpact, type SimulatorToggles } from "@/lib/simulator";

interface Props {
  pm25: number;
  commuteMode: string;
  commuteDistanceKm: number;
  language: SupportedLanguage;
}

const TOGGLE_KEYS: { key: keyof SimulatorToggles; labelKey: "simulatorUsePurifier" | "simulatorSwitchMetro" | "simulatorSkipWalk" | "simulatorSealWindows" }[] = [
  { key: "usePurifier", labelKey: "simulatorUsePurifier" },
  { key: "switchToMetro", labelKey: "simulatorSwitchMetro" },
  { key: "skipMorningWalk", labelKey: "simulatorSkipWalk" },
  { key: "sealWindowsAtPeak", labelKey: "simulatorSealWindows" },
];

export default function WhatIfSimulatorInner({ pm25, commuteMode, commuteDistanceKm, language }: Props) {
  const [toggles, setToggles] = useState<SimulatorToggles>(DEFAULT_SIMULATOR_TOGGLES);

  const result = useMemo(() => simulateImpact({ pm25, commuteMode, commuteDistanceKm, toggles }), [pm25, commuteMode, commuteDistanceKm, toggles]);

  function toggle(key: keyof SimulatorToggles) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section aria-labelledby="simulator-heading" className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="simulator-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "simulatorTitle")}
      </h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TOGGLE_KEYS.map(({ key, labelKey }) => (
          <label key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={toggles[key]} onChange={() => toggle(key)} className="h-4 w-4" />
            {t(language, labelKey)}
          </label>
        ))}
      </div>

      <dl aria-live="polite" className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800 sm:grid-cols-4">
        <div>
          <dt className="text-slate-600 dark:text-slate-400">{t(language, "simulatorResultExposure")}</dt>
          <dd data-testid="simulator-exposure-reduction" className="text-lg font-bold text-slate-900 dark:text-white">
            {result.exposureReductionPercent.toFixed(0)}%
          </dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">{t(language, "simulatorResultCigs")}</dt>
          <dd className="text-lg font-bold text-slate-900 dark:text-white">{result.cigaretteEquivalents.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">{t(language, "simulatorResultCo2e")}</dt>
          <dd className="text-lg font-bold text-slate-900 dark:text-white">{result.co2eGramsAvoided.toFixed(0)}g</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">{t(language, "simulatorResultPm")}</dt>
          <dd className="text-lg font-bold text-slate-900 dark:text-white">{result.pmGramsAvoided.toFixed(2)}g</dd>
        </div>
      </dl>
      <p className="text-xs text-slate-600 dark:text-slate-400">{t(language, "cigaretteEquivalentNote")}</p>
    </section>
  );
}
