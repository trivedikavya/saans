import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoutineTweaks } from "@/components/plan/RoutineTweaks";
import { IndoorHacks } from "@/components/plan/IndoorHacks";
import type { PlanResponse } from "@/lib/schemas";

const ZERO_IMPACT = { cigaretteEquivalents: 0, exposureReductionPercent: 0, co2eGramsAvoided: 0, pmGramsAvoided: 0 };

const TWEAKS: PlanResponse["routineTweaks"] = [
  { id: "commute", category: "commute", title: "Shift your commute window", description: "Travel before the smoggiest hours.", impact: { ...ZERO_IMPACT, cigaretteEquivalents: 0.5, exposureReductionPercent: 20 } },
  { id: "exercise", category: "exercise", title: "Move exercise indoors", description: "Swap outdoor workouts for an indoor routine.", impact: ZERO_IMPACT },
];

describe("RoutineTweaks (PlanSection consumer)", () => {
  it("renders the section heading, each tweak's category/title/description, and the impact chip when present", () => {
    render(<RoutineTweaks tweaks={TWEAKS} language="en" />);

    expect(screen.getByRole("heading", { name: "Routine tweaks" })).toBeInTheDocument();
    expect(screen.getByText("commute")).toBeInTheDocument();
    expect(screen.getByText("Shift your commute window")).toBeInTheDocument();
    expect(screen.getByText("Move exercise indoors")).toBeInTheDocument();
    expect(screen.getByText(/-0.5/)).toBeInTheDocument();
  });

  it("renders every tweak as a separate list item", () => {
    render(<RoutineTweaks tweaks={TWEAKS} language="en" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("IndoorHacks (PlanSection consumer with a per-item style override)", () => {
  const hacks: PlanResponse["indoorHacks"] = [
    { id: "purifier", type: "purifier", title: "Run a purifier", description: "Keep it on medium.", impact: { ...ZERO_IMPACT, exposureReductionPercent: 60 } },
    { id: "myth", type: "myth", title: "Myth: houseplants", description: "Houseplants barely help.", impact: null },
  ];

  it("gives the myth-busting hack a visually distinct (dashed) style, and the purifier hack the standard style", () => {
    render(<IndoorHacks hacks={hacks} language="en" />);
    const items = screen.getAllByRole("listitem");

    expect(items[0]?.className).not.toContain("border-dashed");
    expect(items[1]?.className).toContain("border-dashed");
  });

  it("never renders an impact chip for a myth-busting hack (impact is null)", () => {
    render(<IndoorHacks hacks={hacks} language="en" />);
    expect(screen.getByText("Myth: houseplants")).toBeInTheDocument();
    expect(screen.getByText("Run a purifier")).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });
});
