import "@testing-library/jest-dom/vitest";

// Deterministic, minimal env for every test run so suites never depend on
// whatever happens to be in the developer's shell or .env.local.
// (NODE_ENV is already "test" under Vitest and is read-only in TS's env typings.)
process.env.GEMINI_MODEL ??= "gemini-2.5-flash";
