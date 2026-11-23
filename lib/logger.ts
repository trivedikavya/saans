/**
 * The one error-logging helper used everywhere a caught error needs to be
 * recorded (API routes, env parsing, the Gemini wrapper). Centralizing
 * this -- instead of each call site hand-writing its own
 * `console.error("[tag] message", error)` -- means there is exactly one
 * place to later swap in a real logging/observability service.
 */
export function logError(scope: string, message: string, error?: unknown): void {
  console.error(`[${scope}] ${message}`, error);
}
