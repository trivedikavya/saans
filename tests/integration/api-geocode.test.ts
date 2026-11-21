import { beforeEach, describe, expect, it, vi } from "vitest";

const searchCitiesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/openMeteo", () => ({
  searchCities: searchCitiesMock,
  getAirQualityResponse: vi.fn(),
}));

describe("GET /api/geocode", () => {
  beforeEach(() => {
    searchCitiesMock.mockReset();
  });

  it("returns search results for a valid query", async () => {
    searchCitiesMock.mockResolvedValueOnce([{ name: "Delhi, India", latitude: 28.6, longitude: 77.2 }]);
    const { GET } = await import("@/app/api/geocode/route");

    const res = await GET(new Request("http://localhost/api/geocode?q=Delhi"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(1);
  });

  it("rejects a query shorter than 2 characters", async () => {
    const { GET } = await import("@/app/api/geocode/route");
    const res = await GET(new Request("http://localhost/api/geocode?q=a"));
    expect(res.status).toBe(400);
    expect(searchCitiesMock).not.toHaveBeenCalled();
  });

  it("rejects an excessively long query", async () => {
    const { GET } = await import("@/app/api/geocode/route");
    const res = await GET(new Request(`http://localhost/api/geocode?q=${"a".repeat(200)}`));
    expect(res.status).toBe(400);
  });

  it("returns 502 if the upstream geocoder throws", async () => {
    searchCitiesMock.mockRejectedValueOnce(new Error("upstream down"));
    const { GET } = await import("@/app/api/geocode/route");
    const res = await GET(new Request("http://localhost/api/geocode?q=Delhi"));
    expect(res.status).toBe(502);
  });
});
