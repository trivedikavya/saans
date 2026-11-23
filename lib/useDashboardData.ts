"use client";

/**
 * Dashboard data-fetching hooks. Pulled out of DashboardClient.tsx so that
 * component stays a thin composition/rendering layer, and so each fetch's
 * loading/error/cancellation logic is isolated, named, and independently
 * reasoned about (single responsibility) rather than living inline inside
 * a large component alongside unrelated JSX.
 */
import { useEffect, useState } from "react";
import { useAbortableFetch } from "./hooks";
import type { AirQualityResponse, Location, PlanResponse, Profile } from "./schemas";

export type LoadState<T> = { status: "idle" | "loading" | "error"; data: T | null; message?: string } | { status: "success"; data: T };

const IDLE_STATE = { status: "idle", data: null } as const;

/** Fetches live + 48h-forecast air quality whenever `location` changes, cancelling any in-flight request from a previous location. */
export function useAirQuality(location: Location | null): LoadState<AirQualityResponse> {
  const [state, setState] = useState<LoadState<AirQualityResponse>>(IDLE_STATE);
  const nextSignal = useAbortableFetch();

  // Guarded by AbortController cleanup (via useAbortableFetch), so the
  // setState calls here are the intended result of a properly-cancelled
  // async fetch, not the unguarded pattern `react-hooks/set-state-in-effect` warns about.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!location) return;
    setState({ status: "loading", data: null });

    const signal = nextSignal();
    const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), name: location.name });

    fetch(`/api/air-quality?${params}`, { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("air-quality request failed");
        return (await res.json()) as AirQualityResponse;
      })
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", data: null, message: "Could not load air quality data." });
      });
    // nextSignal is a stable function identity from useAbortableFetch; only `location` should retrigger this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return state;
}

/** Generates today's plan once a profile and successfully-loaded air-quality reading are both available. */
export function usePlan(profile: Profile | null, location: Location | null, airQuality: LoadState<AirQualityResponse>): LoadState<PlanResponse> {
  const [state, setState] = useState<LoadState<PlanResponse>>(IDLE_STATE);

  useEffect(() => {
    if (!profile || !location || airQuality.status !== "success") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intended result of the guarded, abortable fetch below.
    setState({ status: "loading", data: null });

    const controller = new AbortController();
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        profile,
        location,
        aqi: { usAqi: airQuality.data.current.usAqi, pm25: airQuality.data.current.pm25, pm10: airQuality.data.current.pm10 },
        hourly: airQuality.data.hourly,
        dateISO: new Date().toISOString().slice(0, 10),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("plan request failed");
        return (await res.json()) as PlanResponse;
      })
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", data: null, message: "Could not build today's plan." });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, airQuality.status, location?.latitude, location?.longitude]);

  return state;
}
