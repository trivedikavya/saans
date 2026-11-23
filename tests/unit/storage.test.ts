import { beforeEach, describe, expect, it } from "vitest";
import { getStoredLocation, getStoredPledgeChecks, getStoredProfile, hasCompletedOnboarding, setStoredLocation, setStoredPledgeChecks, setStoredProfile } from "@/lib/storage";
import { DEFAULT_PROFILE } from "@/lib/schemas";

describe("lib/storage (localStorage access)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null for the profile before anything has been stored", () => {
    expect(getStoredProfile()).toBeNull();
  });

  it("round-trips a profile through localStorage", () => {
    setStoredProfile(DEFAULT_PROFILE);
    expect(getStoredProfile()).toEqual(DEFAULT_PROFILE);
  });

  it("marks onboarding complete only after a valid profile has been stored", () => {
    expect(hasCompletedOnboarding()).toBe(false);
    setStoredProfile(DEFAULT_PROFILE);
    expect(hasCompletedOnboarding()).toBe(true);
  });

  it("round-trips a location through localStorage", () => {
    const location = { name: "Delhi", latitude: 28.6, longitude: 77.2 };
    setStoredLocation(location);
    expect(getStoredLocation()).toEqual(location);
  });

  it("returns an empty pledge list by default, and round-trips a non-empty one", () => {
    expect(getStoredPledgeChecks()).toEqual([]);
    setStoredPledgeChecks(["no-waste-burning", "carpool-weekly"]);
    expect(getStoredPledgeChecks()).toEqual(["no-waste-burning", "carpool-weekly"]);
  });

  it("treats corrupted JSON in localStorage as absent data instead of throwing", () => {
    window.localStorage.setItem("saans:profile:v1", "{not valid json");
    expect(() => getStoredProfile()).not.toThrow();
    expect(getStoredProfile()).toBeNull();
  });

  it("treats a value that fails schema validation as absent data instead of returning garbage", () => {
    window.localStorage.setItem("saans:profile:v1", JSON.stringify({ not: "a profile" }));
    expect(getStoredProfile()).toBeNull();
  });

  it("filters out non-string entries from a corrupted pledge list instead of throwing", () => {
    window.localStorage.setItem("saans:pledge:v1", JSON.stringify(["valid-id", 42, null, "another-id"]));
    expect(getStoredPledgeChecks()).toEqual(["valid-id", "another-id"]);
  });
});
