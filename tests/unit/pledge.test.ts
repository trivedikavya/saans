import { describe, expect, it } from "vitest";
import { PLEDGE_ITEMS, sumPledgeImpact } from "@/lib/pledge";

describe("PLEDGE_ITEMS", () => {
  it("gives every item a positive impact and labels in all three supported languages", () => {
    for (const item of PLEDGE_ITEMS) {
      expect(item.co2eGramsAvoidedPerDay).toBeGreaterThan(0);
      expect(item.pmGramsAvoidedPerDay).toBeGreaterThan(0);
      expect(item.label.en.length).toBeGreaterThan(0);
      expect(item.label.hi.length).toBeGreaterThan(0);
      expect(item.label.gu.length).toBeGreaterThan(0);
    }
  });
});

describe("sumPledgeImpact", () => {
  it("returns zero totals when nothing is checked", () => {
    const totals = sumPledgeImpact([]);
    expect(totals.co2eGramsAvoidedPerDay).toBe(0);
    expect(totals.pmGramsAvoidedPerDay).toBe(0);
  });

  it("sums only the checked items, ignoring unknown ids", () => {
    const [first, second] = PLEDGE_ITEMS;
    const onlyFirst = sumPledgeImpact([first!.id]);
    const both = sumPledgeImpact([first!.id, second!.id, "not-a-real-id"]);

    expect(onlyFirst.co2eGramsAvoidedPerDay).toBeCloseTo(first!.co2eGramsAvoidedPerDay, 5);
    expect(both.co2eGramsAvoidedPerDay).toBeCloseTo(first!.co2eGramsAvoidedPerDay + second!.co2eGramsAvoidedPerDay, 5);
  });

  it("monotonically increases as more items are checked", () => {
    const ids = PLEDGE_ITEMS.map((i) => i.id);
    let previous = 0;
    for (let i = 1; i <= ids.length; i++) {
      const total = sumPledgeImpact(ids.slice(0, i)).co2eGramsAvoidedPerDay;
      expect(total).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });
});
