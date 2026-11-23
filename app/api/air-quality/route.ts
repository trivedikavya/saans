import { NextResponse } from "next/server";
import { jsonError } from "@/lib/apiError";
import { logError } from "@/lib/logger";
import { getAirQualityResponse } from "@/lib/openMeteo";
import { LocationSchema } from "@/lib/schemas";

/**
 * GET /api/air-quality?lat=..&lon=..&name=..
 * Returns live + 48h-forecast PM2.5/PM10/US-AQI and weather for a
 * location. The underlying Open-Meteo fetch is cached for ~15 minutes
 * (see lib/openMeteo.ts `fetchAirQualityAndWeather`); this route itself
 * runs at request time because it reads `request.url`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const name = searchParams.get("name")?.slice(0, 120) ?? "Selected location";

  // Checked explicitly (not just via Number() + Zod) because `Number(null)`
  // is 0, not NaN -- a missing lat/lon would otherwise silently resolve to
  // the valid-looking coordinate (0, 0) instead of being rejected.
  if (latParam === null || lonParam === null || latParam.trim() === "" || lonParam.trim() === "") {
    return jsonError("lat and lon query parameters are required.", 400);
  }

  const parsedLocation = LocationSchema.safeParse({ name, latitude: Number(latParam), longitude: Number(lonParam) });
  if (!parsedLocation.success) {
    return jsonError("Valid lat/lon/name query parameters are required.", 400);
  }

  try {
    const data = await getAirQualityResponse(parsedLocation.data);
    return NextResponse.json(data);
  } catch (error) {
    logError("api/air-quality", "failed", error);
    return jsonError("Could not fetch air quality data right now.", 502);
  }
}
