import { expect, test } from "@playwright/test";

/**
 * End-to-end happy path: onboarding -> live plan -> what-if simulator ->
 * community share card. Runs against the rule-based fallback (no
 * GEMINI_API_KEY, see playwright.config.ts) so the plan content is
 * deterministic, but still hits the real Open-Meteo APIs for live data --
 * this is intentionally one of the "few" E2E tests, covering the full
 * critical path end-to-end rather than every branch (that's what the unit
 * and integration tests are for).
 */
test("onboarding -> plan -> simulator -> share card", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Saans", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Each wizard step is a <fieldset><legend> -- exposed to the accessibility
  // tree as a "group" with its accessible name taken from the legend, not
  // as a heading.
  // Step 1: Household (defaults are fine, just confirm the sensitive-member toggle works).
  await expect(page.getByRole("group", { name: "Who's in your household?" })).toBeVisible();
  await page.getByLabel(/asthma, a heart condition, or is pregnant/i).check();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: Commute.
  await expect(page.getByRole("group", { name: "How do you usually get around?" })).toBeVisible();
  await page.getByRole("radio", { name: "Bus" }).check();
  await page.getByLabel(/Typical one-way distance/).fill("6");
  await page.getByRole("button", { name: "Next" }).click();

  // Step 3: Home.
  await expect(page.getByRole("group", { name: "Tell us about your home" })).toBeVisible();
  await page.getByLabel("Ventilation").selectOption("both");
  await page.getByRole("button", { name: "Next" }).click();

  // Step 4: Cooking & heating (defaults are fine).
  await expect(page.getByRole("group", { name: "Cooking & heating" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 5: Language.
  await expect(page.getByRole("group", { name: "Choose your language" })).toBeVisible();
  await page.getByRole("button", { name: "See today's plan" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  // No location chosen yet during onboarding -- search for a city now.
  await page.getByLabel("Search your city").fill("Delhi");
  await expect(page.getByRole("button", { name: /Delhi/ }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Delhi/ }).first().click();

  // Live AQI hero should render with real Open-Meteo data.
  await expect(page.getByRole("heading", { name: /Current AQI/ })).toBeVisible({ timeout: 20_000 });

  // Offline-mode badge must be visible since Gemini is intentionally unconfigured for this run.
  await expect(page.getByText("Offline mode: rule-based advice")).toBeVisible({ timeout: 20_000 });

  // Best outdoor window + mask guidance sections render.
  await expect(page.getByRole("heading", { name: /outdoor window|No genuinely safe outdoor window/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mask guidance" })).toBeVisible();

  // What-if simulator: toggling a lever should visibly change the exposure-reduction figure.
  const exposureValue = page.getByTestId("simulator-exposure-reduction");
  const before = await exposureValue.textContent();
  await page.getByLabel("Use a HEPA purifier").check();
  await expect
    .poll(async () => exposureValue.textContent(), { timeout: 5_000 })
    .not.toBe(before);

  // Community mode: Family Air Card image + WhatsApp brief + share link.
  await expect(page.getByRole("img", { name: /Family Air Card/ })).toBeVisible();
  await expect(page.getByLabel("WhatsApp-ready brief")).toContainText("AQI");
  await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
});
