import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPlanCacheKey, getCachedPlan, setCachedPlan } from "@/lib/planCache";
import { __resetStoreForTests } from "@/lib/store";
import { DEFAULT_PROFILE, type PlanResponse } from "@/lib/schemas";

describe("buildPlanCacheKey", () => {
  it("is deterministic: identical inputs produce the identical key", () => {
    const keyA = buildPlanCacheKey(DEFAULT_PROFILE, "unhealthy", "2024-01-15");
    const keyB = buildPlanCacheKey(DEFAULT_PROFILE, "unhealthy", "2024-01-15");
    expect(keyA).toBe(keyB);
  });

  it("changes when the AQI band changes", () => {
    const keyA = buildPlanCacheKey(DEFAULT_PROFILE, "good", "2024-01-15");
    const keyB = buildPlanCacheKey(DEFAULT_PROFILE, "hazardous", "2024-01-15");
    expect(keyA).not.toBe(keyB);
  });

  it("changes when the date changes (so plans refresh day to day)", () => {
    const keyA = buildPlanCacheKey(DEFAULT_PROFILE, "unhealthy", "2024-01-15");
    const keyB = buildPlanCacheKey(DEFAULT_PROFILE, "unhealthy", "2024-01-16");
    expect(keyA).not.toBe(keyB);
  });

  it("changes when a profile field that affects the plan changes", () => {
    const keyA = buildPlanCacheKey(DEFAULT_PROFILE, "unhealthy", "2024-01-15");
    const keyB = buildPlanCacheKey({ ...DEFAULT_PROFILE, cookingFuel: "wood" }, "unhealthy", "2024-01-15");
    expect(keyA).not.toBe(keyB);
  });
});

describe("getCachedPlan / setCachedPlan", () => {
  beforeEach(() => {
    __resetStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null for a key that was never cached", async () => {
    expect(await getCachedPlan("plan:never-set")).toBeNull();
  });

  it("round-trips a plan through the cache", async () => {
    const key = buildPlanCacheKey(DEFAULT_PROFILE, "moderate", "2024-01-15");
    const fakePlan = { meta: { source: "fallback" } } as unknown as PlanResponse;

    await setCachedPlan(key, fakePlan);
    const retrieved = await getCachedPlan(key);

    expect(retrieved).toEqual(fakePlan);
  });
});
