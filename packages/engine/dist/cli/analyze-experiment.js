import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AverageHitMetric, } from "../analysis/metrics/average-hit-metric.js";
import { MaxHitMetric, } from "../analysis/metrics/max-hit-metric.js";
import { createMetricRankingAdapter, } from "../analysis/metric-ranking-adapter.js";
import { BitMask, } from "../indexing/bit-mask.js";
import { ExperimentOrchestrator, } from "../orchestration/experiment-orchestrator.js";
function getArgument(name) {
    const prefix = `--${name}=`;
    const inlineArgument = process.argv.find((argument) => argument.startsWith(prefix));
    if (inlineArgument !== undefined) {
        return inlineArgument.slice(prefix.length);
    }
    const argumentIndex = process.argv.indexOf(`--${name}`);
    if (argumentIndex >= 0) {
        return process.argv[argumentIndex + 1];
    }
    return undefined;
}
function parseInput(value) {
    const parsed = JSON.parse(value);
    if (typeof parsed !== "object"
        || parsed === null
        || Array.isArray(parsed)) {
        throw new Error("Experiment input must be a JSON object.");
    }
    return parsed;
}
function createCandidates(candidates) {
    return candidates.map((candidate) => ({
        resultId: candidate.resultId,
        input: {
            experimentId: candidate.experimentId,
            placements: candidate.placements.map((placement) => ({
                anchorValue: placement.anchorValue,
                positionCount: placement.indices.length,
                mask: BitMask.fromIndices(placement.indices),
            })),
            draws: candidate.draws.map((draw) => ({
                drawDate: draw.drawDate,
                drawnValueCount: draw.indices.length,
                mask: BitMask.fromIndices(draw.indices),
                ...(draw.externalId === undefined
                    ? {}
                    : {
                        externalId: draw.externalId,
                    }),
            })),
        },
    }));
}
async function main() {
    const file = getArgument("file");
    if (file === undefined || file.trim().length === 0) {
        throw new Error("Missing --file. Example: "
            + "npm run analyze:experiment -- "
            + "--file ../../datasets/samples/"
            + "experiment-orchestration.json");
    }
    const absoluteFile = resolve(process.cwd(), file);
    const fileContents = await readFile(absoluteFile, "utf8");
    const input = parseInput(fileContents);
    const averageHitMetric = new AverageHitMetric();
    const maxHitMetric = new MaxHitMetric();
    const request = {
        metadata: input.metadata,
        candidates: createCandidates(input.candidates),
        configuration: input.configuration,
        metricAdapters: [
            createMetricRankingAdapter(averageHitMetric, (result) => result.averageHits),
            createMetricRankingAdapter(maxHitMetric, (result) => result.maximumHits),
        ],
        ...(input.generatedAt === undefined
            ? {}
            : {
                generatedAt: input.generatedAt,
            }),
    };
    const report = new ExperimentOrchestrator().run(request);
    console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => {
    const message = error instanceof Error
        ? error.message
        : String(error);
    console.error(`Experiment analysis failed: ${message}`);
    process.exitCode = 1;
});
//# sourceMappingURL=analyze-experiment.js.map