import { describe, expect, it } from "vitest";
import { ChatRequestSchema, DEFAULT_PROFILE, PlanRequestSchema, ProfileSchema } from "@/lib/schemas";

describe("ProfileSchema", () => {
  it("accepts the documented default profile", () => {
    expect(ProfileSchema.safeParse(DEFAULT_PROFILE).success).toBe(true);
  });

  it("rejects a household with zero total members", () => {
    const result = ProfileSchema.safeParse({ ...DEFAULT_PROFILE, household: { child: 0, adult: 0, senior: 0 } });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid commute mode", () => {
    const result = ProfileSchema.safeParse({ ...DEFAULT_PROFILE, commuteMode: "rocket" });
    expect(result.success).toBe(false);
  });

  it("rejects a commute distance outside the sane range", () => {
    const result = ProfileSchema.safeParse({ ...DEFAULT_PROFILE, commuteDistanceKm: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported language", () => {
    const result = ProfileSchema.safeParse({ ...DEFAULT_PROFILE, language: "fr" });
    expect(result.success).toBe(false);
  });
});

describe("PlanRequestSchema", () => {
  const validRequest = {
    profile: DEFAULT_PROFILE,
    location: { name: "Delhi", latitude: 28.6, longitude: 77.2 },
    aqi: { usAqi: 180, pm25: 95, pm10: 140 },
    hourly: [{ time: "2024-01-15T06:00", pm25: 95, pm10: 140, usAqi: 180, temperatureC: 12, windSpeedKmh: 5, humidityPercent: 60, boundaryLayerHeightM: 300 }],
    dateISO: "2024-01-15",
  };

  it("accepts a well-formed plan request", () => {
    expect(PlanRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects a request with no hourly data points", () => {
    expect(PlanRequestSchema.safeParse({ ...validRequest, hourly: [] }).success).toBe(false);
  });

  it("rejects an AQI value outside 0-500", () => {
    expect(PlanRequestSchema.safeParse({ ...validRequest, aqi: { ...validRequest.aqi, usAqi: 999 } }).success).toBe(false);
  });
});

describe("ChatRequestSchema", () => {
  it("rejects messages longer than the length limit (prompt-injection / abuse guard)", () => {
    const tooLong = "a".repeat(10_000);
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: "user", content: tooLong }],
      language: "en",
      aqi: { usAqi: 100, pm25: 50, locationName: "Delhi" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 messages in one request", () => {
    const messages = Array.from({ length: 21 }, (_, i) => ({ role: "user" as const, content: `message ${i}` }));
    const result = ChatRequestSchema.safeParse({ messages, language: "en", aqi: { usAqi: 100, pm25: 50, locationName: "Delhi" } });
    expect(result.success).toBe(false);
  });

  it("accepts a normal short conversation", () => {
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: "user", content: "Should I ventilate right now?" }],
      language: "en",
      aqi: { usAqi: 100, pm25: 50, locationName: "Delhi" },
    });
    expect(result.success).toBe(true);
  });
});
