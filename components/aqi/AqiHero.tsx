/** The color-coded AQI hero: current band, raw AQI number, PM2.5/PM10/weather stats, and the Open-Meteo data/time attribution. */
import { getAqiBand } from "@/lib/aqi";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";
import type { AirQualityResponse } from "@/lib/schemas";
import { AqiBadge } from "./AqiBadge";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function AqiHero({ data, language }: { data: AirQualityResponse; language: SupportedLanguage }) {
  const band = getAqiBand(data.current.usAqi);

  const stats: { label: string; value: string }[] = [
    { label: "PM2.5", value: `${data.current.pm25.toFixed(0)} microgram/m3` },
    { label: "PM10", value: `${data.current.pm10.toFixed(0)} microgram/m3` },
    { label: "Temperature", value: data.current.temperatureC != null ? `${data.current.temperatureC.toFixed(0)} degC` : "--" },
    { label: "Wind", value: data.current.windSpeedKmh != null ? `${data.current.windSpeedKmh.toFixed(0)} km/h` : "--" },
    { label: "Humidity", value: data.current.humidityPercent != null ? `${data.current.humidityPercent.toFixed(0)}%` : "--" },
    {
      label: "Boundary layer height (inversion proxy)",
      value: data.current.boundaryLayerHeightM != null ? `${data.current.boundaryLayerHeightM.toFixed(0)} m` : "--",
    },
  ];

  return (
    <section aria-labelledby="aqi-hero-heading" className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800" style={{ backgroundColor: band.bg, color: band.fg }}>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="aqi-hero-heading" className="text-sm font-medium uppercase tracking-wide opacity-80">
            {t(language, "currentAqi")} &middot; {data.location.name}
          </h2>
          <AqiBadge usAqi={data.current.usAqi} />
        </div>

        <div className="flex items-end gap-4">
          <span className="text-6xl font-extrabold leading-none sm:text-7xl" aria-hidden="true">
            {Math.round(data.current.usAqi)}
          </span>
          <p className="max-w-md pb-1 text-sm opacity-90">{band.summary}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="opacity-90">{stat.label}</dt>
              <dd className="font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-xs opacity-90">{t(language, "dataAttribution", { time: formatTime(data.fetchedAt) })}</p>
      </div>
    </section>
  );
}
