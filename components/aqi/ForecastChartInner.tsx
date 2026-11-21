"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HourlyAirPointData } from "@/lib/schemas";

function formatHourLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "numeric" });
}

export default function ForecastChartInner({ hourly }: { hourly: HourlyAirPointData[] }) {
  const points = hourly.slice(0, 48).map((p) => ({ label: formatHourLabel(p.time), usAqi: Math.round(p.usAqi), pm25: Math.round(p.pm25) }));

  return (
    <div aria-hidden="true" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* accessibilityLayer=false: the chart lives inside an aria-hidden wrapper because we
            provide a proper text summary + data table alternative (see ForecastChart.tsx);
            Recharts' own focusable a11y layer would otherwise leave focusable elements inside
            an aria-hidden container, which is itself an accessibility violation. */}
        <LineChart data={points} accessibilityLayer={false} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="label" interval={5} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Line type="monotone" dataKey="usAqi" stroke="#2563eb" strokeWidth={2} dot={false} name="US AQI" />
          <Line type="monotone" dataKey="pm25" stroke="#dc2626" strokeWidth={2} dot={false} name="PM2.5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
