/**
 * Simple fixed-window per-IP rate limiter shared by /api/plan and
 * /api/chat. Uses the shared KeyValueStore (Upstash if configured, else
 * in-memory) so there is exactly one rate-limiting code path in the app.
 */
import { getStore } from "./store";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
}

/**
 * Checks and increments the request count for `identifier` within
 * `bucket` (e.g. "plan" or "chat"). Returns `allowed: false` once the
 * count exceeds `limit` for the current `windowSeconds` window.
 */
export async function checkRateLimit(identifier: string, bucket: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const store = getStore();
  const key = `ratelimit:${bucket}:${identifier}`;
  const count = await store.incrWithExpiry(key, windowSeconds);

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

/** Extracts a best-effort client identifier from standard proxy headers, falling back to "unknown". */
export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
