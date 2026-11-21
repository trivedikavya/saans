/**
 * Open-Meteo data layer. All three Open-Meteo APIs used by Saans
 * (Geocoding, Air Quality, Forecast) are called ONLY from here, and only
 * from server-side route handlers -- the client never talks to Open-Meteo
 * directly, which keeps our CSP `connect-src` limited to 'self' and gives
 * us one place to validate/cache responses.
 *
 * No API key is required for any of these endpoints.
 */
import { cacheLife } from "next/cache";
import { AirQualityResponseSchema, GeocodeResultSchema, type AirQualityResponse, type Location } from "./schemas";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const FORECAST_DAYS = 2; // "48h forecast" per the product brief.

export async function searchCities(query: string): Promise<Location[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);

  const json: unknown = await res.json();
  const results = (json as { results?: unknown[] }).results ?? [];
  const mapped = results.map((r) => {
    const row = r as { name: string; latitude: number; longitude: number; country_code?: string; admin1?: string };
    return {
      name: row.admin1 ? `${row.name}, ${row.admin1}` : row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      countryCode: row.country_code,
      admin1: row.admin1,
    };
  });

  const parsed = GeocodeResultSchema.safeParse({ results: mapped });
  return parsed.success ? parsed.data.results : [];
}

interface RawHourly {
  time: string[];
  pm2_5?: number[];
  pm10?: number[];
  us_aqi?: number[];
  temperature_2m?: number[];
  wind_speed_10m?: number[];
  relative_humidity_2m?: number[];
  boundary_layer_height?: number[];
}

/**
 * Fetches and merges Open-Meteo's Air Quality and Forecast (weather)
 * hourly series by timestamp. Wrapped in `"use cache"` with a 15-minute
 * revalidation window so repeated requests for the same rounded
 * coordinates within that window are served from Next's cache instead of
 * re-hitting Open-Meteo -- satisfying the "cache AQI/weather responses
 * (~15 min)" requirement under the Cache Components model.
 */
export async function fetchAirQualityAndWeather(latitude: number, longitude: number): Promise<{ hourly: RawHourly; currentTime: string }> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 900, expire: 3600 });

  const roundedLat = Math.round(latitude * 100) / 100;
  const roundedLon = Math.round(longitude * 100) / 100;

  const airQualityUrl = new URL(AIR_QUALITY_URL);
  airQualityUrl.searchParams.set("latitude", String(roundedLat));
  airQualityUrl.searchParams.set("longitude", String(roundedLon));
  airQualityUrl.searchParams.set("hourly", "pm2_5,pm10,us_aqi");
  airQualityUrl.searchParams.set("forecast_days", String(FORECAST_DAYS));
  airQualityUrl.searchParams.set("timezone", "auto");

  const weatherUrl = new URL(FORECAST_URL);
  weatherUrl.searchParams.set("latitude", String(roundedLat));
  weatherUrl.searchParams.set("longitude", String(roundedLon));
  // boundary_layer_height is used as a simple inversion proxy: a shallow
  // boundary layer traps pollutants near the surface, worsening ground-level
  // concentrations even when emissions are unchanged.
  weatherUrl.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height");
  weatherUrl.searchParams.set("forecast_days", String(FORECAST_DAYS));
  weatherUrl.searchParams.set("timezone", "auto");

  const [airRes, weatherRes] = await Promise.all([fetch(airQualityUrl, { signal: AbortSignal.timeout(8_000) }), fetch(weatherUrl, { signal: AbortSignal.timeout(8_000) })]);

  if (!airRes.ok) throw new Error(`Air quality request failed: ${airRes.status}`);
  if (!weatherRes.ok) throw new Error(`Weather request failed: ${weatherRes.status}`);

  const airJson = (await airRes.json()) as { hourly?: RawHourly };
  const weatherJson = (await weatherRes.json()) as { hourly?: RawHourly };

  const merged: RawHourly = {
    time: airJson.hourly?.time ?? [],
    pm2_5: airJson.hourly?.pm2_5,
    pm10: airJson.hourly?.pm10,
    us_aqi: airJson.hourly?.us_aqi,
    temperature_2m: weatherJson.hourly?.temperature_2m,
    wind_speed_10m: weatherJson.hourly?.wind_speed_10m,
    relative_humidity_2m: weatherJson.hourly?.relative_humidity_2m,
    boundary_layer_height: weatherJson.hourly?.boundary_layer_height,
  };

  return { hourly: merged, currentTime: new Date().toISOString() };
}

/** Builds and validates the full AirQualityResponse the client/plan route consume, given a resolved location. */
export async function getAirQualityResponse(location: Location): Promise<AirQualityResponse> {
  const { hourly, currentTime } = await fetchAirQualityAndWeather(location.latitude, location.longitude);

  const points = hourly.time.map((time, i) => ({
    time,
    pm25: hourly.pm2_5?.[i] ?? 0,
    pm10: hourly.pm10?.[i] ?? 0,
    usAqi: hourly.us_aqi?.[i] ?? 0,
    temperatureC: hourly.temperature_2m?.[i] ?? null,
    windSpeedKmh: hourly.wind_speed_10m?.[i] ?? null,
    humidityPercent: hourly.relative_humidity_2m?.[i] ?? null,
    boundaryLayerHeightM: hourly.boundary_layer_height?.[i] ?? null,
  }));

  if (points.length === 0) {
    throw new Error("Open-Meteo returned no hourly data for this location");
  }

  // Pick the forecast point closest to "now" as the current reading.
  const now = Date.now();
  const current = points.reduce((closest, point) => {
    const diff = Math.abs(new Date(point.time).getTime() - now);
    const closestDiff = Math.abs(new Date(closest.time).getTime() - now);
    return diff < closestDiff ? point : closest;
  }, points[0]!);

  const response: AirQualityResponse = {
    location,
    current,
    hourly: points,
    fetchedAt: currentTime,
    source: "open-meteo",
  };

  const parsed = AirQualityResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error(`Open-Meteo response failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}
