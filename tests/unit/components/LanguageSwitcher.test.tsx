import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { DEFAULT_PROFILE } from "@/lib/schemas";
import { setStoredProfile } from "@/lib/storage";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("renders nothing before onboarding (no profile yet)", () => {
    const { container } = renderWithProviders(<LanguageSwitcher />);
    expect(container.querySelector("select")).toBeNull();
  });

  it("shows the profile's current language once a profile exists", async () => {
    setStoredProfile(DEFAULT_PROFILE);
    renderWithProviders(<LanguageSwitcher />);

    expect(await screen.findByRole("combobox")).toHaveValue("en");
  });

  it("lists English, Hindi, and Gujarati as options", async () => {
    setStoredProfile(DEFAULT_PROFILE);
    renderWithProviders(<LanguageSwitcher />);

    const select = await screen.findByRole("combobox");
    const optionLabels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(optionLabels.some((label) => label?.includes("English"))).toBe(true);
    expect(optionLabels.some((label) => label?.includes("हिन्दी"))).toBe(true);
    expect(optionLabels.some((label) => label?.includes("ગુજરાતી"))).toBe(true);
  });

  it("switching the language updates <html lang> and persists the new language to the stored profile", async () => {
    setStoredProfile(DEFAULT_PROFILE);
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    const select = await screen.findByRole("combobox");
    await user.selectOptions(select, "hi");

    expect(document.documentElement.lang).toBe("hi");
    const stored = JSON.parse(window.localStorage.getItem("saans:profile:v1") ?? "{}");
    expect(stored.language).toBe("hi");
  });
});
