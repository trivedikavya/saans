/**
 * Centralized, validated access to server-side environment variables.
 *
 * WHY a single module: every other server module (gemini.ts, rateLimit.ts,
 * cache.ts) reads config through here instead of touching `process.env`
 * directly. That gives us one place to document defaults/fallbacks and
 * keeps secrets out of client bundles (this file is only ever imported
 * from server-only code: route handlers and /lib server modules).
 */
import { z } from "zod";

const EnvSchema = z.object({
  // An empty string is treated the same as "unset" (see isGeminiConfigured
  // below) rather than a validation failure -- CI/E2E runs deliberately
  // set GEMINI_API_KEY="" to force offline/fallback mode, and that should
  // be a normal, quiet code path, not a logged "invalid env" error.
  GEMINI_API_KEY: z.string().trim().optional(),
  // Defaults to a current Gemini Flash model per the product brief.
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
  UPSTASH_REDIS_REST_URL: z.union([z.string().trim().url(), z.literal("")]).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    // Fail loudly in server logs, but never throw at import time so a
    // misconfigured deploy still serves the rule-based fallback instead
    // of crashing the whole app.
    console.error("[env] invalid environment configuration", parsed.error.flatten());
    return EnvSchema.parse({});
  }

  return parsed.data;
}

// A Proxy (not a plain object) so every property read re-parses
// `process.env` live. This costs nothing in production (env vars are fixed
// per deployment) but means tests can flip `process.env.GEMINI_API_KEY`
// between cases without needing `vi.resetModules()` gymnastics.
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return loadEnv()[prop as keyof Env];
  },
});

/** Gemini is "configured" only when a non-empty API key is present. */
export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0);
}

/** Upstash is "configured" only when both REST URL and token are present. */
export function isUpstashConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
