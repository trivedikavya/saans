import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetStoreForTests } from "@/lib/store";

const generateContentStreamMock = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => {
  class FakeGoogleGenAI {
    models = { generateContent: vi.fn(), generateContentStream: generateContentStreamMock };
  }
  return {
    GoogleGenAI: FakeGoogleGenAI,
    Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
  };
});

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) yield { text: chunk };
}

function buildChatBody(overrides: Record<string, unknown> = {}) {
  return {
    messages: [{ role: "user", content: "Should I ventilate right now?" }],
    language: "en",
    aqi: { usAqi: 120, pm25: 70, locationName: "Test City" },
    ...overrides,
  };
}

function postChat(overrides: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(buildChatBody(overrides)),
  });
}

async function readAll(res: Response): Promise<string> {
  const text = await res.text();
  return text;
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    __resetStoreForTests();
    generateContentStreamMock.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("streams the Gemini reply and labels the source as gemini", async () => {
    generateContentStreamMock.mockResolvedValueOnce(fakeStream(["Hello ", "there, ventilate after the morning peak."]));
    const { POST } = await import("@/app/api/chat/route");

    const res = await POST(postChat({}, { "x-forwarded-for": "2.2.2.1" }));
    expect(res.headers.get("X-Saans-Source")).toBe("gemini");

    const text = await readAll(res);
    expect(text).toContain("Hello there, ventilate after the morning peak.");
  });

  it("intercepts a medical question before ever calling Gemini", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(postChat({ messages: [{ role: "user", content: "Do I have asthma?" }] }, { "x-forwarded-for": "2.2.2.2" }));

    expect(res.headers.get("X-Saans-Source")).toBe("guard");
    expect(generateContentStreamMock).not.toHaveBeenCalled();

    const text = await readAll(res);
    expect(text.toLowerCase()).toContain("doctor");
  });

  it("falls back to a rule-based message when Gemini is not configured, without calling it", async () => {
    delete process.env.GEMINI_API_KEY;
    const { POST } = await import("@/app/api/chat/route");

    const res = await POST(postChat({}, { "x-forwarded-for": "2.2.2.3" }));
    expect(res.headers.get("X-Saans-Source")).toBe("fallback");
    expect(generateContentStreamMock).not.toHaveBeenCalled();

    const text = await readAll(res);
    expect(text.toLowerCase()).toContain("offline mode");
  });

  it("appends a fallback note mid-stream if Gemini fails after streaming starts", async () => {
    generateContentStreamMock.mockRejectedValueOnce(new Error("network drop"));
    const { POST } = await import("@/app/api/chat/route");

    const res = await POST(postChat({}, { "x-forwarded-for": "2.2.2.4" }));
    const text = await readAll(res);
    expect(text.toLowerCase()).toContain("offline mode");
  });

  it("rejects an invalid request body with 400", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(postChat({ messages: [] }, { "x-forwarded-for": "2.2.2.5" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 once the per-IP rate limit is exceeded", async () => {
    generateContentStreamMock.mockResolvedValue(fakeStream(["ok"]));
    const { POST } = await import("@/app/api/chat/route");
    const ip = "8.8.8.8";

    for (let i = 0; i < 15; i++) {
      const res = await POST(postChat({}, { "x-forwarded-for": ip }));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(postChat({}, { "x-forwarded-for": ip }));
    expect(blocked.status).toBe(429);
  });
});
