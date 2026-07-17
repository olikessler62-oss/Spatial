import { describe, expect, it } from "vitest";
import { CsvParser } from "../../src/import/csv-parser.js";

describe("CsvParser", () => {
  it("parses valid draw rows", () => {
    const input = [
      "draw_date,main_numbers,bonus_numbers,external_id",
      '2026-07-15,"1 8 17 24 33 49","7",draw-001',
    ].join("\n");
    const result = new CsvParser().parse(input, { externalIdColumn: "external_id" });
    expect(result).toEqual([{ drawDate: "2026-07-15", mainNumbers: [1,8,17,24,33,49], bonusNumbers: [7], externalId: "draw-001", sourceRow: 2 }]);
  });

  it("rejects an invalid date", () => {
    const input = ["draw_date,main_numbers,bonus_numbers", '2026-02-31,"1 2 3 4 5 6","7"'].join("\n");
    expect(() => new CsvParser().parse(input)).toThrow("Invalid calendar date");
  });
});

