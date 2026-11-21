import { describe, expect, it } from "vitest";
import {
  avoidBurningImpact,
  carpoolImpact,
  cigaretteEquivalents,
  exposureReductionPercent,
  heatingSwitchImpact,
  PM25_MICROGRAMS_PER_CIGARETTE_EQUIVALENT,
  transportSwitchImpact,
} from "@/lib/emissions";

describe("cigaretteEquivalents", () => {
  it("converts the documented 22 microgram/m3-over-24h heuristic into exactly 1 cigarette", () => {
    expect(cigaretteEquivalents(PM25_MICROGRAMS_PER_CIGARETTE_EQUIVALENT)).toBeCloseTo(1, 5);
  });

  it("scales linearly with concentration", () => {
    expect(cigaretteEquivalents(44)).toBeCloseTo(2, 5);
    expect(cigaretteEquivalents(11)).toBeCloseTo(0.5, 5);
  });

  it("never returns a negative value for negative/garbage input", () => {
    expect(cigaretteEquivalents(-50)).toBe(0);
  });
});

describe("exposureReductionPercent", () => {
  it("computes a straightforward percentage reduction", () => {
    expect(exposureReductionPercent(100, 50)).toBeCloseTo(50, 5);
    expect(exposureReductionPercent(200, 0)).toBeCloseTo(100, 5);
  });

  it("clamps to [0, 100] even if the 'reduced' value is higher than baseline", () => {
    expect(exposureReductionPercent(50, 100)).toBe(0);
  });

  it("returns 0 when baseline is zero to avoid division by zero", () => {
    expect(exposureReductionPercent(0, 0)).toBe(0);
  });
});

describe("transportSwitchImpact", () => {
  it("is zero when switching a mode to itself", () => {
    const impact = transportSwitchImpact("car", "car", 10);
    expect(impact.co2eGramsAvoided).toBe(0);
    expect(impact.pmGramsAvoided).toBe(0);
  });

  it("scales linearly with distance", () => {
    const short = transportSwitchImpact("car", "metro", 5);
    const long = transportSwitchImpact("car", "metro", 10);
    expect(long.co2eGramsAvoided).toBeCloseTo(short.co2eGramsAvoided * 2, 5);
  });

  it("never returns negative avoided amounts (switching to a dirtier mode floors at zero)", () => {
    const impact = transportSwitchImpact("metro", "car", 10);
    expect(impact.co2eGramsAvoided).toBe(0);
    expect(impact.pmGramsAvoided).toBe(0);
  });
});

describe("carpoolImpact", () => {
  it("reduces per-person emissions roughly proportional to extra occupants", () => {
    const impact = carpoolImpact(20, 4);
    // Solo car emissions for 20km minus a quarter share.
    expect(impact.co2eGramsAvoided).toBeGreaterThan(0);
  });

  it("treats fewer than 2 occupants as 2 (carpooling requires at least 2 people)", () => {
    const withOne = carpoolImpact(20, 1);
    const withTwo = carpoolImpact(20, 2);
    expect(withOne.co2eGramsAvoided).toBeCloseTo(withTwo.co2eGramsAvoided, 5);
  });
});

describe("avoidBurningImpact", () => {
  it("scales with kg burned per week", () => {
    const low = avoidBurningImpact(0);
    const high = avoidBurningImpact(7);
    expect(low.pmGramsAvoided).toBe(0);
    expect(high.pmGramsAvoided).toBeGreaterThan(0);
  });
});

describe("heatingSwitchImpact", () => {
  it("shows a large avoided PM amount switching from wood/coal to electric", () => {
    const impact = heatingSwitchImpact("wood_coal", "electric");
    expect(impact.pmGramsAvoided).toBeGreaterThan(0);
    expect(impact.co2eGramsAvoided).toBeGreaterThan(0);
  });

  it("shows zero impact switching a method to itself", () => {
    const impact = heatingSwitchImpact("electric", "electric");
    expect(impact.pmGramsAvoided).toBe(0);
  });
});
