/**
 * One shared error-handling / request-validation pattern for every route
 * handler: read the body with a hard size cap (reject oversized payloads
 * before they ever reach JSON.parse or Zod), then validate with the
 * route's Zod schema. Every failure returns a consistent `{ error }` JSON
 * shape.
 */
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export type ParsedRequest<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

const DEFAULT_MAX_BODY_BYTES = 20_000; // Generous for our small JSON payloads; blocks abusive oversized bodies.

/** Reads, size-checks, and Zod-validates a JSON request body in one call. */
export async function parseJsonRequest<T>(request: Request, schema: ZodType<T>, maxBytes: number = DEFAULT_MAX_BODY_BYTES): Promise<ParsedRequest<T>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, response: jsonError("Request body too large.", 413) };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: jsonError("Could not read request body.", 400) };
  }

  if (text.length > maxBytes) {
    return { ok: false, response: jsonError("Request body too large.", 413) };
  }

  let json: unknown;
  try {
    json = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    return { ok: false, response: jsonError("Request body must be valid JSON.", 400) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, response: jsonError(`Invalid request: ${result.error.issues[0]?.message ?? "validation failed"}`, 400) };
  }

  return { ok: true, data: result.data };
}

export function rateLimitedResponse(retryAfterSeconds = 60): NextResponse {
  const response = jsonError("Too many requests. Please slow down and try again shortly.", 429);
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}
