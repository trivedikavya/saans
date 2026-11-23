import { describe, expect, it } from "vitest";
import { parseShareCardParams } from "@/app/api/share-card/route";

describe("parseShareCardParams", () => {
  it("parses a valid city and AQI", () => {
    expect(parseShareCardParams("http://localhost/api/share-card?city=New%20Delhi&aqi=180")).toEqual({ city: "New Delhi", usAqi: 180 });
  });

  it("defaults the city and AQI when both are missing", () => {
    expect(parseShareCardParams("http://localhost/api/share-card")).toEqual({ city: "Your neighborhood", usAqi: 0 });
  });

  it("truncates a city name longer than 60 characters", () => {
    const longCity = "a".repeat(100);
    const { city } = parseShareCardParams(`http://localhost/api/share-card?city=${longCity}`);
    expect(city).toHaveLength(60);
  });

  it("clamps an AQI above 500 down to 500", () => {
    expect(parseShareCardParams("http://localhost/api/share-card?aqi=99999").usAqi).toBe(500);
  });

  it("clamps a negative AQI up to 0", () => {
    expect(parseShareCardParams("http://localhost/api/share-card?aqi=-50").usAqi).toBe(0);
  });

  it("treats a non-numeric AQI as 0 instead of NaN", () => {
    expect(parseShareCardParams("http://localhost/api/share-card?aqi=not-a-number").usAqi).toBe(0);
  });
});
