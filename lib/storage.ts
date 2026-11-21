/**
 * Typed localStorage access. Everything here is client-only and wrapped in
 * try/catch so it degrades gracefully during SSR (no `window`), in private
 * browsing, or if storage is full/disabled -- the app should never crash
 * because of localStorage.
 *
 * Per the product brief, the lifestyle profile and neighborhood pledge
 * live ONLY in localStorage; only the minimal fields needed for plan
 * generation are ever sent to the server (see app/api/plan/route.ts).
 */
import { LocationSchema, ProfileSchema, type Location, type Profile } from "./schemas";

const PROFILE_KEY = "saans:profile:v1";
const LOCATION_KEY = "saans:location:v1";
const PLEDGE_KEY = "saans:pledge:v1";
const ONBOARDED_KEY = "saans:onboarded:v1";

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full/disabled -- silently no-op rather than crash the app.
  }
}

export function getStoredProfile(): Profile | null {
  const parsed = ProfileSchema.safeParse(readJson(PROFILE_KEY));
  return parsed.success ? parsed.data : null;
}

export function setStoredProfile(profile: Profile): void {
  writeJson(PROFILE_KEY, profile);
  writeJson(ONBOARDED_KEY, true);
}

export function hasCompletedOnboarding(): boolean {
  return Boolean(readJson(ONBOARDED_KEY)) && getStoredProfile() !== null;
}

export function getStoredLocation(): Location | null {
  const parsed = LocationSchema.safeParse(readJson(LOCATION_KEY));
  return parsed.success ? parsed.data : null;
}

export function setStoredLocation(location: Location): void {
  writeJson(LOCATION_KEY, location);
}

export function getStoredPledgeChecks(): string[] {
  const value = readJson(PLEDGE_KEY);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function setStoredPledgeChecks(ids: string[]): void {
  writeJson(PLEDGE_KEY, ids);
}
