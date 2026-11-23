"use client";

/** Dashboard page: composes the AQI hero, generated plan, simulator, community mode, and Ask Saans around the two data-fetching hooks in lib/useDashboardData.ts. */
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppState } from "@/app/providers";
import { AqiHero } from "@/components/aqi/AqiHero";
import { ForecastChart } from "@/components/aqi/ForecastChart";
import { LocationSearch } from "@/components/aqi/LocationSearch";
import { AskSaans } from "@/components/chat/AskSaans";
import { FamilyAirCardPreview } from "@/components/community/FamilyAirCardPreview";
import { NeighborhoodPledge } from "@/components/community/NeighborhoodPledge";
import { WhatsAppBrief } from "@/components/community/WhatsAppBrief";
import { Header } from "@/components/layout/Header";
import { PlanView } from "@/components/plan/PlanView";
import { WhatIfSimulator } from "@/components/simulator/WhatIfSimulator";
import { t } from "@/lib/i18n";
import { useAirQuality, usePlan } from "@/lib/useDashboardData";

export function DashboardClient() {
  const router = useRouter();
  const { profile, location } = useAppState();
  const language = profile?.language ?? "en";

  const aqiState = useAirQuality(location);
  const planState = usePlan(profile, location, aqiState);

  useEffect(() => {
    if (!profile) router.replace("/onboarding");
  }, [profile, router]);

  if (!profile) return null;

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {(!location || aqiState.status !== "success") && <LocationSearch />}

        {location && aqiState.status === "loading" && (
          <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
            {t(language, "loading")}
          </p>
        )}

        {location && aqiState.status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {aqiState.message}
          </p>
        )}

        {aqiState.status === "success" && (
          <>
            <AqiHero data={aqiState.data} language={language} />
            <LocationSearch />
            <ForecastChart hourly={aqiState.data.hourly} />

            {planState.status === "loading" && (
              <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
                {t(language, "generatingPlan")}
              </p>
            )}
            {planState.status === "error" && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {planState.message}
              </p>
            )}
            {planState.status === "success" && (
              <>
                <PlanView plan={planState.data} language={language} />
                <WhatIfSimulator pm25={aqiState.data.current.pm25} commuteMode={profile.commuteMode} commuteDistanceKm={profile.commuteDistanceKm} language={language} />
              </>
            )}

            <section aria-labelledby="community-heading" className="flex flex-col gap-4">
              <h2 id="community-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                {t(language, "communityTitle")}
              </h2>
              <FamilyAirCardPreview city={aqiState.data.location.name} usAqi={aqiState.data.current.usAqi} language={language} />
              <WhatsAppBrief city={aqiState.data.location.name} usAqi={aqiState.data.current.usAqi} language={language} />
              <NeighborhoodPledge language={language} />
            </section>

            <AskSaans usAqi={aqiState.data.current.usAqi} pm25={aqiState.data.current.pm25} locationName={aqiState.data.location.name} language={language} />
          </>
        )}
      </main>
    </>
  );
}
