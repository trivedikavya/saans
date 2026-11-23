import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetStoreForTests, getStore } from "@/lib/store";

// No UPSTASH_* env vars are set in the test environment, so getStore()
// always resolves to the in-memory backend here -- this test exercises
// that implementation directly, complementing the indirect coverage it
// already gets through rateLimit.test.ts and planCache.test.ts.
describe("getStore (in-memory backend)", () => {
  beforeEach(() => {
    __resetStoreForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for a key that was never set", async () => {
    expect(await getStore().get("never-set")).toBeNull();
  });

  it("round-trips a value through set/get", async () => {
    await getStore().set("profile:1", { name: "Delhi" }, 60);
    expect(await getStore().get("profile:1")).toEqual({ name: "Delhi" });
  });

  it("expires a stored value after its TTL elapses", async () => {
    const store = getStore();
    await store.set("short-lived", "value", 10);
    expect(await store.get("short-lived")).toBe("value");

    vi.advanceTimersByTime(11_000);

    expect(await store.get("short-lived")).toBeNull();
  });

  it("returns the same singleton instance across repeated calls until reset", () => {
    expect(getStore()).toBe(getStore());
  });

  it("incrWithExpiry starts counters at 1 and increments on subsequent calls", async () => {
    const store = getStore();
    expect(await store.incrWithExpiry("counter:a", 60)).toBe(1);
    expect(await store.incrWithExpiry("counter:a", 60)).toBe(2);
    expect(await store.incrWithExpiry("counter:a", 60)).toBe(3);
  });

  it("resets a counter back to 1 once its window has expired", async () => {
    const store = getStore();
    await store.incrWithExpiry("counter:b", 10);
    await store.incrWithExpiry("counter:b", 10);

    vi.advanceTimersByTime(11_000);

    expect(await store.incrWithExpiry("counter:b", 10)).toBe(1);
  });
});
