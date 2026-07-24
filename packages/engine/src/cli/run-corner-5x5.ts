/**
 * Top-left 5×5 miss analysis on a single fixed 7×7 layout.
 *
 *   npm run corner5x5 -- --csv ../../lotto_import_files/LOTTO_6aus49_spatial.csv
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { CsvImportService } from "../import/csv-import-service.js";
import { analyzeCorner5x5LatestMisses } from "../experiment/corner-5x5-miss-analysis.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";

function loadDrawsFromCsv(path: string): ParsedDraw[] {
  const csv = readFileSync(path, "utf8");
  const report = new CsvImportService().importWithTimeline(
    csv,
    [
      {
        id: "lotto-rules",
        validFrom: "2018-01-01",
        validTo: null,
        bonusType: "superzahl",
        rules: {
          mainNumbers: { minimum: 1, maximum: 49, count: 6 },
          bonusNumbers: { minimum: 0, maximum: 9, count: 1 },
        },
      },
    ],
    { externalIdColumn: "external_id" },
  );

  if (report.acceptedRows === 0) {
    throw new Error("CSV contains no accepted draws.");
  }

  return [...report.acceptedDraws];
}

function main(): void {
  const csvIndex = process.argv.indexOf("--csv");
  const csvPath = csvIndex >= 0 ? process.argv[csvIndex + 1] : undefined;

  if (!csvPath) {
    throw new Error("Please pass --csv path/to.csv");
  }

  const draws = loadDrawsFromCsv(resolve(csvPath));
  const report = analyzeCorner5x5LatestMisses({ draws });

  const outPath = resolve(process.cwd(), "corner-5x5-miss-report.json");
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  // Aggregate by shape type for a compact console summary
  const byShape = new Map<string, Array<(typeof report.missedOnLatest)[number]>>();
  for (const missed of report.missedOnLatest) {
    const list = byShape.get(missed.shapeName) ?? [];
    list.push(missed);
    byShape.set(missed.shapeName, list);
  }

  console.log(JSON.stringify({
    layoutSeed: report.layoutSeed,
    latestDrawDate: report.latestDrawDate,
    latestMainNumbers: report.latestMainNumbers,
    drawCount: report.drawCount,
    placementsInWindow: report.placementCountInWindow,
    hitOnLatest: report.hitOnLatestCount,
    missedOnLatest: report.missedOnLatest.length,
    byShape: [...byShape.entries()].map(([shape, items]) => ({
      shape,
      missedPlacements: items.length,
      avgCurrentMissStreak:
        items.reduce((sum, item) => sum + item.currentMissStreak, 0)
        / items.length,
      avgHistoricalMissRate:
        items.reduce((sum, item) => sum + item.historicalMissRate, 0)
        / items.length,
    })),
    samples: report.missedOnLatest.slice(0, 15).map((item) => ({
      shape: item.shapeName,
      values: item.values,
      currentMissStreak: item.currentMissStreak,
      historicalMissRate: item.historicalMissRate,
      mostCommonPastMissStreak: item.missStreakFrequencies[0] ?? null,
    })),
    reportPath: outPath,
  }, null, 2));
}

main();
