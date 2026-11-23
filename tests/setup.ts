import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library normally auto-registers this cleanup via a detected
// global `afterEach`, but our vitest config doesn't set `test.globals: true`
// (test files import `afterEach`/`it`/etc. explicitly from "vitest" instead),
// so that auto-detection never fires. Without this, each `render()` call's
// DOM accumulates across tests in the same file, causing spurious
// "found multiple elements" failures in later tests.
afterEach(() => {
  cleanup();
});

// Deterministic, minimal env for every test run so suites never depend on
// whatever happens to be in the developer's shell or .env.local.
// (NODE_ENV is already "test" under Vitest and is read-only in TS's env typings.)
process.env.GEMINI_MODEL ??= "gemini-2.5-flash";

// jsdom does not implement matchMedia. Real code guards against its absence
// (see app/providers.tsx), but stubbing a standard no-match implementation
// here makes component tests exercise the same code path real browsers do.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
