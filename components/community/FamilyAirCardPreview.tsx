/** Community Mode: preview + download of the server-generated "Family Air Card" share image. */
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardHeading } from "@/components/ui/Card";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";

export function FamilyAirCardPreview({ city, usAqi, language }: { city: string; usAqi: number; language: SupportedLanguage }) {
  const src = `/api/share-card?city=${encodeURIComponent(city)}&aqi=${Math.round(usAqi)}`;

  return (
    <Card>
      <CardHeading as="h3">{t(language, "familyAirCard")}</CardHeading>
      {/* Generated server-side via next/og; a plain <img> is correct here, not next/image, since the source is a dynamic API route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Family Air Card for ${city}: current AQI ${Math.round(usAqi)}`} className="w-full rounded-lg border border-slate-200 dark:border-slate-700" width={1200} height={630} />
      <a href={src} download={`saans-family-air-card-${city}.png`} className={`self-start ${buttonClassName("primary", "sm")}`}>
        {t(language, "downloadCard")}
      </a>
    </Card>
  );
}
