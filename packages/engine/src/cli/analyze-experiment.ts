import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  ExperimentAnalysisConfiguration,
  ExperimentAnalysisMetadata,
} from "../analysis/experiment-analysis-types.js";
import {
  AverageHitMetric,
} from "../analysis/metrics/average-hit-metric.js";
import {
  MaxHitMetric,
} from "../analysis/metrics/max-hit-metric.js";
import {
  createMetricRankingAdapter,
} from "../analysis/metric-ranking-adapter.js";
import {
  BitMask,
} from "../indexing/bit-mask.js";
import {
  ExperimentOrchestrator,
} from "../orchestration/experiment-orchestrator.js";
import type {
  ExperimentOrchestratorCandidate,
  ExperimentOrchestratorRequest,
} from "../orchestration/experiment-orchestrator-types.js";

interface RawPlacement {
  readonly anchorValue: number;
  readonly indices: readonly number[];
}

interface RawDraw {
  readonly drawDate: string;
  readonly indices: readonly number[];
  readonly externalId?: string;
}

interface RawCandidate {
  readonly resultId: string;
  readonly experimentId: string;
  readonly placements: readonly RawPlacement[];
  readonly draws: readonly RawDraw[];
}

interface OrchestrationInput {
  readonly metadata: ExperimentAnalysisMetadata;
  readonly candidates: readonly RawCandidate[];
  readonly configuration: ExperimentAnalysisConfiguration;
  readonly generatedAt?: string;
}

function getArgument(name: string): string | undefined {
  const prefix = `--${name}=`;

  const inlineArgument = process.argv.find(
    (argument) => argument.startsWith(prefix),
  );

  if (inlineArgument !== undefined) {
    return inlineArgument.slice(prefix.length);
  }

  const argumentIndex = process.argv.indexOf(`--${name}`);

  if (argumentIndex >= 0) {
    return process.argv[argumentIndex + 1];
  }

  return undefined;
}

function parseInput(value: string): OrchestrationInput {
  const parsed: unknown = JSON.parse(value);

  if (
    typeof parsed !== "object"
    || parsed === null
    || Array.isArray(parsed)
  ) {
    throw new Error(
      "Experiment input must be a JSON object.",
    );
  }

  return parsed as OrchestrationInput;
}

function createCandidates(
  candidates: readonly RawCandidate[],
): readonly ExperimentOrchestratorCandidate[] {
  return candidates.map((candidate) => ({
    resultId: candidate.resultId,
    input: {
      experimentId: candidate.experimentId,
      placements: candidate.placements.map(
        (placement) => ({
          anchorValue: placement.anchorValue,
          positionCount: placement.indices.length,
          mask: BitMask.fromIndices(
            placement.indices,
          ),
        }),
      ),
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

async function main(): Promise<void> {
  const file = getArgument("file");

  if (file === undefined || file.trim().length === 0) {
    throw new Error(
      "Missing --file. Example: "
      + "npm run analyze:experiment -- "
      + "--file ../../datasets/samples/"
      + "experiment-orchestration.json",
    );
  }

  const absoluteFile = resolve(process.cwd(), file);
  const fileContents = await readFile(
    absoluteFile,
    "utf8",
  );

  const input = parseInput(fileContents);

  const averageHitMetric = new AverageHitMetric();
  const maxHitMetric = new MaxHitMetric();

  const request: ExperimentOrchestratorRequest = {
    metadata: input.metadata,
    candidates: createCandidates(input.candidates),
    configuration: input.configuration,
    metricAdapters: [
      createMetricRankingAdapter(
        averageHitMetric,
        (result) => result.averageHits,
      ),
      createMetricRankingAdapter(
        maxHitMetric,
        (result) => result.maximumHits,
      ),
    ],
    ...(input.generatedAt === undefined
      ? {}
      : {
          generatedAt: input.generatedAt,
        }),
  };

  const report =
    new ExperimentOrchestrator().run(request);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(
    `Experiment analysis failed: ${message}`,
  );

  process.exitCode = 1;
});