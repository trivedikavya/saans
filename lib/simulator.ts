/**
 * What-If simulator math. 100% pure, client-safe, and synchronous so the
 * UI can recompute instantly on every toggle flip with no network call
 * (see components/simulator/WhatIfSimulator.tsx). Reuses the same
 * documented factors from lib/emissions.ts -- there is only one set of
 * assumptions in the whole app, not a second copy for the simulator.
 */
import { cigaretteEquivalents, exposureReductionPercent, HEPA_PURIFIER_REDUCTION_FACTOR, INDOOR_OUTDOOR_PM_RATIO_EXPORT, SEALED_WINDOWS_PEAK_HOURS_REDUCTION_FACTOR, transportSwitchImpact } from "./emissions";
import type { Impact } from "./schemas";

export interface SimulatorToggles {
  usePurifier: boolean;
  switchToMetro: boolean;
  skipMorningWalk: boolean;
  sealWindowsAtPeak: boolean;
}

export const DEFAULT_SIMULATOR_TOGGLES: SimulatorToggles = {
  usePurifier: false,
  switchToMetro: false,
  skipMorningWalk: false,
  sealWindowsAtPeak: false,
};

/** Documented assumption: a typical household member spends ~8h/day outdoors (commute + errands + exercise) in a smog-affected city. */
const BASELINE_OUTDOOR_HOURS = 8;
const MORNING_WALK_HOURS = 0.75;
const INDOOR_OUTDOOR_RATIO = INDOOR_OUTDOOR_PM_RATIO_EXPORT;

function combinedReductionFactor(toggles: SimulatorToggles): number {
  // Reductions stack multiplicatively on *remaining* concentration, not
  // additively, so turning on two overlapping interventions never implies
  // more than 100% reduction.
  let remaining = 1;
  if (toggles.usePurifier) remaining *= 1 - HEPA_PURIFIER_REDUCTION_FACTOR;
  if (toggles.sealWindowsAtPeak) remaining *= 1 - SEALED_WINDOWS_PEAK_HOURS_REDUCTION_FACTOR;
  return 1 - remaining;
}

function weighted24hExposure(pm25: number, toggles: SimulatorToggles): number {
  const outdoorHours = Math.max(0, BASELINE_OUTDOOR_HOURS - (toggles.skipMorningWalk ? MORNING_WALK_HOURS : 0));
  const indoorHours = 24 - outdoorHours;

  const indoorReduction = combinedReductionFactor(toggles);
  const indoorPm = pm25 * INDOOR_OUTDOOR_RATIO * (1 - indoorReduction);
  const outdoorPm = pm25;

  return (indoorPm * indoorHours + outdoorPm * outdoorHours) / 24;
}

export interface SimulatorResult extends Impact {
  weightedPm25: number;
}

/**
 * Compares the household's 24h-weighted exposure and transport emissions
 * with all toggles OFF (today's status quo) against the same figures with
 * the given toggles ON, returning the deterministic Impact the UI can
 * render live.
 */
export function simulateImpact(params: { pm25: number; commuteMode: string; commuteDistanceKm: number; toggles: SimulatorToggles }): SimulatorResult {
  const { pm25, commuteMode, commuteDistanceKm, toggles } = params;

  const baselineWeighted = weighted24hExposure(pm25, DEFAULT_SIMULATOR_TOGGLES);
  const currentWeighted = weighted24hExposure(pm25, toggles);

  const transport = toggles.switchToMetro ? transportSwitchImpact(commuteMode, "metro", commuteDistanceKm) : { co2eGramsAvoided: 0, pmGramsAvoided: 0 };

  return {
    weightedPm25: currentWeighted,
    cigaretteEquivalents: Math.max(0, cigaretteEquivalents(baselineWeighted) - cigaretteEquivalents(currentWeighted)),
    exposureReductionPercent: exposureReductionPercent(baselineWeighted, currentWeighted),
    co2eGramsAvoided: transport.co2eGramsAvoided,
    pmGramsAvoided: transport.pmGramsAvoided,
  };
}
