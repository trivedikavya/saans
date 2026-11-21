import { describe, expect, it } from "vitest";
import { DEFAULT_SIMULATOR_TOGGLES, simulateImpact } from "@/lib/simulator";

const BASE_PARAMS = { pm25: 150, commuteMode: "car", commuteDistanceKm: 10 };

describe("simulateImpact", () => {
  it("returns zero exposure reduction when every toggle is off (the status-quo baseline)", () => {
    const result = simulateImpact({ ...BASE_PARAMS, toggles: DEFAULT_SIMULATOR_TOGGLES });
    expect(result.exposureReductionPercent).toBe(0);
    expect(result.cigaretteEquivalents).toBe(0);
  });

  it("increases exposure reduction when the purifier toggle is switched on", () => {
    const result = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, usePurifier: true } });
    expect(result.exposureReductionPercent).toBeGreaterThan(0);
  });

  it("increases exposure reduction further when sealing windows is added on top of the purifier", () => {
    const purifierOnly = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, usePurifier: true } });
    const purifierAndSeal = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, usePurifier: true, sealWindowsAtPeak: true } });
    expect(purifierAndSeal.exposureReductionPercent).toBeGreaterThan(purifierOnly.exposureReductionPercent);
  });

  it("never exceeds 100% exposure reduction even with every indoor toggle stacked", () => {
    const result = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, usePurifier: true, sealWindowsAtPeak: true, skipMorningWalk: true } });
    expect(result.exposureReductionPercent).toBeLessThanOrEqual(100);
  });

  it("only switching to metro affects emissions avoided (CO2e/PM), not the exposure figure", () => {
    const withMetro = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, switchToMetro: true } });
    expect(withMetro.co2eGramsAvoided).toBeGreaterThan(0);
    expect(withMetro.pmGramsAvoided).toBeGreaterThan(0);
    expect(withMetro.exposureReductionPercent).toBe(0);
  });

  it("reports zero emissions avoided when the metro toggle is off", () => {
    const result = simulateImpact({ ...BASE_PARAMS, toggles: DEFAULT_SIMULATOR_TOGGLES });
    expect(result.co2eGramsAvoided).toBe(0);
    expect(result.pmGramsAvoided).toBe(0);
  });

  it("skipping the morning walk reduces exposure even with no indoor toggles on", () => {
    const result = simulateImpact({ ...BASE_PARAMS, toggles: { ...DEFAULT_SIMULATOR_TOGGLES, skipMorningWalk: true } });
    expect(result.exposureReductionPercent).toBeGreaterThan(0);
  });
});
