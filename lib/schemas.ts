/**
 * Single source of truth for every data shape that crosses a trust
 * boundary (localStorage <-> client, client <-> API route, API route <->
 * Gemini). All TypeScript types in the app are derived from these Zod
 * schemas with `z.infer` so validation and types can never drift apart.
 */
import { z } from "zod";
import { AQI_BANDS, SUPPORTED_LANGUAGES } from "./constants";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const SupportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

export const AqiBandKeySchema = z.enum(AQI_BANDS.map((b) => b.key) as [string, ...string[]]);

// ---------------------------------------------------------------------------
// Lifestyle profile (onboarding) -- localStorage only, minimal fields sent
// to the server for plan generation. No free-text health data is ever
// collected: `hasSensitiveMember` is a boolean toggle, nothing more.
// ---------------------------------------------------------------------------

export const HouseholdCountsSchema = z
  .object({
    child: z.number().int().min(0).max(20),
    adult: z.number().int().min(0).max(20),
    senior: z.number().int().min(0).max(20),
  })
  .refine((v) => v.child + v.adult + v.senior > 0, { message: "Household must have at least one member." });

export const CommuteModeSchema = z.enum(["walk", "cycle", "bike", "car", "bus", "metro", "auto"]);
export const HomeTypeSchema = z.enum(["apartment", "independent_house", "other"]);
export const VentilationSchema = z.enum(["windows", "ac", "both", "none"]);
export const CookingFuelSchema = z.enum(["lpg", "induction", "wood", "other"]);
export const HeatingMethodSchema = z.enum(["electric", "gas", "wood_coal", "none", "other"]);

export const ProfileSchema = z.object({
  household: HouseholdCountsSchema,
  hasSensitiveMember: z.boolean(),
  commuteMode: CommuteModeSchema,
  commuteDistanceKm: z.number().min(0).max(200),
  homeType: HomeTypeSchema,
  ventilation: VentilationSchema,
  ownsPurifier: z.boolean(),
  cookingFuel: CookingFuelSchema,
  heatingMethod: HeatingMethodSchema,
  language: SupportedLanguageSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const DEFAULT_PROFILE: Profile = {
  household: { child: 0, adult: 2, senior: 0 },
  hasSensitiveMember: false,
  commuteMode: "car",
  commuteDistanceKm: 8,
  homeType: "apartment",
  ventilation: "windows",
  ownsPurifier: false,
  cookingFuel: "lpg",
  heatingMethod: "electric",
  language: "en",
};

// ---------------------------------------------------------------------------
// Location (geocoding result), stored locally alongside the profile
// ---------------------------------------------------------------------------

export const LocationSchema = z.object({
  name: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  countryCode: z.string().max(5).optional(),
  admin1: z.string().max(120).optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const GeocodeResultSchema = z.object({
  results: z.array(LocationSchema),
});
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

// ---------------------------------------------------------------------------
// Air quality + weather (Open-Meteo), validated at the server boundary
// before anything touches the client or Gemini.
// ---------------------------------------------------------------------------

export const HourlyAirPointSchema = z.object({
  time: z.string(),
  pm25: z.number().min(0),
  pm10: z.number().min(0),
  usAqi: z.number().min(0),
  temperatureC: z.number().nullable(),
  windSpeedKmh: z.number().min(0).nullable(),
  humidityPercent: z.number().min(0).max(100).nullable(),
  boundaryLayerHeightM: z.number().min(0).nullable(),
});
export type HourlyAirPointData = z.infer<typeof HourlyAirPointSchema>;

export const AirQualityResponseSchema = z.object({
  location: LocationSchema,
  current: HourlyAirPointSchema,
  hourly: z.array(HourlyAirPointSchema).min(1),
  fetchedAt: z.string(),
  source: z.literal("open-meteo"),
});
export type AirQualityResponse = z.infer<typeof AirQualityResponseSchema>;

// ---------------------------------------------------------------------------
// Impact numbers -- ALWAYS computed in code (lib/impact.ts), never by the LLM.
// ---------------------------------------------------------------------------

export const ImpactSchema = z.object({
  cigaretteEquivalents: z.number().min(0),
  exposureReductionPercent: z.number().min(0).max(100),
  co2eGramsAvoided: z.number().min(0),
  pmGramsAvoided: z.number().min(0),
});
export type Impact = z.infer<typeof ImpactSchema>;

// ---------------------------------------------------------------------------
// Plan: narrative-only shape Gemini is allowed to produce (no numbers).
// ---------------------------------------------------------------------------

export const RoutineCategorySchema = z.enum(["commute", "school", "exercise", "errands"]);
export const IndoorHackTypeSchema = z.enum(["ventilate", "seal", "purifier", "cooking", "diy", "myth"]);
export const AlternativeTypeSchema = z.enum(["public_transport", "carpool", "avoid_burning", "electric_heating", "other"]);
export const EffortTagSchema = z.enum(["Free", "Low", "Medium"]);
export const MemberTypeSchema = z.enum(["child", "adult", "senior", "sensitive"]);
export const MaskRecommendationSchema = z.enum(["N95_FFP2", "cloth", "none"]);

const idSchema = z.string().min(1).max(60);
const shortText = z.string().min(1).max(100);
const longText = z.string().min(1).max(500);

export const GeminiPlanNarrativeSchema = z.object({
  bestOutdoorWindowExplanation: longText,
  routineTweaks: z
    .array(
      z.object({
        id: idSchema,
        category: RoutineCategorySchema,
        title: shortText,
        description: longText,
      })
    )
    .min(2)
    .max(5),
  indoorHacks: z
    .array(
      z.object({
        id: idSchema,
        type: IndoorHackTypeSchema,
        title: shortText,
        description: longText,
      })
    )
    .min(3)
    .max(6),
  sustainableAlternatives: z
    .array(
      z.object({
        id: idSchema,
        type: AlternativeTypeSchema,
        title: shortText,
        description: longText,
      })
    )
    .min(2)
    .max(4),
  maskGuidanceReasons: z
    .array(
      z.object({
        memberType: MemberTypeSchema,
        reason: z.string().min(1).max(220),
      })
    )
    .min(1)
    .max(4),
});
export type GeminiPlanNarrative = z.infer<typeof GeminiPlanNarrativeSchema>;

// ---------------------------------------------------------------------------
// Plan: full response shape sent to the client (narrative + code-computed
// impact numbers + the deterministic safety-layer audit trail).
// ---------------------------------------------------------------------------

export const SafetyOverrideSchema = z.object({
  field: z.string(),
  reason: z.string(),
});

export const PlanResponseSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    source: z.enum(["gemini", "fallback"]),
    language: SupportedLanguageSchema,
    aqiBand: AqiBandKeySchema,
    safetyOverrides: z.array(SafetyOverrideSchema),
  }),
  bestOutdoorWindow: z.object({
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(0).max(23),
    noSafeWindow: z.boolean(),
    explanation: longText,
  }),
  routineTweaks: z
    .array(
      z.object({
        id: idSchema,
        category: RoutineCategorySchema,
        title: shortText,
        description: longText,
        impact: ImpactSchema,
      })
    )
    .min(2),
  indoorHacks: z
    .array(
      z.object({
        id: idSchema,
        type: IndoorHackTypeSchema,
        title: shortText,
        description: longText,
        impact: ImpactSchema.nullable(),
      })
    )
    .min(3),
  sustainableAlternatives: z
    .array(
      z.object({
        id: idSchema,
        type: AlternativeTypeSchema,
        title: shortText,
        description: longText,
        effort: EffortTagSchema,
        impact: ImpactSchema,
      })
    )
    .min(2),
  maskGuidance: z
    .array(
      z.object({
        memberType: MemberTypeSchema,
        recommendation: MaskRecommendationSchema,
        reason: z.string().min(1).max(260),
      })
    )
    .min(1),
  disclaimer: z.string(),
});
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// ---------------------------------------------------------------------------
// /api/plan request
// ---------------------------------------------------------------------------

/** Shared base validation for "current AQI reading" fields, extended by each request schema below that needs one -- keeps the usAqi/pm25 rules defined exactly once. */
export const AqiReadingSchema = z.object({
  usAqi: z.number().min(0).max(500),
  pm25: z.number().min(0),
});

export const PlanRequestSchema = z.object({
  profile: ProfileSchema,
  location: LocationSchema,
  aqi: AqiReadingSchema.extend({ pm10: z.number().min(0) }),
  hourly: z.array(HourlyAirPointSchema).min(1).max(72),
  dateISO: z.string(),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

// ---------------------------------------------------------------------------
// /api/chat (Ask Saans)
// ---------------------------------------------------------------------------

export const ChatRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  // Free text is length-limited and always treated as untrusted data, never
  // as instructions (see lib/gemini.ts prompt-injection defense).
  content: z.string().min(1).max(600),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  language: SupportedLanguageSchema,
  aqi: AqiReadingSchema.extend({ locationName: z.string().min(1).max(120) }),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
