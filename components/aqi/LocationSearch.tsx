"use client";

/** City search (debounced, abortable) + "use my current location" geolocation button. */
import { useEffect, useState } from "react";
import { useAppState } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAbortableFetch, useDebouncedValue, useGeolocation } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import type { Location } from "@/lib/schemas";

export function LocationSearch() {
  const { profile, setLocation } = useAppState();
  const language = profile?.language ?? "en";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 350);
  const nextSignal = useAbortableFetch();
  const geolocation = useGeolocation();

  // Debounced search-as-you-type effect with cancellation (`cancelled` flag
  // + AbortController) to avoid stale-response races -- the setState calls
  // inside are the intentional outcome of a guarded async fetch, not the
  // unguarded pattern `react-hooks/set-state-in-effect` warns about.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const signal = nextSignal();

    fetch(`/api/geocode?q=${encodeURIComponent(debouncedQuery)}`, { signal })
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data: { results: Location[] }) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
    // nextSignal is stable across renders (see useAbortableFetch); only the debounced query should re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSelect(location: Location) {
    setLocation(location);
    setQuery("");
    setResults([]);
  }

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <label htmlFor="city-search" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t(language, "locationSearchLabel")}
        </label>
        <input
          id="city-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(language, "locationSearchPlaceholder")}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
          aria-describedby="city-search-status"
        />
        <span id="city-search-status" className="sr-only" aria-live="polite">
          {searching ? "Searching" : `${results.length} results`}
        </span>
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Search results">
          {results.map((result) => (
            <li key={`${result.name}-${result.latitude}-${result.longitude}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {result.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" className="self-start" onClick={() => geolocation.requestLocation(handleSelect)} disabled={geolocation.loading}>
        {geolocation.loading ? t(language, "locatingNow") : t(language, "useMyLocation")}
      </Button>
      {geolocation.error && <StatusMessage status="error">{geolocation.error}</StatusMessage>}
    </Card>
  );
}
