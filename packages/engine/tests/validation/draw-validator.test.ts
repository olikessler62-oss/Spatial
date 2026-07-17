import { describe, expect, it } from "vitest";

import type {
  LotteryRuleSet,
} from "../../src/domain/lottery-rule-set.js";
import type {
  ParsedDraw,
} from "../../src/domain/parsed-draw.js";
import { DrawValidator } from "../../src/validation/draw-validator.js";

const rulesWithBonus: LotteryRuleSet = {
  mainNumbers: {
    count: 6,
    minimum: 1,
    maximum: 49,
  },
  bonusNumbers: {
    count: 1,
    minimum: 0,
    maximum: 9,
  },
};

const rulesWithoutBonus: LotteryRuleSet = {
  mainNumbers: {
    count: 6,
    minimum: 1,
    maximum: 49,
  },
};

const createDraw = (
  overrides: Partial<ParsedDraw> = {},
): ParsedDraw => ({
  sourceRow: 7,
  drawDate: "2025-01-01",
  mainNumbers: [1, 2, 3, 4, 5, 6],
  bonusNumbers: [],
  ...overrides,
});

describe("DrawValidator", () => {
  it("returns no issues for a valid draw without bonus rules", () => {
    const issues = new DrawValidator().validate(
      createDraw(),
      rulesWithoutBonus,
    );

    expect(issues).toEqual([]);
  });

  it("returns no issues for a valid draw with bonus rules", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        bonusNumbers: [7],
      }),
      rulesWithBonus,
    );

    expect(issues).toEqual([]);
  });

  it("reports an invalid main number count", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        mainNumbers: [1, 2, 3],
      }),
      rulesWithoutBonus,
    );

    expect(issues).toContainEqual({
      code: "MAIN_COUNT_INVALID",
      message:
        "Expected 6 main numbers, received 3.",
      sourceRow: 7,
    });
  });

  it("reports duplicate main numbers", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        mainNumbers: [1, 2, 3, 4, 5, 5],
      }),
      rulesWithoutBonus,
    );

    expect(issues).toContainEqual({
      code: "MAIN_DUPLICATE",
      message: "main numbers must be unique.",
      sourceRow: 7,
    });
  });

  it("reports every out-of-range main number", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        mainNumbers: [0, 2, 3, 4, 5, 50],
      }),
      rulesWithoutBonus,
    );

    expect(issues).toContainEqual({
      code: "MAIN_OUT_OF_RANGE",
      message: "main number 0 is outside 1-49.",
      sourceRow: 7,
    });

    expect(issues).toContainEqual({
      code: "MAIN_OUT_OF_RANGE",
      message: "main number 50 is outside 1-49.",
      sourceRow: 7,
    });
  });

  it("can report several main-number issues together", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        mainNumbers: [0, 0],
      }),
      rulesWithoutBonus,
    );

    expect(issues).toEqual([
      {
        code: "MAIN_COUNT_INVALID",
        message:
          "Expected 6 main numbers, received 2.",
        sourceRow: 7,
      },
      {
        code: "MAIN_DUPLICATE",
        message:
          "main numbers must be unique.",
        sourceRow: 7,
      },
      {
        code: "MAIN_OUT_OF_RANGE",
        message:
          "main number 0 is outside 1-49.",
        sourceRow: 7,
      },
      {
        code: "MAIN_OUT_OF_RANGE",
        message:
          "main number 0 is outside 1-49.",
        sourceRow: 7,
      },
    ]);
  });

  it("validates bonus numbers when bonus rules exist", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        bonusNumbers: [10, 10],
      }),
      rulesWithBonus,
    );

    expect(issues).toEqual([
      {
        code: "BONUS_COUNT_INVALID",
        message:
          "Expected 1 bonus numbers, received 2.",
        sourceRow: 7,
      },
      {
        code: "BONUS_DUPLICATE",
        message:
          "bonus numbers must be unique.",
        sourceRow: 7,
      },
      {
        code: "BONUS_OUT_OF_RANGE",
        message:
          "bonus number 10 is outside 0-9.",
        sourceRow: 7,
      },
      {
        code: "BONUS_OUT_OF_RANGE",
        message:
          "bonus number 10 is outside 0-9.",
        sourceRow: 7,
      },
    ]);
  });

  it("reports unexpected bonus numbers when no bonus rule exists", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        bonusNumbers: [7],
      }),
      rulesWithoutBonus,
    );

    expect(issues).toEqual([
      {
        code: "UNEXPECTED_BONUS_NUMBERS",
        message:
          "Bonus numbers were supplied, but the rule set defines none.",
        sourceRow: 7,
      },
    ]);
  });

  it("preserves the draw source row in every issue", () => {
    const issues = new DrawValidator().validate(
      createDraw({
        sourceRow: 42,
        mainNumbers: [0, 0],
        bonusNumbers: [10, 10],
      }),
      rulesWithBonus,
    );

    expect(issues.length).toBeGreaterThan(0);

    for (const issue of issues) {
      expect(issue.sourceRow).toBe(42);
    }
  });
});