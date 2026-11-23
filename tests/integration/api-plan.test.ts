import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetStoreForTests } from "@/lib/store";
import { DEFAULT_PROFILE, PlanResponseSchema } from "@/lib/schemas";
import { buildHourlyFixture } from "../helpers/fixtures";

// Hoisted mocks so the vi.mock factory below (which Vitest hoists above
// imports) can reference them.
const generateContentMock = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => {
  class FakeGoogleGenAI {
    models = { generateContent: generateContentMock, generateContentStream: vi.fn() };
  }
  return {
    GoogleGenAI: FakeGoogleGenAI,
    Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY", BOOLEAN: "BOOLEAN", NUMBER: "NUMBER", INTEGER: "INTEGER" },
  };
});

const VALID_NARRATIVE = {
  bestOutdoorWindowExplanation: "Air is calmer in the early morning hours.",
  routineTweaks: [
    { id: "commute", category: "commute", title: "Shift commute", description: "Travel a little earlier than usual." },
    { id: "exercise", category: "exercise", title: "Move indoors", description: "Try an indoor workout today." },
  ],
  indoorHacks: [
    { id: "purifier", type: "purifier", title: "Run a purifier", description: "Keep it on medium in the main room." },
    { id: "diy", type: "diy", title: "Build a CR box", description: "Tape four filters around a box fan." },
    { id: "myth", type: "myth", title: "Myth: candles", description: "Scented candles do not clean the air." },
  ],
  sustainableAlternatives: [
    { id: "pt", type: "public_transport", title: "Take the metro", description: "Lower emissions per trip than driving." },
    { id: "carpool", type: "carpool", title: "Carpool to work", description: "Share the ride with a colleague a few days a week." },
  ],
  maskGuidanceReasons: [{ memberType: "adult", reason: "Based on today's conditions." }],
};

function buildRequestBody(overrides: Record<string, unknown> = {}) {
  return {
    profile: DEFAULT_PROFILE,
    location: { name: "Test City", latitude: 28.6, longitude: 77.2 },
    aqi: { usAqi: 180, pm25: 120, pm10: 150 },
    hourly: buildHourlyFixture(120),
    dateISO: "2024-01-15",
    ...overrides,
  };
}

function postPlan(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    __resetStoreForTests();
    generateContentMock.mockReset();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a schema-valid plan from Gemini on success", async () => {
    generateContentMock.mockResolvedValueOnce({ text: JSON.stringify(VALID_NARRATIVE) });
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody(), { "x-forwarded-for": "1.1.1.1" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(PlanResponseSchema.safeParse(json).success).toBe(true);
    expect(json.meta.source).toBe("gemini");
  });

  it("retries once on malformed JSON, then falls back if the retry also fails", async () => {
    generateContentMock.mockResolvedValueOnce({ text: "not valid json {{{" });
    generateContentMock.mockResolvedValueOnce({ text: "still not valid" });
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody(), { "x-forwarded-for": "1.1.1.2" }));
    const json = await res.json();

    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(json.meta.source).toBe("fallback");
    expect(PlanResponseSchema.safeParse(json).success).toBe(true);
  });

  it("succeeds on the retry when the first attempt is malformed but the second is valid", async () => {
    generateContentMock.mockResolvedValueOnce({ text: "{broken" });
    generateContentMock.mockResolvedValueOnce({ text: JSON.stringify(VALID_NARRATIVE) });
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody(), { "x-forwarded-for": "1.1.1.3" }));
    const json = await res.json();

    expect(json.meta.source).toBe("gemini");
  });

  it("falls back when Gemini times out / throws", async () => {
    generateContentMock.mockRejectedValue(new Error("simulated timeout"));
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody(), { "x-forwarded-for": "1.1.1.4" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.meta.source).toBe("fallback");
  });

  it("uses the fallback immediately, without calling Gemini, when no API key is configured", async () => {
    vi.unstubAllEnvs();
    delete process.env.GEMINI_API_KEY;
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody(), { "x-forwarded-for": "1.1.1.5" }));
    const json = await res.json();

    expect(generateContentMock).not.toHaveBeenCalled();
    expect(json.meta.source).toBe("fallback");
  });

  it("overrides an unsafe outdoor-exercise suggestion at high AQI even when Gemini suggests one", async () => {
    const unsafeNarrative = {
      ...VALID_NARRATIVE,
      routineTweaks: [{ id: "exercise", category: "exercise", title: "Go for a jog", description: "Go for an outdoor jog or run in the park this morning." }],
    };
    generateContentMock.mockResolvedValueOnce({ text: JSON.stringify(unsafeNarrative) });
    const { POST } = await import("@/app/api/plan/route");

    const res = await POST(postPlan(buildRequestBody({ aqi: { usAqi: 280, pm25: 220, pm10: 260 } }), { "x-forwarded-for": "1.1.1.6" }));
    const json = await res.json();

    expect(json.routineTweaks[0].description.toLowerCase()).not.toContain("jog");
    expect(json.meta.safetyOverrides.length).toBeGreaterThan(0);
  });

  it("rejects a malformed request body with 400", async () => {
    const { POST } = await import("@/app/api/plan/route");
    const res = await POST(postPlan({ not: "valid" }, { "x-forwarded-for": "1.1.1.7" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 once the per-IP rate limit is exceeded", async () => {
    generateContentMock.mockResolvedValue({ text: JSON.stringify(VALID_NARRATIVE) });
    const { POST } = await import("@/app/api/plan/route");
    const ip = "9.9.9.9";

    for (let i = 0; i < 10; i++) {
      const res = await POST(postPlan(buildRequestBody({ dateISO: `2024-01-${15 + i}` }), { "x-forwarded-for": ip }));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(postPlan(buildRequestBody({ dateISO: "2024-02-01" }), { "x-forwarded-for": ip }));
    expect(blocked.status).toBe(429);
  });
});
