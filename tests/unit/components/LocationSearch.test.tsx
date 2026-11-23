import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationSearch } from "@/components/aqi/LocationSearch";
import { renderWithProviders } from "../../helpers/renderWithProviders";

function mockGeocodeFetch(results: { name: string; latitude: number; longitude: number }[]) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) });
}

// Real timers throughout: the component's search debounce is only 350ms,
// and combining fake timers with userEvent's internal async delays is
// fragile/prone to hanging -- real time + findBy's built-in polling is
// simpler and just as deterministic here.
describe("LocationSearch", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call the geocode API for a query shorter than 2 characters", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<LocationSearch />);
    await user.type(screen.getByLabelText(/search your city/i), "a");
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches (debounced) and renders results once the query is long enough", async () => {
    const fetchMock = mockGeocodeFetch([{ name: "Delhi, India", latitude: 28.6, longitude: 77.2 }]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<LocationSearch />);
    await user.type(screen.getByLabelText(/search your city/i), "Delhi");

    expect(await screen.findByRole("button", { name: "Delhi, India" }, { timeout: 2000 })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/geocode?q=Delhi"), expect.anything());
  }, 10_000);

  it("clears the search box once a result is selected", async () => {
    const fetchMock = mockGeocodeFetch([{ name: "Delhi, India", latitude: 28.6, longitude: 77.2 }]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<LocationSearch />);
    const input = screen.getByLabelText(/search your city/i);
    await user.type(input, "Delhi");
    await user.click(await screen.findByRole("button", { name: "Delhi, India" }, { timeout: 2000 }));

    await waitFor(() => expect(input).toHaveValue(""));
  }, 10_000);

  it("shows a friendly error when geolocation is unavailable in this environment", async () => {
    vi.stubGlobal("navigator", {});
    const user = userEvent.setup();

    renderWithProviders(<LocationSearch />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/Geolocation is not available/i)).toBeInTheDocument();
  });
});
