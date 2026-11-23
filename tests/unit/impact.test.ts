import { describe, expect, it } from "vitest";
import { buildPlanResponse } from "@/lib/impact";
import { generateFallbackPlan } from "@/lib/fallbackPlan";
import { DEFAULT_PROFILE, PlanResponseSchema } from "@/lib/schemas";
import { buildHourlyFixture as buildHourly } from "../helpers/fixtures";

describe("buildPlanResponse", () => {
  it("produces output that satisfies the full PlanResponseSchema", () => {
    const hourly = buildHourly(120);
    const narrative = generateFallbackPlan({ usAqi: 180, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });

    const plan = buildPlanResponse({
      narrative,
      overrides: [],
      source: "fallback",
      profile: DEFAULT_PROFILE,
      usAqi: 180,
      currentPm25: 120,
      hourly,
    });

    const result = PlanResponseSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it("never assigns an Impact with negative numbers", () => {
    const hourly = buildHourly(50);
    const narrative = generateFallbackPlan({ usAqi: 60, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });
    const plan = buildPlanResponse({ narrative, overrides: [], source: "fallback", profile: DEFAULT_PROFILE, usAqi: 60, currentPm25: 50, hourly });

    for (const tweak of plan.routineTweaks) {
      expect(tweak.impact.cigaretteEquivalents).toBeGreaterThanOrEqual(0);
      expect(tweak.impact.co2eGramsAvoided).toBeGreaterThanOrEqual(0);
    }
  });

  it("assigns null impact to myth-busting indoor hacks (no false numeric claims)", () => {
    const hourly = buildHourly(80);
    const narrative = generateFallbackPlan({ usAqi: 100, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });
    const plan = buildPlanResponse({ narrative, overrides: [], source: "fallback", profile: DEFAULT_PROFILE, usAqi: 100, currentPm25: 80, hourly });

    const mythHack = plan.indoorHacks.find((h) => h.type === "myth")!;
    expect(mythHack.impact).toBeNull();
  });

  it("gives the purifier hack a nonzero exposure-reduction impact", () => {
    const hourly = buildHourly(150);
    const narrative = generateFallbackPlan({ usAqi: 200, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });
    const plan = buildPlanResponse({ narrative, overrides: [], source: "fallback", profile: DEFAULT_PROFILE, usAqi: 200, currentPm25: 150, hourly });

    const purifierHack = plan.indoorHacks.find((h) => h.type === "purifier")!;
    expect(purifierHack.impact).not.toBeNull();
    expect(purifierHack.impact!.exposureReductionPercent).toBeGreaterThan(0);
  });

  it("includes a mask guidance entry for every present household member type plus sensitive flag", () => {
    const hourly = buildHourly(150);
    const narrative = generateFallbackPlan({ usAqi: 200, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });
    const profile = { ...DEFAULT_PROFILE, household: { child: 1, adult: 2, senior: 1 }, hasSensitiveMember: true };
    const plan = buildPlanResponse({ narrative, overrides: [], source: "fallback", profile, usAqi: 200, currentPm25: 150, hourly });

    const memberTypes = plan.maskGuidance.map((m) => m.memberType).sort();
    expect(memberTypes).toEqual(["adult", "child", "senior", "sensitive"]);
  });

  it("carries forward safety overrides into plan.meta.safetyOverrides", () => {
    const hourly = buildHourly(150);
    const narrative = generateFallbackPlan({ usAqi: 200, language: "en", bestWindow: { startHour: 6, endHour: 9, noSafeWindow: false } });
    const overrides = [{ field: "routineTweaks.exercise", reason: "test override" }];
    const plan = buildPlanResponse({ narrative, overrides, source: "fallback", profile: DEFAULT_PROFILE, usAqi: 200, currentPm25: 150, hourly });

    expect(plan.meta.safetyOverrides).toEqual(overrides);
  });
});
