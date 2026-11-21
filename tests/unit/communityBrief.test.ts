import { describe, expect, it } from "vitest";
import { buildCommunityBrief } from "@/lib/communityBrief";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

describe("buildCommunityBrief", () => {
  it.each(SUPPORTED_LANGUAGES)("produces a non-empty, city- and AQI-referencing brief in %s", (language) => {
    const brief = buildCommunityBrief({ city: "Lucknow", usAqi: 180, language });
    expect(brief).toContain("Lucknow");
    expect(brief).toContain("180");
    expect(brief.length).toBeGreaterThan(20);
  });

  it("recommends a mask when AQI requires one", () => {
    const brief = buildCommunityBrief({ city: "Delhi", usAqi: 200, language: "en" });
    expect(brief.toLowerCase()).toContain("mask");
    expect(brief.toLowerCase()).toContain("recommended");
  });

  it("does not falsely recommend masks when AQI is Good", () => {
    const brief = buildCommunityBrief({ city: "Delhi", usAqi: 20, language: "en" });
    expect(brief.toLowerCase()).toContain("optional");
  });

  it("never includes profile or health data -- only city name and AQI figures", () => {
    const brief = buildCommunityBrief({ city: "Delhi", usAqi: 120, language: "en" });
    expect(brief.toLowerCase()).not.toMatch(/asthma|pregnan|heart condition/);
  });
});
