import { describe, expect, it } from "vitest";
import { DrawValidator } from "../src/validation/draw-validator.js";
import type { LotteryRuleSet } from "../src/domain/lottery-rule-set.js";

const rules: LotteryRuleSet = { mainNumbers: { minimum: 1, maximum: 49, count: 6 }, bonusNumbers: { minimum: 0, maximum: 9, count: 1 } };

describe("DrawValidator", () => {
  it("accepts a valid draw", () => {
    const issues = new DrawValidator().validate({ drawDate: "2026-07-15", mainNumbers: [1,8,17,24,33,49], bonusNumbers: [7], sourceRow: 2 }, rules);
    expect(issues).toEqual([]);
  });

  it("reports duplicates and out-of-range values", () => {
    const issues = new DrawValidator().validate({ drawDate: "2026-07-15", mainNumbers: [1,1,17,24,33,50], bonusNumbers: [7], sourceRow: 2 }, rules);
    expect(issues.map((issue) => issue.code)).toEqual(["MAIN_DUPLICATE", "MAIN_OUT_OF_RANGE"]);
  });
});
