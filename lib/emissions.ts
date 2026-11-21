/**
 * Documented emission & exposure factor tables.
 *
 * CRITICAL INVARIANT: the Gemini-generated plan never contains numbers.
 * Every "Impact" chip the UI shows (cigarette-equivalents, % exposure
 * reduction, grams CO2e avoided, grams PM avoided) is computed by the pure
 * functions in this file and merged into the plan server-side in
 * lib/impact.ts. The LLM's job is limited to *explaining* these numbers in
 * plain language -- it cannot invent or alter them.
 *
 * All factors below are intentionally simple, order-of-magnitude averages
 * suitable for a consumer-facing "impact" communication tool, NOT a
 * certified carbon-accounting or medical exposure model. Sources are
 * documented per-constant; swap in locale-specific factors if you have
 * better local data.
 */

// ---------------------------------------------------------------------------
// Cigarette-equivalent exposure heuristic
// ---------------------------------------------------------------------------

/**
 * "22 micrograms/m^3 of PM2.5 sustained over 24h ~= smoking 1 cigarette."
 * This is a widely-cited COMMUNICATION HEURISTIC popularized by Richard
 * Muller / Berkeley Earth ("Beijing air equivalent to smoking 40 cigarettes
 * a day", 2015), itself derived from earlier work relating PM2.5 dose to
 * cigarette smoke particulate dose. It is NOT a peer-reviewed medical dose
 * equivalence and must always be labeled as a heuristic in the UI.
 */
export const PM25_MICROGRAMS_PER_CIGARETTE_EQUIVALENT = 22;

/** Converts a 24h-average PM2.5 concentration (µg/m³) into "cigarettes equivalent". */
export function cigaretteEquivalents(pm25TwentyFourHourAverage: number): number {
  return Math.max(0, pm25TwentyFourHourAverage) / PM25_MICROGRAMS_PER_CIGARETTE_EQUIVALENT;
}

/** Percentage reduction in exposure between a baseline and a reduced PM2.5 (or dose) figure. Clamped to [0, 100]. */
export function exposureReductionPercent(baseline: number, reduced: number): number {
  if (baseline <= 0) return 0;
  const reduction = ((baseline - reduced) / baseline) * 100;
  return Math.max(0, Math.min(100, reduction));
}

// ---------------------------------------------------------------------------
// Transport emission factors (grams CO2e per passenger-km)
// ---------------------------------------------------------------------------

/**
 * Average grams of CO2e emitted per passenger-km by mode.
 * Sources (national/international averages, used as reasonable defaults):
 * - car (petrol, average occupancy 1):  UK DEFRA/DESNZ 2023 GHG conversion
 *   factors, "Cars (by market segment) - Average car" ~ 0.170-0.192 kgCO2e/km
 * - bus:  DEFRA 2023 "Bus - Local bus (not London)" ~ 0.082 kgCO2e/passenger-km
 * - metro/rail: DEFRA 2023 "Rail - National rail" ~ 0.041 kgCO2e/passenger-km
 * - auto-rickshaw (CNG): approximate Indian urban-transport estimate, ~0.065 kgCO2e/km
 * - cycle / walk: 0 (tailpipe) -- human-powered, no direct emissions factor applied here
 */
export const TRANSPORT_CO2E_GRAMS_PER_KM: Record<string, number> = {
  car: 192,
  auto: 65,
  bike: 103, // motorbike/scooter -- DEFRA 2023 "Motorbike - Average" ~0.103 kgCO2e/km
  bus: 82,
  metro: 41,
  cycle: 0,
  walk: 0,
};

/**
 * Average grams of PM2.5 (exhaust + non-exhaust brake/tyre/road wear) per
 * vehicle-km. Approximate figures derived from the EEA/EMEP air pollutant
 * emission inventory guidebook order-of-magnitude ranges for urban petrol
 * passenger cars and diesel buses; treat as communication-grade estimates.
 */
export const TRANSPORT_PM25_GRAMS_PER_KM: Record<string, number> = {
  car: 0.015,
  auto: 0.01,
  bike: 0.006,
  bus: 0.008, // per passenger-km, bus carries many passengers per vehicle-km
  metro: 0.001, // grid-electricity-related upstream PM, negligible local tailpipe PM
  cycle: 0,
  walk: 0,
};

export interface TransportSwitchImpact {
  co2eGramsAvoided: number;
  pmGramsAvoided: number;
}

/** Grams of CO2e and PM2.5 avoided per day by switching `distanceKm` of travel from one mode to a cleaner one. */
export function transportSwitchImpact(fromMode: string, toMode: string, distanceKm: number): TransportSwitchImpact {
  const safeDistance = Math.max(0, distanceKm);
  const fromCo2e = TRANSPORT_CO2E_GRAMS_PER_KM[fromMode] ?? TRANSPORT_CO2E_GRAMS_PER_KM.car;
  const toCo2e = TRANSPORT_CO2E_GRAMS_PER_KM[toMode] ?? 0;
  const fromPm = TRANSPORT_PM25_GRAMS_PER_KM[fromMode] ?? TRANSPORT_PM25_GRAMS_PER_KM.car;
  const toPm = TRANSPORT_PM25_GRAMS_PER_KM[toMode] ?? 0;

  return {
    co2eGramsAvoided: Math.max(0, (fromCo2e - toCo2e) * safeDistance),
    pmGramsAvoided: Math.max(0, (fromPm - toPm) * safeDistance),
  };
}

/** Carpooling with `occupants` people roughly divides per-person car emissions by the occupant count. */
export function carpoolImpact(distanceKm: number, occupants: number): TransportSwitchImpact {
  const safeOccupants = Math.max(2, occupants);
  const soloCo2e = TRANSPORT_CO2E_GRAMS_PER_KM.car * Math.max(0, distanceKm);
  const soloPm = TRANSPORT_PM25_GRAMS_PER_KM.car * Math.max(0, distanceKm);
  return {
    co2eGramsAvoided: soloCo2e - soloCo2e / safeOccupants,
    pmGramsAvoided: soloPm - soloPm / safeOccupants,
  };
}

// ---------------------------------------------------------------------------
// Indoor air intervention factors (% reduction in indoor PM2.5 exposure)
// ---------------------------------------------------------------------------

/**
 * Approximate indoor PM2.5 reduction when running a correctly-sized HEPA
 * purifier continuously in an occupied room.
 * Source: US EPA "Guide to Air Cleaners in the Home" reports well-sized HEPA
 * units commonly achieve 50-70% reduction in fine particle concentration;
 * we use the conservative middle of that published range.
 */
export const HEPA_PURIFIER_REDUCTION_FACTOR = 0.6;

/**
 * Approximate indoor PM2.5 reduction from a DIY Corsi-Rosenthal box (4-5
 * MERV-13 furnace filters + box fan) versus no filtration, for a
 * typically-sized bedroom/living room.
 * Source: published CR-box effectiveness studies (e.g. Thornburg et al.,
 * 2022, "Literature Review of the Effectiveness of Corsi-Rosenthal Boxes")
 * report comparable clean-air delivery to mid-range commercial HEPA units
 * in similarly sized rooms; we use a conservative estimate.
 */
export const CORSI_ROSENTHAL_REDUCTION_FACTOR = 0.5;

/**
 * Approximate reduction in indoor infiltration of outdoor PM2.5 achieved by
 * keeping windows/doors sealed during the smoggiest hours of the day versus
 * leaving them open, for a typical urban home without mechanical
 * ventilation. Order-of-magnitude estimate; actual value depends heavily on
 * building envelope tightness.
 */
export const SEALED_WINDOWS_PEAK_HOURS_REDUCTION_FACTOR = 0.3;

/**
 * Indoor PM2.5 is assumed to be ~50% of outdoor PM2.5 due to typical
 * infiltration through doors/windows/cracks in an urban home without
 * mechanical filtration. Shared by lib/impact.ts and lib/simulator.ts so
 * there is exactly one copy of this assumption in the codebase.
 */
export const INDOOR_OUTDOOR_PM_RATIO_EXPORT = 0.5;

/**
 * Approximate extra indoor PM2.5 reduction from cooking-exhaust ventilation
 * (exhaust fan/chimney running during & after cooking) versus cooking with
 * no local exhaust, for LPG/induction cooking.
 */
export const COOKING_EXHAUST_REDUCTION_FACTOR = 0.35;

// ---------------------------------------------------------------------------
// Biomass / waste burning avoided (sustainable-alternatives impact)
// ---------------------------------------------------------------------------

/**
 * Approximate grams of PM2.5 released per kg of mixed waste/wood burned in
 * the open, a common winter practice in some neighborhoods for warmth or
 * waste disposal. Order-of-magnitude estimate from residential/open
 * burning emission factor literature (e.g. US EPA AP-42 Ch.2.5 "Open
 * Burning" and residential wood combustion guidance); open burning of
 * mixed/wet waste is typically dirtier than clean dry wood, so we use a
 * mid-range estimate.
 */
export const OPEN_BURNING_PM25_GRAMS_PER_KG = 13;

/** Approximate grams of CO2e released per kg of biomass/waste burned in the open. */
export const OPEN_BURNING_CO2E_GRAMS_PER_KG = 1500;

export function avoidBurningImpact(kgPerWeek: number): TransportSwitchImpact {
  const perDayKg = Math.max(0, kgPerWeek) / 7;
  return {
    co2eGramsAvoided: perDayKg * OPEN_BURNING_CO2E_GRAMS_PER_KG,
    pmGramsAvoided: perDayKg * OPEN_BURNING_PM25_GRAMS_PER_KG,
  };
}

// ---------------------------------------------------------------------------
// Home heating emission factors (grams per day of typical winter use)
// ---------------------------------------------------------------------------

/**
 * Approximate grams of PM2.5 released indoors/locally per day of heating,
 * by method, for a single room/space heater used ~4h/day in winter.
 * wood_coal is an order-of-magnitude estimate from residential solid-fuel
 * heating emission factor literature (much dirtier than electric/gas);
 * electric/gas/none are treated as having negligible local PM2.5.
 */
export const HEATING_PM25_GRAMS_PER_DAY: Record<string, number> = {
  wood_coal: 45,
  gas: 2,
  electric: 0.5,
  none: 0,
  other: 10,
};

/** Approximate grams of CO2e released per day of heating, by method (4h/day assumption). */
export const HEATING_CO2E_GRAMS_PER_DAY: Record<string, number> = {
  wood_coal: 3200,
  gas: 2400,
  electric: 1800, // grid-mix dependent; treated as a conservative mid estimate
  none: 0,
  other: 2000,
};

export function heatingSwitchImpact(fromMethod: string, toMethod: string): TransportSwitchImpact {
  const fromPm = HEATING_PM25_GRAMS_PER_DAY[fromMethod] ?? HEATING_PM25_GRAMS_PER_DAY.other;
  const toPm = HEATING_PM25_GRAMS_PER_DAY[toMethod] ?? 0;
  const fromCo2e = HEATING_CO2E_GRAMS_PER_DAY[fromMethod] ?? HEATING_CO2E_GRAMS_PER_DAY.other;
  const toCo2e = HEATING_CO2E_GRAMS_PER_DAY[toMethod] ?? 0;

  return {
    co2eGramsAvoided: Math.max(0, fromCo2e - toCo2e),
    pmGramsAvoided: Math.max(0, fromPm - toPm),
  };
}
