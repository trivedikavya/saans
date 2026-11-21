# Saans

<!-- Replace OWNER/REPO above once this is pushed to GitHub. -->

> A GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices.

Saans ("breath" in Hindi/Urdu) is a mobile-first Next.js app. It fetches live + 48h-forecast air quality for any city, builds a daily low-emission plan with Gemini (structured output, safety-checked, with a deterministic rule-based fallback), and shows the exact cigarette-equivalent exposure and CO2e/PM emissions avoided for every recommendation -- numbers that are **always computed in code, never by the LLM**.

## Table of contents

- [Problem statement](#problem-statement)
- [Architecture](#architecture)
- [Setup](#setup)
- [Requirements traceability](#requirements-traceability)
- [How to verify](#how-to-verify)
- [Known limitations](#known-limitations)

## Problem statement

> A GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser (client components only -- no secrets, no direct 3rd-party calls)│
│                                                                           │
│  Onboarding wizard ──▶ localStorage (profile, location, pledge, theme)   │
│  Dashboard ──▶ fetch() ──┐                                               │
│  What-If simulator (pure client math, lib/simulator.ts, no network)      │
│  Ask Saans chat ──▶ fetch() (streaming) ──┐                              │
└───────────────────────────────────────────┼─────────────────────────────┘
                                             │  same-origin only (CSP connect-src 'self')
┌────────────────────────────────────────────▼────────────────────────────┐
│ Next.js Route Handlers (server-only)                                    │
│                                                                           │
│  /api/geocode  ─────▶ lib/openMeteo.ts ──▶ Open-Meteo Geocoding API      │
│  /api/air-quality ──▶ lib/openMeteo.ts ──▶ Open-Meteo Air Quality +      │
│                        ("use cache", ~15min)   Forecast APIs             │
│  /api/plan (POST)  ─┬▶ lib/safety.ts  (PRE: inject hard constraints)     │
│                      ├▶ lib/gemini.ts (structured JSON, retry x1)        │
│                      │     │ fails/unconfigured/timeout                  │
│                      │     ▼                                            │
│                      ├▶ lib/fallbackPlan.ts (rule-based templates)       │
│                      ├▶ lib/safety.ts  (POST: override unsafe text)      │
│                      ├▶ lib/impact.ts + lib/emissions.ts + lib/aqi.ts    │
│                      │     (THE ONLY place numbers are attached)         │
│                      ├▶ lib/rateLimit.ts + lib/planCache.ts (lib/store)  │
│                      └▶ Zod-validated PlanResponse                       │
│  /api/chat (POST)   ─┬▶ lib/chatGuard.ts (deterministic medical refusal) │
│                      └▶ lib/gemini.ts streamChatReply (SSE-like stream)  │
│  /api/share-card     ─▶ next/og ImageResponse (Family Air Card PNG)      │
└───────────────────────────────────────────────────────────────────────┘
```

**Why this shape:** the client never talks to Open-Meteo, Gemini, or Upstash directly -- every external call goes through our own route handlers. That keeps secrets server-only, lets the CSP `connect-src` stay `'self'`, and gives us one place to validate (Zod), cache, and rate-limit every request.

## Setup

Requires Node.js 20+ (built against Node 24) and npm.

```bash
npm install
cp .env.example .env.local   # optional -- the app works with zero keys, see "Demo mode" below
npm run dev
```

Open http://localhost:3000. No API key is required to try the full app: click **"Try demo: New Delhi, high AQI"** on the home page, or go through onboarding yourself.

To enable real Gemini-generated plans/chat, set in `.env.local`:

```
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.5-flash
```

Optional, for shared rate-limiting/plan-cache across serverless instances (defaults to an in-memory store otherwise):

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (strict mode, no `any`) |
| `npm run test` | Vitest: unit + integration tests |
| `npm run test:e2e` | Playwright: E2E + axe accessibility |
| `npm run check:contrast` | WCAG AA contrast check for every AQI color pair |
| `npm run format` | Prettier |

## Requirements traceability

Every phrase of the problem statement maps to a concrete feature, file/route, and test that proves it.

| Problem statement phrase | Feature | File / route | Test |
| --- | --- | --- | --- |
| "...tailored to their **location**..." | City search + browser geolocation; live + 48h forecast PM2.5/PM10/US AQI + weather from Open-Meteo | `lib/openMeteo.ts`, `app/api/geocode/route.ts`, `app/api/air-quality/route.ts`, `components/aqi/LocationSearch.tsx` | `tests/integration/api-geocode.test.ts`, `tests/integration/api-air-quality.test.ts`, `tests/e2e/onboarding-flow.spec.ts` |
| "...tailored to their...**lifestyle**..." | 5-step onboarding (household/sensitive member, commute, home/ventilation/purifier, cooking/heating, language), stored in `localStorage` only | `lib/schemas.ts` (`ProfileSchema`), `lib/storage.ts`, `components/onboarding/**` | `tests/unit/schemas.test.ts`, `tests/e2e/onboarding-flow.spec.ts` |
| "...suggests low-emission **daily routines**..." | Routine tweaks (commute/school/exercise/errands) in the generated plan | `lib/gemini.ts`, `lib/fallbackPlan.ts`, `components/plan/RoutineTweaks.tsx` | `tests/unit/fallbackPlan.test.ts`, `tests/integration/api-plan.test.ts` |
| "...**indoor air quality hacks**..." | Ventilate/seal timing, purifier placement, DIY Corsi-Rosenthal box, cooking ventilation, myth-busting (houseplants etc.) | `lib/fallbackPlan.ts`, `lib/gemini.ts` (schema forces at least one `myth`/`diy`/`cooking` hack), `components/plan/IndoorHacks.tsx` | `tests/unit/fallbackPlan.test.ts` ("always includes a myth-busting hack", "always includes a DIY ... hack") |
| "...**sustainable alternatives**..." with effort/cost tags | Public transport, carpool, avoid burning waste/wood, electric heating -- each tagged Free/Low/Medium | `lib/impact.ts` (deterministic effort mapping), `components/plan/SustainableAlternatives.tsx` | `tests/unit/impact.test.ts` |
| "Best outdoor window today" | Deterministic scan of the 48h forecast for the lowest-AQI awake-hours block | `lib/aqi.ts` (`findBestOutdoorWindow`) | `tests/unit/aqi.test.ts` |
| Mask guidance by AQI band and member type | Deterministic band/member-type -> N95/FFP2/cloth/none table | `lib/aqi.ts` (`getMaskGuidance`), `components/plan/MaskGuidance.tsx` | `tests/unit/aqi.test.ts`, `tests/unit/impact.test.ts` |
| "...**clearly explaining the direct impact** of their choices" -- cigarette-equivalents & % exposure reduction | Computed in code from the documented 22 microgram/m3-per-cigarette heuristic, never by the LLM | `lib/emissions.ts` (`cigaretteEquivalents`, `exposureReductionPercent`), `lib/impact.ts`, `components/plan/ImpactChip.tsx` | `tests/unit/emissions.test.ts`, `tests/unit/impact.test.ts` |
| "...direct impact..." -- CO2e / PM grams avoided | Documented emission-factor table (transport, heating, open burning) | `lib/emissions.ts` | `tests/unit/emissions.test.ts` |
| What-if simulator | Live, client-side-only recompute of exposure/CO2e/PM as toggles flip (no network call) | `lib/simulator.ts`, `components/simulator/**` | `tests/unit/simulator.test.ts`, `tests/e2e/onboarding-flow.spec.ts` |
| Community mode -- Family Air Card | Shareable PNG via `next/og` | `app/api/share-card/route.tsx`, `components/community/FamilyAirCardPreview.tsx` | `tests/e2e/onboarding-flow.spec.ts` |
| Community mode -- WhatsApp-ready brief (localized) | Deterministic, templated text brief in en/hi/gu | `lib/communityBrief.ts`, `components/community/WhatsAppBrief.tsx` | `tests/unit/communityBrief.test.ts`, `tests/e2e/onboarding-flow.spec.ts` |
| Community mode -- Neighborhood Pledge + impact counter | Checklist stored locally; counter sums the same emission factor table | `lib/pledge.ts`, `components/community/NeighborhoodPledge.tsx` | `tests/unit/pledge.test.ts` |
| Ask Saans -- streaming follow-up chat grounded in AQI/profile | Streams Gemini output; refuses diagnosis and redirects to a doctor | `lib/gemini.ts` (`streamChatReply`), `lib/chatGuard.ts`, `app/api/chat/route.ts`, `components/chat/AskSaans.tsx` | `tests/unit/chatGuard.test.ts`, `tests/integration/api-chat.test.ts` |
| Deterministic safety layer (pre + post LLM) | AQI-band rules forbid unsafe outdoor-exertion/mask text before *and* after generation; overrides are logged and shown in the UI | `lib/safety.ts` | `tests/unit/safety.test.ts`, `tests/integration/api-plan.test.ts` ("overrides an unsafe outdoor-exercise suggestion...") |
| Fallback mode ("never silently pretend AI is on") | Rule-based templates when Gemini is unconfigured/times out/fails validation twice; visible "Offline mode" badge | `lib/fallbackPlan.ts`, `components/plan/OfflineBadge.tsx` | `tests/integration/api-plan.test.ts`, `tests/integration/api-chat.test.ts`, `tests/e2e/onboarding-flow.spec.ts` |
| Prompt-injection defense | User free text length-limited, delimited, and explicitly treated as data in the system prompt | `lib/gemini.ts` (`buildPlanSystemPrompt`, `buildChatSystemPrompt`), `lib/schemas.ts` (`ChatMessageSchema` max length) | `tests/unit/schemas.test.ts` ("rejects messages longer than the length limit") |
| Medical disclaimer + data attribution on every plan | Fixed disclaimer string + "Data: Open-Meteo, updated HH:MM" | `lib/impact.ts`, `components/plan/PlanView.tsx`, `components/aqi/AqiHero.tsx` | `tests/unit/impact.test.ts` (schema requires `disclaimer`) |
| Rate limiting on `/api/plan` and `/api/chat` | Shared KV abstraction (Upstash if configured, else in-memory) | `lib/rateLimit.ts`, `lib/store.ts` | `tests/unit/rateLimit.test.ts`, `tests/integration/api-plan.test.ts`, `tests/integration/api-chat.test.ts` (429 tests) |
| Security headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `next.config.ts` | `tests/e2e/a11y.spec.ts` ("responses include the expected security headers") |
| Caching AQI/weather (~15 min) + identical-plan-request caching | `"use cache"` + `cacheLife` on the Open-Meteo fetch; SHA-256-keyed plan cache | `lib/openMeteo.ts`, `lib/planCache.ts` | `tests/unit/planCache.test.ts` (key determinism); live caching behavior is a Next.js-compiler feature exercised by `npm run dev`/`build`, not reproducible under Vitest -- see Known limitations |
| WCAG AA contrast for every AQI color pair, never color-alone | Darkened AQI palette + icon + text label on every badge | `lib/constants.ts`, `components/aqi/AqiIcon.tsx`, `components/aqi/AqiBadge.tsx`, `scripts/check-contrast.ts` | `tests/unit/check-contrast.test.ts`, `npm run check:contrast` |
| Full keyboard operation, skip link, aria-live | Semantic `fieldset`/`legend`/`label`/`button`, skip link, `aria-live` on streaming chat and plan updates | `components/layout/SkipLink.tsx`, `components/chat/AskSaans.tsx`, `components/plan/PlanView.tsx` | `tests/e2e/a11y.spec.ts` (zero critical/serious axe violations) |
| Alt text + data-table alternative for charts | 48h forecast chart has a text summary and a toggleable `<table>` | `components/aqi/ForecastChart.tsx` | manual + `tests/e2e/a11y.spec.ts` |
| Multilingual (English, Hindi, Gujarati) with correct `lang` | UI dictionary + `document.documentElement.lang` sync | `lib/i18n.ts`, `app/providers.tsx` | `tests/unit/fallbackPlan.test.ts` (fallback content per language), `tests/unit/communityBrief.test.ts` |

## How to verify

```bash
npm install
npm run lint          # 0 errors
npm run typecheck      # 0 errors, strict mode, no `any`
npm run check:contrast # prints a table; all 6 AQI bands PASS >= 4.5:1
npm run test           # Vitest: 124 unit + integration tests, all passing
npm run build           # production build
npm run test:e2e       # Playwright + axe: 5 tests (onboarding->plan->simulator->share, 3x axe, headers)
npm audit --audit-level=high   # 0 vulnerabilities
```

What to look for:

- **Offline mode proof**: leave `GEMINI_API_KEY` unset (default). Open the dashboard -- the plan still renders fully, with a visible amber **"Offline mode: rule-based advice"** badge (`components/plan/OfflineBadge.tsx`). `tests/integration/api-plan.test.ts` asserts `meta.source === "fallback"` and that Gemini is never called in this case.
- **Safety override proof**: `tests/integration/api-plan.test.ts` → "overrides an unsafe outdoor-exercise suggestion at high AQI even when Gemini suggests one" feeds a mocked Gemini response that recommends an outdoor jog at AQI 280 and asserts the served plan no longer contains it, with a logged override in `meta.safetyOverrides`.
- **Numbers-never-from-the-LLM proof**: `GeminiPlanNarrativeSchema` (`lib/schemas.ts`) has no numeric fields at all -- only enums and prose. Every `Impact` number is attached afterward in `lib/impact.ts`. `tests/unit/impact.test.ts` checks every computed `Impact` is non-negative and that myth-busting hacks get `impact: null`.
- **CI badge**: green = lint + typecheck + contrast + unit/integration tests + build + `npm audit` + Playwright/axe all passed on the latest push (see `.github/workflows/ci.yml`).
- **Live demo without any keys**: click "Try demo: New Delhi, high AQI" on the home page. This hits the real Open-Meteo APIs (no key needed) and renders a complete plan via the rule-based fallback.

## Known limitations

Stated honestly, not swept under the rug:

- **In-memory rate limiting / plan cache**: without `UPSTASH_REDIS_REST_URL`/`TOKEN` set, `lib/store.ts` falls back to a per-process `Map`. This is correct for local dev and single-instance deployments but does **not** share state across multiple serverless instances or survive a cold start. Set the Upstash env vars in production for correct cross-instance behavior.
- **Language switch is client-only, not routed**: there are no localized URL paths (`/hi/...`); the UI dictionary (`lib/i18n.ts`) swaps in place and syncs `<html lang>`. This was a deliberate scope-discipline tradeoff over adopting a full i18n routing library for three languages.
- **Community mode has no real backend**: the Family Air Card, WhatsApp brief, and Neighborhood Pledge are all local/shareable artifacts (image + text + localStorage checklist), not a multi-user social feature with a shared server-side society/group model -- consistent with "no accounts, no server-side storage of health/profile data."
- **Boundary-layer height as an inversion proxy** is a simplification: a shallow boundary layer correlates with trapped pollutants, but it is not a full atmospheric inversion model.
- **Cigarette-equivalent figure is a communication heuristic**, not a peer-reviewed medical dose measurement -- labeled as such everywhere it appears in the UI.
- **CSP uses `'unsafe-inline'` for `script-src`**, not a nonce. Next.js embeds the RSC/hydration payload in inline `<script>` tags; a nonce-based CSP would require `proxy.ts` plus fully dynamic rendering (per Next's own CSP guide), which we intentionally avoided for this mostly client-driven app. (This was caught and fixed via the Playwright E2E suite during development -- an earlier, stricter CSP silently broke all client-side hydration while still returning HTTP 200, which is exactly the kind of regression E2E tests are for.)
- **`"use cache"` behavior for Open-Meteo responses is a Next.js-compiler feature** (Cache Components) and isn't exercised by Vitest (which runs on Vite/esbuild, not the Next compiler) -- it's verified by running the app (`npm run dev`/`build`) rather than a unit test, and the cache-key/value logic that *is* framework-agnostic (`lib/planCache.ts`) has its own unit tests.
- **Effort tags for the `other` sustainable-alternative type** (a schema escape hatch for anything Gemini's narrative doesn't cleanly fit into the four named categories) get a conservative zero `Impact` rather than an estimate, since we don't know what the alternative actually is.

## Deploying

Vercel-ready out of the box: `next.config.ts` has no custom server, and all routes are standard App Router Route Handlers. Set `GEMINI_API_KEY`/`GEMINI_MODEL` (and optionally the Upstash vars) as environment variables in your Vercel project; everything else works with no configuration.

## Tech stack

Next.js 16 (App Router, Cache Components) + TypeScript (strict, no `any`) + Tailwind CSS v4 + Zod + Recharts (lazy-loaded) + `@google/genai` + Vitest + React Testing Library + Playwright + `@axe-core/playwright` + ESLint + Prettier + GitHub Actions.
