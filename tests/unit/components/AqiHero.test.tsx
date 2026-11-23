import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AqiHero } from "@/components/aqi/AqiHero";
import type { AirQualityResponse } from "@/lib/schemas";

function buildAirQuality(overrides: Partial<AirQualityResponse["current"]> = {}): AirQualityResponse {
  const current = {
    time: "2024-01-15T08:00",
    pm25: 134,
    pm10: 160,
    usAqi: 178,
    temperatureC: 16,
    windSpeedKmh: 2,
    humidityPercent: 70,
    boundaryLayerHeightM: 30,
    ...overrides,
  };
  return {
    location: { name: "New Delhi", latitude: 28.6, longitude: 77.2 },
    current,
    hourly: [current],
    fetchedAt: "2024-01-15T08:05:00.000Z",
    source: "open-meteo",
  };
}

describe("AqiHero", () => {
  it("renders the location name, rounded AQI number, and band label", () => {
    render(<AqiHero data={buildAirQuality()} language="en" />);
    expect(screen.getByText(/New Delhi/)).toBeInTheDocument();
    expect(screen.getByText("178")).toBeInTheDocument();
    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
  });

  it("renders the PM2.5, PM10, temperature, wind, and humidity stats", () => {
    render(<AqiHero data={buildAirQuality()} language="en" />);
    expect(screen.getByText("134 microgram/m3")).toBeInTheDocument();
    expect(screen.getByText("160 microgram/m3")).toBeInTheDocument();
    expect(screen.getByText("16 degC")).toBeInTheDocument();
    expect(screen.getByText("2 km/h")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("falls back to a placeholder when a weather stat is unavailable, instead of showing null/undefined", () => {
    render(<AqiHero data={buildAirQuality({ temperatureC: null, windSpeedKmh: null })} language="en" />);
    const placeholders = screen.getAllByText("--");
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
  });

  it("includes a data source/time attribution", () => {
    render(<AqiHero data={buildAirQuality()} language="en" />);
    expect(screen.getByText(/Open-Meteo/)).toBeInTheDocument();
  });
});
