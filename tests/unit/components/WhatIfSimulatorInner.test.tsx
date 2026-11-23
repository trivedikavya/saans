import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import WhatIfSimulatorInner from "@/components/simulator/WhatIfSimulatorInner";

describe("WhatIfSimulatorInner", () => {
  it("starts at 0% exposure reduction with every toggle off", () => {
    render(<WhatIfSimulatorInner pm25={150} commuteMode="car" commuteDistanceKm={10} language="en" />);
    expect(screen.getByTestId("simulator-exposure-reduction")).toHaveTextContent("0%");
  });

  it("increases the displayed exposure reduction when the purifier toggle is switched on", async () => {
    const user = userEvent.setup();
    render(<WhatIfSimulatorInner pm25={150} commuteMode="car" commuteDistanceKm={10} language="en" />);

    const before = screen.getByTestId("simulator-exposure-reduction").textContent;
    await user.click(screen.getByLabelText(/HEPA purifier/i));
    const after = screen.getByTestId("simulator-exposure-reduction").textContent;

    expect(after).not.toBe(before);
    expect(Number(after?.replace("%", ""))).toBeGreaterThan(Number(before?.replace("%", "")));
  });

  it("shows nonzero CO2e/PM avoided only once the metro toggle is switched on", async () => {
    const user = userEvent.setup();
    render(<WhatIfSimulatorInner pm25={150} commuteMode="car" commuteDistanceKm={10} language="en" />);

    expect(screen.getByTestId("simulator-co2e-avoided").textContent).toBe("0g");
    expect(screen.getByTestId("simulator-pm-avoided").textContent).toBe("0.00g");

    await user.click(screen.getByLabelText(/metro\/bus/i));

    // Exact-value comparison (not jest-dom's substring-matching toHaveTextContent,
    // which would incorrectly treat "1510g" as still "containing" "0g").
    expect(screen.getByTestId("simulator-co2e-avoided").textContent).not.toBe("0g");
    expect(screen.getByTestId("simulator-pm-avoided").textContent).not.toBe("0.00g");
  });

  it("unchecking a toggle returns the exposure reduction back to its previous value", async () => {
    const user = userEvent.setup();
    render(<WhatIfSimulatorInner pm25={150} commuteMode="car" commuteDistanceKm={10} language="en" />);

    const checkbox = screen.getByLabelText(/HEPA purifier/i);
    await user.click(checkbox);
    await user.click(checkbox);

    expect(screen.getByTestId("simulator-exposure-reduction")).toHaveTextContent("0%");
  });
});
