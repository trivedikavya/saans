import { describe, expect, it } from "vitest";
import { applySafetyOverrides, buildSafetyConstraintsPrompt } from "@/lib/safety";
import type { GeminiPlanNarrative } from "@/lib/schemas";

function baseNarrative(overrides: Partial<GeminiPlanNarrative> = {}): GeminiPlanNarrative {
  return {
    bestOutdoorWindowExplanation: "Air is calmer in the early morning.",
    routineTweaks: [
      { id: "commute", category: "commute", title: "Shift commute", description: "Travel slightly earlier." },
      { id: "exercise", category: "exercise", title: "Go for a run outside", description: "A 20 minute outdoor jog in the park is a great way to start the day." },
    ],
    indoorHacks: [
      { id: "purifier", type: "purifier", title: "Run a purifier", description: "Keep it on medium." },
      { id: "diy", type: "diy", title: "Build a CR box", description: "Tape four filters to a fan." },
      { id: "myth", type: "myth", title: "Myth: plants", description: "Houseplants barely help." },
    ],
    sustainableAlternatives: [{ id: "pt", type: "public_transport", title: "Take the metro", description: "Lower emissions per trip." }],
    maskGuidanceReasons: [{ memberType: "adult", reason: "No mask needed at all today, feel free to skip it." }],
    ...overrides,
  };
}

describe("buildSafetyConstraintsPrompt", () => {
  it("includes an outdoor-exertion restriction once AQI exceeds the unsafe threshold", () => {
    expect(buildSafetyConstraintsPrompt(250)).toMatch(/outdoor exertion/i);
  });

  it("includes a stay-indoors restriction once AQI exceeds the hazardous threshold", () => {
    expect(buildSafetyConstraintsPrompt(350)).toMatch(/stay indoors|do not encourage going outside/i);
  });

  it("has no special restriction text at a Good AQI", () => {
    expect(buildSafetyConstraintsPrompt(20)).toMatch(/no special outdoor-activity restrictions/i);
  });
});

describe("applySafetyOverrides", () => {
  it("rewrites an outdoor-exercise suggestion when AQI makes exertion unsafe, and logs the override", () => {
    const { narrative, overrides } = applySafetyOverrides(baseNarrative(), 250);
    const exerciseTweak = narrative.routineTweaks.find((t) => t.id === "exercise")!;

    expect(exerciseTweak.description.toLowerCase()).not.toContain("jog");
    expect(exerciseTweak.description.toLowerCase()).toContain("indoor");
    expect(overrides.some((o) => o.field.includes("exercise"))).toBe(true);
  });

  it("does not touch safe content when AQI is low", () => {
    const { narrative, overrides } = applySafetyOverrides(baseNarrative(), 40);
    const exerciseTweak = narrative.routineTweaks.find((t) => t.id === "exercise")!;

    expect(exerciseTweak.description).toContain("jog");
    expect(overrides).toHaveLength(0);
  });

  it("corrects mask guidance text that dismisses masks when AQI requires one", () => {
    const { narrative, overrides } = applySafetyOverrides(baseNarrative(), 180);
    const adultReason = narrative.maskGuidanceReasons.find((r) => r.memberType === "adult")!;

    expect(adultReason.reason.toLowerCase()).not.toContain("no mask needed");
    expect(overrides.some((o) => o.field.includes("maskGuidanceReasons"))).toBe(true);
  });

  it("replaces an explanation that encourages going outside when AQI is hazardous", () => {
    const narrative = baseNarrative({ bestOutdoorWindowExplanation: "It's a great time to be outside and enjoy the fresh air!" });
    const { narrative: fixed, overrides } = applySafetyOverrides(narrative, 400);

    expect(fixed.bestOutdoorWindowExplanation.toLowerCase()).toContain("hazardous");
    expect(overrides.some((o) => o.field === "bestOutdoorWindowExplanation")).toBe(true);
  });

  it("never mutates the input narrative object", () => {
    const narrative = baseNarrative();
    const snapshotBefore = JSON.stringify(narrative);
    applySafetyOverrides(narrative, 400);
    expect(JSON.stringify(narrative)).toBe(snapshotBefore);
  });
});
