import { describe, expect, it } from "vitest";
import { z } from "zod";
import { jsonError, parseJsonRequest, rateLimitedResponse } from "@/lib/apiError";

const TestSchema = z.object({ name: z.string().min(1) });

function requestWithBody(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/test", { method: "POST", body, headers });
}

describe("jsonError", () => {
  it("returns a JSON body with the given message and status", async () => {
    const res = jsonError("nope", 418);
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: "nope" });
  });
});

describe("parseJsonRequest", () => {
  it("returns parsed data for a valid body matching the schema", async () => {
    const result = await parseJsonRequest(requestWithBody(JSON.stringify({ name: "Delhi" })), TestSchema);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("Delhi");
  });

  it("rejects with 400 when the body is not valid JSON", async () => {
    const result = await parseJsonRequest(requestWithBody("{not json"), TestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("rejects with 400 when the body fails schema validation", async () => {
    const result = await parseJsonRequest(requestWithBody(JSON.stringify({ name: "" })), TestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("rejects with 413 when Content-Length declares a body larger than the limit", async () => {
    const result = await parseJsonRequest(requestWithBody(JSON.stringify({ name: "x" }), { "content-length": "999999" }), TestSchema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("rejects with 413 when the actual body text exceeds the limit even without a Content-Length header", async () => {
    const result = await parseJsonRequest(requestWithBody(JSON.stringify({ name: "x".repeat(200) })), TestSchema, 50);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("treats an empty body as an empty object (fails schema validation rather than crashing)", async () => {
    const result = await parseJsonRequest(requestWithBody(""), TestSchema);
    expect(result.ok).toBe(false);
  });
});

describe("rateLimitedResponse", () => {
  it("returns 429 with a Retry-After header", async () => {
    const res = rateLimitedResponse(30);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({ error: "Too many requests. Please slow down and try again shortly." });
  });

  it("defaults Retry-After to 60 seconds", () => {
    const res = rateLimitedResponse();
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
