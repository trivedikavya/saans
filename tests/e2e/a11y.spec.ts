import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Fails the test if axe reports any 'critical' or 'serious' violation. */
function expectNoSeriousViolations(violations: { id: string; impact?: string | null; description: string }[]) {
  const serious = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  if (serious.length > 0) {
    console.error(serious.map((v) => `${v.id} (${v.impact}): ${v.description}`).join("\n"));
  }
  expect(serious).toHaveLength(0);
}

test("home page has no critical/serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Saans", level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expectNoSeriousViolations(results.violations);
});

test("onboarding page has no critical/serious accessibility violations", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Set up your household" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expectNoSeriousViolations(results.violations);
});

test("responses include the expected security headers (next.config.ts)", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();

  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("geolocation=(self)");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("connect-src 'self'");
});

test("dashboard page (demo mode) has no critical/serious accessibility violations", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Try demo: New Delhi, high AQI" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Current AQI/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Offline mode: rule-based advice")).toBeVisible({ timeout: 20_000 });

  const results = await new AxeBuilder({ page }).analyze();
  expectNoSeriousViolations(results.violations);
});
