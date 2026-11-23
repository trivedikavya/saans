import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  // The button's accessible name comes from its `aria-label` ("Switch to
  // ... mode"), which takes precedence over its visible text ("Dark
  // mode"/"Light mode") for getByRole's name matching -- queries below use
  // the aria-label, and separately assert the visible text too.

  it("starts in light mode (no stored preference, matchMedia reports no dark preference) and offers to switch to dark", async () => {
    renderWithProviders(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    expect(button).toHaveTextContent("Dark mode");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("adds the 'dark' class to <html> and flips its own label when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(await screen.findByRole("button", { name: "Switch to dark mode" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    const button = screen.getByRole("button", { name: "Switch to light mode" });
    expect(button).toHaveTextContent("Light mode");
  });

  it("removes the 'dark' class again on a second click (toggles back to light)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Switch to dark mode" });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveTextContent("Dark mode");
  });

  it("persists the chosen theme to localStorage so it survives a reload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(await screen.findByRole("button", { name: "Switch to dark mode" }));

    expect(window.localStorage.getItem("saans:theme:v1")).toBe("dark");
  });
});
