"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import type { HourlyAirPointData } from "@/lib/schemas";

// Recharts is lazy-loaded (code-split) since it's only needed once the
// dashboard has data -- keeps it out of the initial bundle for the
// onboarding/landing routes.
const ForecastChartInner = dynamic(() => import("./ForecastChartInner"), {
  ssr: false,
  loading: () => <div className="flex h-64 w-full items-center justify-center text-sm text-slate-600 dark:text-slate-400">Loading chart…</div>,
});

export function ForecastChart({ hourly }: { hourly: HourlyAirPointData[] }) {
  const [showTable, setShowTable] = useState(false);
  const descriptionId = useId();
  const next24 = hourly.slice(0, 24);
  const minAqi = Math.min(...next24.map((p) => p.usAqi));
  const maxAqi = Math.max(...next24.map((p) => p.usAqi));

  return (
    <section aria-labelledby="forecast-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="forecast-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        48-hour forecast
      </h2>
      <p id={descriptionId} className="text-sm text-slate-600 dark:text-slate-400">
        Over the next 24 hours, US AQI ranges from {Math.round(minAqi)} to {Math.round(maxAqi)}. Line chart of hourly US AQI (blue) and PM2.5 (red); use the data table below for exact values.
      </p>

      <div aria-describedby={descriptionId}>
        <ForecastChartInner hourly={hourly} />
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="self-start text-sm font-medium text-blue-700 underline hover:no-underline dark:text-blue-400"
        aria-expanded={showTable}
      >
        {showTable ? "Hide data table" : "Show data table"}
      </button>

      {showTable && (
        <div className="max-h-64 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Hourly forecast data table: time, US AQI, and PM2.5</caption>
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Time
                </th>
                <th scope="col" className="px-3 py-2">
                  US AQI
                </th>
                <th scope="col" className="px-3 py-2">
                  PM2.5 (microgram/m3)
                </th>
              </tr>
            </thead>
            <tbody>
              {next24.map((p) => (
                <tr key={p.time} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-1.5">{new Date(p.time).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", weekday: "short" })}</td>
                  <td className="px-3 py-1.5">{Math.round(p.usAqi)}</td>
                  <td className="px-3 py-1.5">{Math.round(p.pm25)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
