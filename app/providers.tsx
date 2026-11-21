"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_BCP47, type SupportedLanguage } from "@/lib/constants";
import { getStoredLocation, getStoredProfile, setStoredLocation, setStoredProfile } from "@/lib/storage";
import type { Location, Profile } from "@/lib/schemas";

type Theme = "light" | "dark";
const THEME_KEY = "saans:theme:v1";

interface AppStateValue {
  profile: Profile | null;
  location: Location | null;
  theme: Theme;
  setProfile: (profile: Profile) => void;
  setLocation: (location: Location) => void;
  toggleTheme: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within <AppProviders>");
  return ctx;
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyLangAttribute(language: SupportedLanguage | undefined) {
  document.documentElement.lang = LANGUAGE_BCP47[language ?? "en"];
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [location, setLocationState] = useState<Location | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount (client-only; SSR has no access,
  // so this one-time read-and-set-state is an intentional exception to the
  // "no setState in effects" guideline -- there is no way to get this data
  // during render on the server).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storedProfile = getStoredProfile();
    const storedLocation = getStoredLocation();
    if (storedProfile) setProfileState(storedProfile);
    if (storedLocation) setLocationState(storedLocation);

    const storedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const resolvedTheme: Theme = storedTheme ?? (prefersDark ? "dark" : "light");
    setTheme(resolvedTheme);
    applyThemeClass(resolvedTheme);
    applyLangAttribute(storedProfile?.language);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setProfile = useCallback((next: Profile) => {
    setProfileState(next);
    setStoredProfile(next);
    applyLangAttribute(next.language);
  }, []);

  const setLocation = useCallback((next: Location) => {
    setLocationState(next);
    setStoredLocation(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_KEY, next);
      applyThemeClass(next);
      return next;
    });
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({ profile, location, theme, setProfile, setLocation, toggleTheme }),
    [profile, location, theme, setProfile, setLocation, toggleTheme]
  );

  // The context must always be provided (server prerender, client
  // pre-hydration, and post-hydration all render this tree) -- only the
  // visual content is hidden until hydration to avoid a flash of
  // mismatched theme/profile-dependent UI.
  return (
    <AppStateContext.Provider value={value}>
      <div style={hydrated ? undefined : { visibility: "hidden" }}>{children}</div>
    </AppStateContext.Provider>
  );
}
