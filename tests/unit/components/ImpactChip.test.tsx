import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImpactChip } from "@/components/plan/ImpactChip";
import type { Impact } from "@/lib/schemas";

function impact(overrides: Partial<Impact> = {}): Impact {
  return { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided: 0, pmGramsAvoided: 0, ...overrides };
}

describe("ImpactChip", () => {
  it("renders nothing when impact is null (e.g. myth-busting hacks)", () => {
    const { container } = render(<ImpactChip impact={null} language="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when every figure is effectively zero", () => {
    const { container } = render(<ImpactChip impact={impact()} language="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the cigarette-equivalent and exposure-reduction figures when present", () => {
    render(<ImpactChip impact={impact({ cigaretteEquivalents: 1.2, exposureReductionPercent: 60 })} language="en" />);
    expect(screen.getByText(/-1.2/)).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it("renders the CO2e/PM emissions figures when present", () => {
    render(<ImpactChip impact={impact({ co2eGramsAvoided: 1200, pmGramsAvoided: 0.5 })} language="en" />);
    expect(screen.getByText(/1200g CO2e/)).toBeInTheDocument();
    expect(screen.getByText(/0.5g PM/)).toBeInTheDocument();
  });

  it("can render both figures at once for a recommendation with both kinds of impact", () => {
    render(<ImpactChip impact={impact({ cigaretteEquivalents: 0.5, exposureReductionPercent: 30, co2eGramsAvoided: 400, pmGramsAvoided: 2 })} language="en" />);
    expect(screen.getByText(/-0.5/)).toBeInTheDocument();
    expect(screen.getByText(/400g CO2e/)).toBeInTheDocument();
  });

  it("never renders negative-looking numbers for a well-formed Impact", () => {
    render(<ImpactChip impact={impact({ cigaretteEquivalents: 1, exposureReductionPercent: 50, co2eGramsAvoided: 10, pmGramsAvoided: 1 })} language="en" />);
    // The component prefixes figures with its own literal "-" for "avoided" framing;
    // the underlying numbers themselves must never be negative.
    expect(screen.queryByText(/--/)).not.toBeInTheDocument();
  });
});
