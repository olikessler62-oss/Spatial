/**
 * CLI: Experiment1 holdout multi-seed.
 *
 * Usage:
 *   npm run experiment1 -- --csv path/to.csv
 *   npm run experiment1 -- --csv path/to.csv --seeds 10
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CsvImportService } from "../import/csv-import-service.js";
import { runExperiment1MultiSeed } from "../experiment/experiment1-report.js";
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
function syntheticDraws(count) {
    const draws = [];
    for (let index = 0; index < count; index += 1) {
        const base = (index % 44) + 1;
        draws.push({
            drawDate: `2018-01-${String((index % 28) + 1).padStart(2, "0")}`,
            mainNumbers: [base, base + 1, base + 2, base + 3, base + 4, base + 5],
            bonusNumbers: [index % 10],
            sourceRow: index + 1,
        });
    }
    return draws;
}
function main() {
    const csvIndex = process.argv.indexOf("--csv");
    const csvPath = csvIndex >= 0 ? process.argv[csvIndex + 1] : undefined;
    const seedsIndex = process.argv.indexOf("--seeds");
    const seedCount = seedsIndex >= 0
        ? Number(process.argv[seedsIndex + 1] ?? 10)
        : 10;
    const draws = csvPath
        ? loadDrawsFromCsv(resolve(csvPath))
        : syntheticDraws(800);
    console.log(`Running Experiment1 holdout multi-seed (${seedCount}) on ${draws.length} draws…`);
    const multi = runExperiment1MultiSeed({
        draws,
        datasetLabel: csvPath ?? "synthetic",
        seedCount,
    });
    const outPath = resolve(process.cwd(), "experiment1-report.json");
    writeFileSync(outPath, `${JSON.stringify(multi, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
        protocol: multi.protocol,
        bestSeedIndex: multi.bestSeedIndex,
        selectionCriterion: multi.selectionCriterion,
        caution: multi.caution,
        runs: multi.runs,
        selection: {
            drawCount: multi.selection.drawCount,
            top1HitRate: multi.selection.summary.top1HitRate,
            top1HitAtLeast2Rate: multi.selection.summary.top1HitAtLeast2Rate,
        },
        holdout: {
            drawCount: multi.holdout.drawCount,
            top1HitRate: multi.holdout.summary.top1HitRate,
            top1HitAtLeast2Rate: multi.holdout.summary.top1HitAtLeast2Rate,
            top1Min2DeltaSpatial: multi.holdout.baseline.top1Min2DeltaSpatial,
            top1Min2PValue: multi.holdout.baseline.top1Min2PValue,
            spatialTop1Min2: multi.holdout.baseline.spatialTop1Min2.meanHitRate,
            nonSpatialTop1Min2: multi.holdout.baseline.nonSpatialTop1Min2.meanHitRate,
        },
        reportPath: outPath,
    }, null, 2));
}
main();
//# sourceMappingURL=run-experiment1.js.map