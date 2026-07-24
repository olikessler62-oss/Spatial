/**
 * CLI: most common miss-streak lengths for L/Kreuz shapes.
 *
 *   npm run experiment1:gaps -- --csv ../../lotto_import_files/LOTTO_6aus49_spatial.csv
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CsvImportService } from "../import/csv-import-service.js";
import { runExperiment1ShapeGapAnalysis } from "../experiment/experiment1-gap-analysis.js";
function loadDrawsFromCsv(path) {
    const csv = readFileSync(path, "utf8");
    const report = new CsvImportService().importWithTimeline(csv, [
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
    ], { externalIdColumn: "external_id" });
    if (report.acceptedRows === 0) {
        throw new Error("CSV contains no accepted draws.");
    }
    return [...report.acceptedDraws];
}
function main() {
    const csvIndex = process.argv.indexOf("--csv");
    const csvPath = csvIndex >= 0 ? process.argv[csvIndex + 1] : undefined;
    const seedIndex = process.argv.indexOf("--seed");
    const seed = seedIndex >= 0 ? Number(process.argv[seedIndex + 1] ?? 0) : 0;
    if (!csvPath) {
        throw new Error("Please pass --csv path/to.csv");
    }
    const draws = loadDrawsFromCsv(resolve(csvPath));
    const report = runExperiment1ShapeGapAnalysis({
        draws,
        seedIndex: Number.isInteger(seed) ? seed : 0,
    });
    const outPath = resolve(process.cwd(), "experiment1-gaps.json");
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
        layoutSeed: report.layoutSeed,
        drawCount: report.drawCount,
        shapes: report.shapes.map((shape) => ({
            shape: shape.shapeName,
            totalMissStreaks: shape.totalMissStreaks,
            mostCommonMissCount: shape.mostCommonMissCount,
            mostCommonOccurrences: shape.mostCommonOccurrences,
            mostCommonShare: shape.mostCommonShare,
            topFrequencies: shape.missFrequencies.slice(0, 8),
        })),
        reportPath: outPath,
    }, null, 2));
}
main();
//# sourceMappingURL=run-experiment1-gaps.js.map