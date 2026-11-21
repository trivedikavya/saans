"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useAbortableFetch } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import type { AirQualityResponse, PlanResponse } from "@/lib/schemas";

type LoadState<T> = { status: "idle" | "loading" | "error"; data: T | null; message?: string } | { status: "success"; data: T };

export function DashboardClient() {
  const router = useRouter();
  const { profile, location } = useAppState();
  const language = profile?.language ?? "en";

  const [aqiState, setAqiState] = useState<LoadState<AirQualityResponse>>({ status: "idle", data: null });
  const [planState, setPlanState] = useState<LoadState<PlanResponse>>({ status: "idle", data: null });
  const nextAqiSignal = useAbortableFetch();

  useEffect(() => {
    if (!profile) router.replace("/onboarding");
  }, [profile, router]);

  // Fetch live + 48h forecast air quality whenever the selected location
  // changes. Guarded by AbortController cleanup below, so the setState
  // calls here are the intended result of a properly-cancelled async fetch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!location) return;
    setAqiState({ status: "loading", data: null });

    const signal = nextAqiSignal();
    const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), name: location.name });

    fetch(`/api/air-quality?${params}`, { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("air-quality request failed");
        return (await res.json()) as AirQualityResponse;
      })
      .then((data) => setAqiState({ status: "success", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAqiState({ status: "error", data: null, message: "Could not load air quality data." });
      });
    // nextAqiSignal is a stable function identity from useAbortableFetch; only `location` should retrigger this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Generate the plan once we have both a profile and current AQI data.
  useEffect(() => {
    if (!profile || aqiState.status !== "success" || !location) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlanState({ status: "loading", data: null });

    const controller = new AbortController();
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        profile,
        location,
        aqi: { usAqi: aqiState.data.current.usAqi, pm25: aqiState.data.current.pm25, pm10: aqiState.data.current.pm10 },
        hourly: aqiState.data.hourly,
        dateISO: new Date().toISOString().slice(0, 10),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("plan request failed");
        return (await res.json()) as PlanResponse;
      })
      .then((data) => setPlanState({ status: "success", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPlanState({ status: "error", data: null, message: "Could not build today's plan." });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, aqiState.status, location?.latitude, location?.longitude]);

  if (!profile) return null;

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {!location && <LocationSearch />}

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

        {location && aqiState.status !== "success" && <LocationSearch />}

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
