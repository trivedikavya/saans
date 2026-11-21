import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";

export function FamilyAirCardPreview({ city, usAqi, language }: { city: string; usAqi: number; language: SupportedLanguage }) {
  const src = `/api/share-card?city=${encodeURIComponent(city)}&aqi=${Math.round(usAqi)}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t(language, "familyAirCard")}</h3>
      {/* Generated server-side via next/og; a plain <img> is correct here, not next/image, since the source is a dynamic API route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Family Air Card for ${city}: current AQI ${Math.round(usAqi)}`} className="w-full rounded-lg border border-slate-200 dark:border-slate-700" width={1200} height={630} />
      <a href={src} download={`saans-family-air-card-${city}.png`} className="self-start rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        {t(language, "downloadCard")}
      </a>
    </div>
  );
}
