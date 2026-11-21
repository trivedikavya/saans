import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AirQualityResponse } from "@/lib/schemas";

const getAirQualityResponseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/openMeteo", () => ({
  getAirQualityResponse: getAirQualityResponseMock,
  searchCities: vi.fn(),
}));

function fakeResponse(): AirQualityResponse {
  return {
    location: { name: "Test City", latitude: 28.6, longitude: 77.2 },
    current: { time: "2024-01-15T06:00", pm25: 100, pm10: 130, usAqi: 170, temperatureC: 14, windSpeedKmh: 5, humidityPercent: 60, boundaryLayerHeightM: 300 },
    hourly: [{ time: "2024-01-15T06:00", pm25: 100, pm10: 130, usAqi: 170, temperatureC: 14, windSpeedKmh: 5, humidityPercent: 60, boundaryLayerHeightM: 300 }],
    fetchedAt: "2024-01-15T06:05:00.000Z",
    source: "open-meteo",
  };
}

describe("GET /api/air-quality", () => {
  beforeEach(() => {
    getAirQualityResponseMock.mockReset();
  });

  it("returns the validated air quality payload for a valid lat/lon/name", async () => {
    getAirQualityResponseMock.mockResolvedValueOnce(fakeResponse());
    const { GET } = await import("@/app/api/air-quality/route");

    const res = await GET(new Request("http://localhost/api/air-quality?lat=28.6&lon=77.2&name=Test%20City"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.current.usAqi).toBe(170);
  });

  it("rejects a request missing lat/lon with 400", async () => {
    const { GET } = await import("@/app/api/air-quality/route");
    const res = await GET(new Request("http://localhost/api/air-quality?name=Nowhere"));
    expect(res.status).toBe(400);
    expect(getAirQualityResponseMock).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range latitude with 400", async () => {
    const { GET } = await import("@/app/api/air-quality/route");
    const res = await GET(new Request("http://localhost/api/air-quality?lat=999&lon=77.2&name=Nowhere"));
    expect(res.status).toBe(400);
  });

  it("returns 502 if the upstream fetch throws", async () => {
    getAirQualityResponseMock.mockRejectedValueOnce(new Error("upstream down"));
    const { GET } = await import("@/app/api/air-quality/route");
    const res = await GET(new Request("http://localhost/api/air-quality?lat=28.6&lon=77.2&name=Test"));
    expect(res.status).toBe(502);
  });
});
