import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { __resetStoreForTests } from "@/lib/store";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetStoreForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit and blocks the next one", async () => {
    const id = "1.2.3.4";
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(id, "test-bucket", 3, 60);
      expect(result.allowed).toBe(true);
    }
    const fourth = await checkRateLimit(id, "test-bucket", 3, 60);
    expect(fourth.allowed).toBe(false);
  });

  it("tracks separate identifiers independently", async () => {
    const a = await checkRateLimit("a", "test-bucket-2", 1, 60);
    const b = await checkRateLimit("b", "test-bucket-2", 1, 60);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("resets the count after the window elapses", async () => {
    const id = "resetter";
    await checkRateLimit(id, "test-bucket-3", 1, 10);
    const blocked = await checkRateLimit(id, "test-bucket-3", 1, 10);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(11_000);

    const allowedAgain = await checkRateLimit(id, "test-bucket-3", 1, 10);
    expect(allowedAgain.allowed).toBe(true);
  });
});

describe("getClientIdentifier", () => {
  it("prefers x-forwarded-for, taking only the first address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIdentifier(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.9" });
    expect(getClientIdentifier(headers)).toBe("198.51.100.9");
  });

  it("falls back to 'unknown' when neither header is present", () => {
    expect(getClientIdentifier(new Headers())).toBe("unknown");
  });
});
