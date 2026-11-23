import type { HourlyAirPointData } from "@/lib/schemas";

/**
 * Shared hourly-forecast fixture builder for tests. Previously
 * hand-written three times (slightly differently) across
 * tests/unit/aqi.test.ts, tests/unit/impact.test.ts, and
 * tests/integration/api-plan.test.ts -- consolidated here since it's the
 * same job every time: produce a plausible HourlyAirPointData[] for a
 * given PM2.5 profile.
 *
 * Pass a single number for a constant value across every hour, or an
 * array to give each hour its own PM2.5 (e.g. to make specific hours the
 * "cleanest" for best-outdoor-window tests).
 */
export function buildHourlyFixture(pm25: number | number[], options: { hours?: number; startDate?: string } = {}): HourlyAirPointData[] {
  const { hours = 24, startDate = "2024-01-15" } = options;
  const values = Array.isArray(pm25) ? pm25 : new Array(hours).fill(pm25);

  return values.map((value, hour) => ({
    time: `${startDate}T${String(hour % 24).padStart(2, "0")}:00`,
    pm25: value,
    pm10: value * 1.3,
    usAqi: value * 2, // simplified proportional proxy -- good enough for fixture purposes, not a real AQI conversion.
    temperatureC: 15,
    windSpeedKmh: 5,
    humidityPercent: 55,
    boundaryLayerHeightM: 400,
  }));
}
