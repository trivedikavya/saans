import { NextResponse } from "next/server";
import { jsonError } from "@/lib/apiError";
import { logError } from "@/lib/logger";
import { searchCities } from "@/lib/openMeteo";

/**
 * GET /api/geocode?q=<city name>
 * Proxies the Open-Meteo Geocoding API so the client never calls a
 * third-party host directly (keeps CSP connect-src to 'self').
 * Reading `request.url` makes this route request-time dynamic under Cache
 * Components automatically -- no explicit `dynamic` export needed.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return jsonError("Query must be at least 2 characters.", 400);
  }
  if (query.length > 80) {
    return jsonError("Query too long.", 400);
  }

  try {
    const results = await searchCities(query);
    return NextResponse.json({ results });
  } catch (error) {
    logError("api/geocode", "failed", error);
    return jsonError("Could not search for that location right now.", 502);
  }
}
