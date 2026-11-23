import { NextResponse } from "next/server";
import { findBestOutdoorWindow, getAqiBand } from "@/lib/aqi";
import { jsonError, parseJsonRequest, rateLimitedResponse } from "@/lib/apiError";
import { average24hPm25, buildPlanResponse } from "@/lib/impact";
import { generateFallbackPlan } from "@/lib/fallbackPlan";
import { generatePlanNarrative } from "@/lib/gemini";
import { logError } from "@/lib/logger";
import { buildPlanCacheKey, getCachedPlan, setCachedPlan } from "@/lib/planCache";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { applySafetyOverrides } from "@/lib/safety";
import { PlanRequestSchema, PlanResponseSchema } from "@/lib/schemas";

const RATE_LIMIT_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function buildProfileSummary(profile: { household: { child: number; adult: number; senior: number }; hasSensitiveMember: boolean; commuteMode: string; commuteDistanceKm: number; homeType: string; ventilation: string; ownsPurifier: boolean; cookingFuel: string; heatingMethod: string }): string {
  return [
    `Household: ${profile.household.adult} adult(s), ${profile.household.child} child(ren), ${profile.household.senior} senior(s).`,
    `Has a sensitive member (asthma/heart/pregnancy): ${profile.hasSensitiveMember ? "yes" : "no"}.`,
    `Commute: ${profile.commuteMode}, ${profile.commuteDistanceKm}km.`,
    `Home: ${profile.homeType}, ventilation ${profile.ventilation}, owns air purifier: ${profile.ownsPurifier ? "yes" : "no"}.`,
    `Cooking fuel: ${profile.cookingFuel}. Heating: ${profile.heatingMethod}.`,
  ].join(" ");
}

/**
 * POST /api/plan
 * Generates today's low-emission household plan. Flow:
 *   rate limit -> validate -> cache lookup -> (Gemini OR rule-based
 *   fallback) -> deterministic safety override -> deterministic impact
 *   numbers merged in -> re-validate -> cache -> respond.
 */
export async function POST(request: Request) {
  const identifier = getClientIdentifier(request.headers);
  const rateLimit = await checkRateLimit(identifier, "plan", RATE_LIMIT_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS);
  if (!rateLimit.allowed) {
    return rateLimitedResponse(RATE_LIMIT_WINDOW_SECONDS);
  }

  const parsed = await parseJsonRequest(request, PlanRequestSchema);
  if (!parsed.ok) return parsed.response;

  const { profile, location, aqi, hourly, dateISO } = parsed.data;
  const aqiBand = getAqiBand(aqi.usAqi).key;
  const cacheKey = buildPlanCacheKey(profile, aqiBand, dateISO);

  const cached = await getCachedPlan(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const context = {
    usAqi: aqi.usAqi,
    pm25: aqi.pm25,
    locationName: location.name,
    language: profile.language,
    profileSummary: buildProfileSummary(profile),
  };

  // Computed once, deterministically, from the forecast -- reused both for
  // the fallback template copy and (again, redundantly but harmlessly) by
  // buildPlanResponse below, which recomputes the same pure function.
  const bestWindow = findBestOutdoorWindow(hourly);

  const geminiNarrative = await generatePlanNarrative(context);
  const source: "gemini" | "fallback" = geminiNarrative ? "gemini" : "fallback";
  const narrative =
    geminiNarrative ??
    generateFallbackPlan({
      usAqi: aqi.usAqi,
      language: profile.language,
      bestWindow,
    });

  const { narrative: safeNarrative, overrides } = applySafetyOverrides(narrative, aqi.usAqi);

  const plan = buildPlanResponse({
    narrative: safeNarrative,
    overrides,
    source,
    profile,
    usAqi: aqi.usAqi,
    currentPm25: aqi.pm25 || average24hPm25(hourly),
    hourly,
  });

  const finalCheck = PlanResponseSchema.safeParse(plan);
  if (!finalCheck.success) {
    logError("api/plan", "built plan failed schema validation", finalCheck.error);
    return jsonError("Could not build a valid plan right now. Please try again.", 500);
  }

  await setCachedPlan(cacheKey, finalCheck.data);
  return NextResponse.json(finalCheck.data);
}
