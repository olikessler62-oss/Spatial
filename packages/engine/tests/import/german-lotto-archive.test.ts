import { describe, expect, it } from "vitest";
import {
  germanLottoArchiveToStandardCsv,
  looksLikeGermanLottoArchive,
  parseGermanLottoArchive,
} from "../../src/import/german-lotto-archive.js";
import { CsvImportService } from "../../src/import/csv-import-service.js";

const SAMPLE = [
  "     Datum;        Gewinnzahl1;        Gewinnzahl2;        Gewinnzahl3;        Gewinnzahl4;        Gewinnzahl5;        Gewinnzahl6;ZZ;;;;;;;;;;;;;;;;;;;;",
  "03.01.2018;45;10;34;31;15;35;8;;;;;;;;;;;;;;;;;;;;",
  "06.01.2018;37;47;46;32;5;14;0;;;;;;;;;;;;;;;;;;;;",
  ";;;;;;;;;;;;;;;;;;;;;;;;;;;",
  "Alle Angaben ohne Gewähr;;;;;;;;;;;;;;;;;;;;;;;;;;;",
  "Gewinnzahlen;ZZ;S;Spiel77;Super6;Spieleinsatz;Anz. Kl. 2;;;;;;;;;;;;;;;;;;;;",
  "10.01.2018;24;25;3;45;22;43;6;;;;;;;;;;;;;;;;;;;;",
].join("\n");

describe("german lotto archive", () => {
  it("detects archive headers", () => {
    expect(looksLikeGermanLottoArchive(SAMPLE)).toBe(true);
    expect(looksLikeGermanLottoArchive("draw_date,main_numbers\n2020-01-01,1 2 3 4 5 6")).toBe(false);
  });

  it("parses draws and skips noise rows", () => {
    const draws = parseGermanLottoArchive(SAMPLE);
    expect(draws).toHaveLength(3);
    expect(draws[0]).toMatchObject({
      drawDate: "2018-01-03",
      mainNumbers: [45, 10, 34, 31, 15, 35],
      bonusNumbers: [8],
      externalId: "2018-01-03",
    });
    expect(draws[2]?.drawDate).toBe("2018-01-10");
  });

  it("converts to standard Spatial CSV", () => {
    const standard = germanLottoArchiveToStandardCsv(SAMPLE);
    expect(standard.split("\n")[0]).toBe(
      "draw_date,main_numbers,bonus_numbers,external_id",
    );
    expect(standard).toContain('2018-01-03,"45 10 34 31 15 35","8",2018-01-03');
  });

  it("imports via CsvImportService with Superzahl 0-9", () => {
    const report = new CsvImportService().import(SAMPLE, {
      mainNumbers: { minimum: 1, maximum: 49, count: 6 },
      bonusNumbers: { minimum: 0, maximum: 9, count: 1 },
    });

    expect(report.receivedRows).toBe(3);
    expect(report.acceptedRows).toBe(3);
    expect(report.rejectedRows).toBe(0);
  });
});
