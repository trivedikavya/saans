/**
 * Caches identical plan requests (same profile + AQI band + calendar day)
 * so repeated visits/refreshes don't re-trigger a Gemini call. Keyed by a
 * SHA-256 hash of the inputs that actually affect the generated narrative.
 */
import { createHash } from "node:crypto";
import { getStore } from "./store";
import type { PlanResponse, Profile } from "./schemas";

const PLAN_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6 hours -- plenty for same-day re-visits without going stale overnight.

export function buildPlanCacheKey(profile: Profile, aqiBand: string, dateISO: string): string {
  const hash = createHash("sha256");
  hash.update(
    JSON.stringify({
      household: profile.household,
      hasSensitiveMember: profile.hasSensitiveMember,
      commuteMode: profile.commuteMode,
      homeType: profile.homeType,
      ventilation: profile.ventilation,
      ownsPurifier: profile.ownsPurifier,
      cookingFuel: profile.cookingFuel,
      heatingMethod: profile.heatingMethod,
      language: profile.language,
      aqiBand,
      dateISO,
    })
  );
  return `plan:${hash.digest("hex")}`;
}

export async function getCachedPlan(key: string): Promise<PlanResponse | null> {
  return getStore().get<PlanResponse>(key);
}

export async function setCachedPlan(key: string, plan: PlanResponse): Promise<void> {
  await getStore().set(key, plan, PLAN_CACHE_TTL_SECONDS);
}
