import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/scripts/check-contrast";
import { AQI_BANDS } from "@/lib/constants";

describe("contrastRatio", () => {
  it("returns 21:1 for pure black on pure white (the maximum possible ratio)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("returns 1:1 for a color against itself", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    expect(contrastRatio("#14532d", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#14532d"), 5);
  });
});

describe("AQI color pairs (lib/constants.ts)", () => {
  it.each(AQI_BANDS)("meets WCAG AA (>= 4.5:1) for the '$label' band", (band) => {
    expect(contrastRatio(band.bg, band.fg)).toBeGreaterThanOrEqual(4.5);
  });
});
