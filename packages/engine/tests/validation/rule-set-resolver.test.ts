import { describe, expect, it } from "vitest";
import type { VersionedLotteryRuleSet } from "../../src/domain/lottery-rule-set.js";
import { resolveRuleSetForDate } from "../../src/validation/rule-set-resolver.js";

const euroJackpotPeriods: readonly VersionedLotteryRuleSet[] = [
  {
    id: "era-10",
    validFrom: "2014-10-10",
    validTo: "2022-03-24",
    rules: {
      mainNumbers: { minimum: 1, maximum: 50, count: 5 },
      bonusNumbers: { minimum: 1, maximum: 10, count: 2 },
    },
  },
  {
    id: "era-12",
    validFrom: "2022-03-25",
    validTo: null,
    rules: {
      mainNumbers: { minimum: 1, maximum: 50, count: 5 },
      bonusNumbers: { minimum: 1, maximum: 12, count: 2 },
    },
  },
];

describe("resolveRuleSetForDate", () => {
  it("resolves the 1-10 euro-number era", () => {
    expect(resolveRuleSetForDate("2020-06-15", euroJackpotPeriods)?.id).toBe(
      "era-10",
    );
  });

  it("resolves the 1-12 euro-number era on the change date", () => {
    expect(resolveRuleSetForDate("2022-03-25", euroJackpotPeriods)?.id).toBe(
      "era-12",
    );
  });

  it("returns null when no period covers the draw date", () => {
    expect(resolveRuleSetForDate("2010-01-01", euroJackpotPeriods)).toBeNull();
  });
});
