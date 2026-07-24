import { describe, expect, it } from "vitest";
import { CsvImportService } from "../../src/import/csv-import-service.js";
import type {
  LotteryRuleSet,
  VersionedLotteryRuleSet,
} from "../../src/domain/lottery-rule-set.js";

const rules: LotteryRuleSet = {
  mainNumbers: { minimum: 1, maximum: 49, count: 6 },
  bonusNumbers: { minimum: 0, maximum: 9, count: 1 },
};

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

describe("CsvImportService", () => {
  it("separates valid and invalid rows", () => {
    const input = [
      "draw_date,main_numbers,bonus_numbers,external_id",
      '2026-07-15,"1 8 17 24 33 49","7",draw-001',
      '2026-07-12,"1 1 17 24 33 50","2",draw-002',
    ].join("\n");

    const report = new CsvImportService().import(input, rules, {
      externalIdColumn: "external_id",
    });

    expect(report.receivedRows).toBe(2);
    expect(report.acceptedRows).toBe(1);
    expect(report.rejectedRows).toBe(1);
    expect(report.acceptedDraws[0]?.externalId).toBe("draw-001");
    expect(
      report.rejectedDraws[0]?.issues.map((issue) => issue.code),
    ).toEqual(["MAIN_DUPLICATE", "MAIN_OUT_OF_RANGE"]);
  });

  it("returns an empty report for header-only input", () => {
    const input = "draw_date,main_numbers,bonus_numbers";

    const report = new CsvImportService().import(input, rules);

    expect(report).toEqual({
      receivedRows: 0,
      acceptedRows: 0,
      rejectedRows: 0,
      acceptedDraws: [],
      rejectedDraws: [],
    });
  });

  it("validates draws against the rule era covering each draw date", () => {
    const input = [
      "draw_date,main_numbers,bonus_numbers,external_id",
      '2020-05-08,"3 11 19 28 44","2 9",ej-old',
      '2022-03-25,"1 8 17 24 33","7 12",ej-new',
      '2020-05-08,"3 11 19 28 44","2 12",ej-invalid-for-era',
    ].join("\n");

    const report = new CsvImportService().importWithTimeline(
      input,
      euroJackpotPeriods,
      { externalIdColumn: "external_id" },
    );

    expect(report.receivedRows).toBe(3);
    expect(report.acceptedRows).toBe(2);
    expect(report.rejectedRows).toBe(1);
    expect(report.acceptedDraws.map((draw) => draw.ruleSetId)).toEqual([
      "era-10",
      "era-12",
    ]);
    expect(report.rejectedDraws[0]?.issues[0]?.code).toBe("BONUS_OUT_OF_RANGE");
  });
});

