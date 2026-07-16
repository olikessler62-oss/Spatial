import { describe, expect, it } from "vitest";
import { CsvImportService } from "../src/import/csv-import-service.js";
import type { LotteryRuleSet } from "../src/domain/lottery-rule-set.js";

const rules: LotteryRuleSet = {
  mainNumbers: { minimum: 1, maximum: 49, count: 6 },
  bonusNumbers: { minimum: 0, maximum: 9, count: 1 },
};

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
});
