import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getStoredProfile } from "@/lib/storage";
import { renderWithProviders } from "../../helpers/renderWithProviders";

const pushMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it("starts on the household step and shows a 1-of-5 progress indicator", () => {
    renderWithProviders(<OnboardingWizard />);
    expect(screen.getByRole("group", { name: "Who's in your household?" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("the Back button is disabled on the first step", () => {
    renderWithProviders(<OnboardingWizard />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("advances through all 5 steps with Next, and back again with Back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    for (const title of ["How do you usually get around?", "Tell us about your home", "Cooking & heating", "Choose your language"]) {
      await user.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByRole("group", { name: title })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("group", { name: "Cooking & heating" })).toBeInTheDocument();
  });

  it("shows 'See today's plan' instead of 'Next' only on the final step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }

    expect(screen.getByRole("button", { name: "See today's plan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("persists the completed profile to localStorage and navigates to the dashboard on finish", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }
    await user.click(screen.getByRole("button", { name: "See today's plan" }));

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(getStoredProfile()).not.toBeNull();
  });

  it("checking the sensitive-member toggle on step 1 carries through to the saved profile", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizard />);

    await user.click(screen.getByLabelText(/asthma, a heart condition, or is pregnant/i));
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }
    await user.click(screen.getByRole("button", { name: "See today's plan" }));

    expect(getStoredProfile()?.hasSensitiveMember).toBe(true);
  });
});
