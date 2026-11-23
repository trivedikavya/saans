import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AppProviders } from "@/app/providers";

/** Renders a component inside the real AppProviders (profile/location/theme context) -- for components that call useAppState(). */
export function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}
