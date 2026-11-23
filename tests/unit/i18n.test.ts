import { describe, expect, it } from "vitest";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { t, TRANSLATION_KEYS } from "@/lib/i18n";

describe("t", () => {
  it("returns the English string for a known key", () => {
    expect(t("en", "appName")).toBe("Saans");
  });

  it("returns a different, non-empty string for the same key in Hindi and Gujarati", () => {
    const en = t("en", "appName");
    const hi = t("hi", "appName");
    const gu = t("gu", "appName");
    expect(hi).not.toBe(en);
    expect(gu).not.toBe(en);
    expect(hi.length).toBeGreaterThan(0);
    expect(gu.length).toBeGreaterThan(0);
  });

  it("substitutes {placeholder} variables from the vars object", () => {
    const result = t("en", "onboardingStepOf", { current: 2, total: 5 });
    expect(result).toBe("Step 2 of 5");
  });

  it("substitutes multiple different placeholders independently", () => {
    const result = t("en", "pledgeCounter", { count: 3, total: 4 });
    expect(result).toContain("3");
    expect(result).toContain("4");
  });

  it("every translation key has a non-empty translation in every supported language (no missing/blank strings)", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const key of TRANSLATION_KEYS) {
        const value = t(language, key);
        expect(value.length, `${language}/${key} should not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
