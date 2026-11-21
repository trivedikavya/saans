"use client";

import { useEffect, useRef, useState } from "react";
import type { Location } from "./schemas";

/** Debounces a fast-changing value (e.g. a search input) by `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export interface GeolocationState {
  loading: boolean;
  error: string | null;
}

/**
 * Wraps the browser Geolocation API behind a user gesture. Reverse
 * geocodes the coordinates into a city name via our own /api/geocode
 * proxy is NOT done here (Open-Meteo's geocoding API is forward-only);
 * instead we label the point generically and let the AQI hero show
 * coordinates-derived data immediately.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ loading: false, error: null });

  function requestLocation(onSuccess: (location: Location) => void) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ loading: false, error: "Geolocation is not available in this browser." });
      return;
    }

    setState({ loading: true, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null });
        onSuccess({
          name: "My current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setState({ loading: false, error: error.message || "Could not access your location." });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }

  return { ...state, requestLocation };
}

/** Returns a ref-tracked AbortController, aborting the previous one whenever a new fetch starts, to avoid stale-response races. */
export function useAbortableFetch() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  function nextSignal(): AbortSignal {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }

  return nextSignal;
}
