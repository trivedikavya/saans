import { describe, expect, it } from "vitest";
import { generateFallbackPlan } from "@/lib/fallbackPlan";
import { GeminiPlanNarrativeSchema, SupportedLanguageSchema } from "@/lib/schemas";

describe("generateFallbackPlan", () => {
  const bestWindow = { startHour: 6, endHour: 9, noSafeWindow: false };

  it.each(SupportedLanguageSchema.options)("produces a schema-valid narrative in %s with zero network calls", (language) => {
    const plan = generateFallbackPlan({ usAqi: 120, language, bestWindow });
    const result = GeminiPlanNarrativeSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it("always includes a myth-busting indoor hack (product requirement)", () => {
    const plan = generateFallbackPlan({ usAqi: 80, language: "en", bestWindow });
    expect(plan.indoorHacks.some((h) => h.type === "myth")).toBe(true);
  });

  it("always includes a DIY Corsi-Rosenthal hack (product requirement)", () => {
    const plan = generateFallbackPlan({ usAqi: 80, language: "en", bestWindow });
    expect(plan.indoorHacks.some((h) => h.type === "diy")).toBe(true);
  });

  it("notes that outdoor exertion is unsafe when AQI is above the threshold", () => {
    const plan = generateFallbackPlan({ usAqi: 250, language: "en", bestWindow });
    const exercise = plan.routineTweaks.find((t) => t.category === "exercise")!;
    expect(exercise.description).toMatch(/not safe/i);
  });

  it("uses the hazardous/no-safe-window copy when noSafeWindow is true", () => {
    const plan = generateFallbackPlan({ usAqi: 400, language: "en", bestWindow: { startHour: 0, endHour: 0, noSafeWindow: true } });
    expect(plan.bestOutdoorWindowExplanation.toLowerCase()).toContain("essential");
  });
});
