import { describe, expect, it } from "vitest";
import { findBestOutdoorWindow, getAqiBand, getMaskGuidance, isOutdoorExertionUnsafe, shouldStayIndoors } from "@/lib/aqi";

describe("getAqiBand", () => {
  it("classifies boundary values into the correct EPA band", () => {
    expect(getAqiBand(0).key).toBe("good");
    expect(getAqiBand(50).key).toBe("good");
    expect(getAqiBand(51).key).toBe("moderate");
    expect(getAqiBand(100).key).toBe("moderate");
    expect(getAqiBand(101).key).toBe("usg");
    expect(getAqiBand(150).key).toBe("usg");
    expect(getAqiBand(151).key).toBe("unhealthy");
    expect(getAqiBand(200).key).toBe("unhealthy");
    expect(getAqiBand(201).key).toBe("very-unhealthy");
    expect(getAqiBand(300).key).toBe("very-unhealthy");
    expect(getAqiBand(301).key).toBe("hazardous");
    expect(getAqiBand(500).key).toBe("hazardous");
  });

  it("clamps out-of-range values instead of throwing", () => {
    expect(getAqiBand(-10).key).toBe("good");
    expect(getAqiBand(9999).key).toBe("hazardous");
  });
});

describe("shouldStayIndoors / isOutdoorExertionUnsafe", () => {
  it("flags outdoor exertion unsafe above 200 and stay-indoors above 300", () => {
    expect(isOutdoorExertionUnsafe(200)).toBe(false);
    expect(isOutdoorExertionUnsafe(201)).toBe(true);
    expect(shouldStayIndoors(300)).toBe(false);
    expect(shouldStayIndoors(301)).toBe(true);
  });
});

describe("getMaskGuidance", () => {
  it("recommends no mask when AQI is Good", () => {
    expect(getMaskGuidance(30, "adult").recommendation).toBe("none");
  });

  it("recommends cloth mask in the Moderate band for general members", () => {
    expect(getMaskGuidance(75, "adult").recommendation).toBe("cloth");
  });

  it("recommends N95/FFP2 earlier (USG band) for sensitive members than general adults", () => {
    expect(getMaskGuidance(120, "sensitive").recommendation).toBe("N95_FFP2");
    expect(getMaskGuidance(120, "adult").recommendation).toBe("cloth");
  });

  it("mandates N95/FFP2 for everyone once AQI reaches Unhealthy (150+)", () => {
    expect(getMaskGuidance(150, "adult").recommendation).toBe("N95_FFP2");
    expect(getMaskGuidance(150, "child").recommendation).toBe("N95_FFP2");
  });
});

describe("findBestOutdoorWindow", () => {
  function buildHourly(pm25ByHour: number[], dateStr = "2024-01-15"): { time: string; pm25: number; usAqi: number }[] {
    return pm25ByHour.map((pm25, hour) => ({
      time: `${dateStr}T${String(hour).padStart(2, "0")}:00`,
      pm25,
      usAqi: pm25 * 2, // simplified proportional proxy for the test fixture
    }));
  }

  it("picks the awake-hours window with the lowest average AQI", () => {
    const pm = new Array(24).fill(100);
    // Make hours 6-9 the cleanest block.
    pm[6] = 10;
    pm[7] = 12;
    pm[8] = 11;
    const hourly = buildHourly(pm);

    const result = findBestOutdoorWindow(hourly, { windowLengthHours: 3 });
    expect(result.startHour).toBe(6);
    expect(result.endHour).toBe(9);
    expect(result.noSafeWindow).toBe(false);
  });

  it("flags noSafeWindow when even the best block is above the unsafe-exertion threshold", () => {
    const pm = new Array(24).fill(250); // usAqi = 500 everywhere -> always unsafe
    const hourly = buildHourly(pm);

    const result = findBestOutdoorWindow(hourly, { windowLengthHours: 3 });
    expect(result.noSafeWindow).toBe(true);
  });

  it("only considers awake hours (05:00-22:00) as candidate windows", () => {
    const pm = new Array(24).fill(100);
    pm[2] = 1; // extremely clean at 2am, should be ignored
    const hourly = buildHourly(pm);

    const result = findBestOutdoorWindow(hourly, { windowLengthHours: 2 });
    expect(result.startHour).toBeGreaterThanOrEqual(5);
  });
});
