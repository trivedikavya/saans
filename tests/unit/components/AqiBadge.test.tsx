import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AQI_BANDS } from "@/lib/constants";

describe("AqiBadge", () => {
  it.each(AQI_BANDS)("renders the '$label' text label for AQI values in its range (never color-only)", (band) => {
    const midpoint = Math.round((band.range[0] + band.range[1]) / 2);
    render(<AqiBadge usAqi={midpoint} />);
    expect(screen.getByText(band.label)).toBeInTheDocument();
  });

  it("always pairs the color with an icon, not color alone", () => {
    const { container } = render(<AqiBadge usAqi={30} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("applies the band's background/foreground colors directly (not relying on a CSS class an AT could miss)", () => {
    render(<AqiBadge usAqi={400} />);
    const badge = screen.getByText("Hazardous");
    expect(badge).toHaveStyle({ backgroundColor: "#4c0519", color: "#ffffff" });
  });
});
