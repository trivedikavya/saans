/**
 * One shared key-value store abstraction used by both lib/rateLimit.ts and
 * lib/planCache.ts (DRY: a single caching/storage pattern for the whole
 * app). Backed by Upstash Redis when `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` are configured, otherwise an in-memory Map.
 *
 * KNOWN LIMITATION: the in-memory backend is per-server-instance and does
 * not survive cold starts or scale across multiple serverless instances.
 * That's an acceptable tradeoff for the demo/offline-friendly default; set
 * the Upstash env vars in production for correct cross-instance rate
 * limiting and plan-cache sharing.
 */
import { isUpstashConfigured } from "./env";

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  /** Atomically increments a counter and ensures it expires after `ttlSeconds` (set on first increment only). */
  incrWithExpiry(key: string, ttlSeconds: number): Promise<number>;
}

class InMemoryStore implements KeyValueStore {
  private values = new Map<string, { value: unknown; expiresAt: number }>();
  private counters = new Map<string, { count: number; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.counters.get(key);
    if (!existing || existing.expiresAt < now) {
      this.counters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }
}

class UpstashStore implements KeyValueStore {
  // Lazily constructed so the @upstash/redis client (and its env var reads)
  // only ever happens when the feature is actually configured.
  private clientPromise: Promise<import("@upstash/redis").Redis> | null = null;

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = import("@upstash/redis").then(({ Redis }) => Redis.fromEnv());
    }
    return this.clientPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = await this.getClient();
    const value = await redis.get<T>(key);
    return value ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = await this.getClient();
    await redis.set(key, value, { ex: ttlSeconds });
  }

  async incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const redis = await this.getClient();
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  }
}

let singleton: KeyValueStore | null = null;

export function getStore(): KeyValueStore {
  if (!singleton) {
    singleton = isUpstashConfigured() ? new UpstashStore() : new InMemoryStore();
  }
  return singleton;
}

/** Test-only hook to reset the singleton between Vitest cases. */
export function __resetStoreForTests(): void {
  singleton = null;
}
