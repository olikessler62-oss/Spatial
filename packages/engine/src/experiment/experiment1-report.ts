import { EXPERIMENT1_RANKING_CRITERIA } from "../analysis/features/placement-history-features.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ShapeDefinition } from "../domain/shape.js";
import { DrawIndexer } from "../indexing/draw-indexer.js";
import { GridLayout } from "../layout/grid-layout.js";
import { createShuffledValueMapping } from "../layout/value-mapping.js";
import { runNonSpatialGroupBaseline } from "./baselines/nonspatial-group-baseline.js";
import {
  empiricalPValue,
  runRandomPlacementBaseline,
  type BaselineDistributionSummary,
} from "./baselines/random-placement-baseline.js";
import {
  EXPERIMENT1_BASELINE_REPETITIONS,
  EXPERIMENT1_HOLDOUT_START_INDEX,
  EXPERIMENT1_INITIAL_HISTORY,
  EXPERIMENT1_LAYOUT_SEED,
  EXPERIMENT1_SHAPES,
} from "./experiment1-shapes.js";
import {
  buildTrackedPlacements,
  filterWalkForwardSteps,
  summarizeWalkForwardSteps,
  WalkForwardRunner,
  type WalkForwardResult,
  type WalkForwardStep,
} from "./walk-forward-runner.js";

export interface SegmentSummary {
  readonly label: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly drawCount: number;
  readonly top1HitRate: number;
  readonly top5AnyHitRate: number;
  readonly averageTop1Hits: number;
}

export interface ShapeBreakdownRow {
  readonly shapeId: string;
  readonly shapeName: string;
  readonly placementCount: number;
  readonly top1Selections: number;
  readonly top5Selections: number;
  readonly top1HitRate: number;
  readonly top5HitRate: number;
  readonly averageTop1Hits: number;
}

export interface Experiment1Report {
  readonly configuration: {
    readonly datasetLabel: string;
    readonly drawCount: number;
    readonly initialHistorySize: number;
    readonly testDrawCount: number;
    readonly dateFrom: string | null;
    readonly dateTo: string | null;
    readonly layoutSeed: string;
    readonly valueMapping: readonly number[];
    readonly shapes: readonly string[];
    readonly placementCount: number;
    readonly rankingCriteria: typeof EXPERIMENT1_RANKING_CRITERIA;
    readonly baselineRepetitions: number;
  };
  readonly summary: WalkForwardResult["summary"];
  readonly stability: readonly SegmentSummary[];
  readonly byShape: readonly ShapeBreakdownRow[];
  readonly baseline: {
    readonly spatialTop1: BaselineDistributionSummary;
    readonly spatialTop5: BaselineDistributionSummary;
    readonly nonSpatialTop1: BaselineDistributionSummary;
    readonly nonSpatialTop5: BaselineDistributionSummary;
    readonly top1PValue: number;
    readonly top5PValue: number;
    readonly top1DeltaSpatial: number;
    readonly top5DeltaSpatial: number;
    readonly top1DeltaNonSpatial: number;
    readonly top5DeltaNonSpatial: number;
  };
  readonly samplePredictions: readonly {
    readonly drawDate: string;
    readonly historySize: number;
    readonly top1: {
      readonly shape: string;
      readonly anchor: number;
      readonly values: readonly number[];
      readonly score: number;
      readonly features: WalkForwardStep["top1"]["features"];
      readonly hitCount: number;
    };
    readonly actualMainNumbers: readonly number[];
  }[];
}

function summarizeSegment(
  label: string,
  steps: readonly WalkForwardStep[],
): SegmentSummary {
  if (steps.length === 0) {
    return {
      label,
      startIndex: 0,
      endIndex: 0,
      drawCount: 0,
      top1HitRate: 0,
      top5AnyHitRate: 0,
      averageTop1Hits: 0,
    };
  }

  let top1Hits = 0;
  let top1AtLeast1 = 0;
  let top5Any = 0;

  for (const step of steps) {
    top1Hits += step.top1.hitCount;

    if (step.top1.hitAtLeast1) {
      top1AtLeast1 += 1;
    }

    if (step.top5.some((selection) => selection.hitAtLeast1)) {
      top5Any += 1;
    }
  }

  return {
    label,
    startIndex: steps[0]!.drawIndex,
    endIndex: steps[steps.length - 1]!.drawIndex,
    drawCount: steps.length,
    top1HitRate: top1AtLeast1 / steps.length,
    top5AnyHitRate: top5Any / steps.length,
    averageTop1Hits: top1Hits / steps.length,
  };
}

export function buildStabilitySegments(
  steps: readonly WalkForwardStep[],
): SegmentSummary[] {
  if (steps.length === 0) {
    return [];
  }

  const third = Math.ceil(steps.length / 3);
  const first = steps.slice(0, third);
  const second = steps.slice(third, third * 2);
  const thirdPart = steps.slice(third * 2);

  return [
    summarizeSegment("erstes Drittel", first),
    summarizeSegment("zweites Drittel", second),
    summarizeSegment("letztes Drittel", thirdPart),
  ];
}

export function buildShapeBreakdown(
  steps: readonly WalkForwardStep[],
  shapes: readonly ShapeDefinition[],
  placementCountByShape: ReadonlyMap<string, number>,
): ShapeBreakdownRow[] {
  return shapes.map((shape) => {
    const top1Steps = steps.filter((step) => step.top1.shapeId === shape.id);
    const top5Selections = steps.flatMap((step) =>
      step.top5.filter((selection) => selection.shapeId === shape.id),
    );

    const top1Hits = top1Steps.filter((step) => step.top1.hitAtLeast1).length;
    const top5Hits = top5Selections.filter((selection) => selection.hitAtLeast1).length;
    const top1HitSum = top1Steps.reduce(
      (sum, step) => sum + step.top1.hitCount,
      0,
    );

    return {
      shapeId: shape.id,
      shapeName: shape.name,
      placementCount: placementCountByShape.get(shape.id) ?? 0,
      top1Selections: top1Steps.length,
      top5Selections: top5Selections.length,
      top1HitRate:
        top1Steps.length === 0 ? 0 : top1Hits / top1Steps.length,
      top5HitRate:
        top5Selections.length === 0 ? 0 : top5Hits / top5Selections.length,
      averageTop1Hits:
        top1Steps.length === 0 ? 0 : top1HitSum / top1Steps.length,
    };
  });
}

export function runExperiment1(options: {
  readonly draws: readonly ParsedDraw[];
  readonly datasetLabel: string;
  readonly layoutSeed?: string;
  readonly initialHistorySize?: number;
  readonly baselineRepetitions?: number;
  readonly shapes?: readonly ShapeDefinition[];
}): Experiment1Report {
  const draws = [...options.draws].sort((left, right) =>
    left.drawDate.localeCompare(right.drawDate),
  );

  if (draws.length < 2) {
    throw new Error("Experiment1 needs at least two draws.");
  }

  const layoutSeed = options.layoutSeed ?? EXPERIMENT1_LAYOUT_SEED;
  const shapes = options.shapes ?? EXPERIMENT1_SHAPES;
  const baselineRepetitions =
    options.baselineRepetitions ?? EXPERIMENT1_BASELINE_REPETITIONS;
  const requestedHistory =
    options.initialHistorySize ?? EXPERIMENT1_INITIAL_HISTORY;
  const historySize = Math.min(
    requestedHistory,
    Math.max(1, draws.length - 1),
  );

  if (historySize >= draws.length) {
    throw new Error("Not enough draws for a walk-forward test split.");
  }

  const mapping = createShuffledValueMapping(1, 49, layoutSeed);
  const layout = new GridLayout({
    id: "experiment1-7x7",
    name: "Experiment1 Raster 7x7",
    type: "grid",
    minimumValue: 1,
    maximumValue: 49,
    columns: 7,
    valueMapping: mapping,
  });

  const walkForward = new WalkForwardRunner().run({
    experimentId: "experiment1",
    layout,
    shapes,
    draws,
    config: {
      initialHistorySize: historySize,
      ranking: {
        criteria: EXPERIMENT1_RANKING_CRITERIA,
        limit: 5,
      },
    },
  });

  const tracked = buildTrackedPlacements(layout, shapes);
  const placementCountByShape = new Map<string, number>();

  for (const placement of tracked) {
    placementCountByShape.set(
      placement.shapeId,
      (placementCountByShape.get(placement.shapeId) ?? 0) + 1,
    );
  }

  const drawIndexer = new DrawIndexer(layout);
  const indexedDraws = draws.map((draw) => drawIndexer.index(draw));
  const seeds = Array.from(
    { length: baselineRepetitions },
    (_, index) => `baseline-${index}`,
  );

  const spatialTop1 = runRandomPlacementBaseline({
    placements: tracked.map((item) => item.indexed),
    draws: indexedDraws,
    testStartIndex: historySize,
    topK: 1,
    seeds,
  });

  const spatialTop5 = runRandomPlacementBaseline({
    placements: tracked.map((item) => item.indexed),
    draws: indexedDraws,
    testStartIndex: historySize,
    topK: 5,
    seeds,
  });

  const numberPool = Array.from({ length: 49 }, (_, index) => index + 1);
  const nonSpatialTop1 = runNonSpatialGroupBaseline({
    draws,
    testStartIndex: historySize,
    topK: 1,
    groupSize: 4,
    numberPool,
    seeds,
  });

  const nonSpatialTop5 = runNonSpatialGroupBaseline({
    draws,
    testStartIndex: historySize,
    topK: 5,
    groupSize: 4,
    numberPool,
    seeds,
  });

  return {
    configuration: {
      datasetLabel: options.datasetLabel,
      drawCount: draws.length,
      initialHistorySize: historySize,
      testDrawCount: walkForward.evaluatedDraws,
      dateFrom: draws[0]?.drawDate ?? null,
      dateTo: draws[draws.length - 1]?.drawDate ?? null,
      layoutSeed,
      valueMapping: mapping,
      shapes: shapes.map((shape) => shape.name),
      placementCount: walkForward.placementCount,
      rankingCriteria: EXPERIMENT1_RANKING_CRITERIA,
      baselineRepetitions,
    },
    summary: walkForward.summary,
    stability: buildStabilitySegments(walkForward.steps),
    byShape: buildShapeBreakdown(
      walkForward.steps,
      shapes,
      placementCountByShape,
    ),
    baseline: {
      spatialTop1,
      spatialTop5,
      nonSpatialTop1,
      nonSpatialTop5,
      top1PValue: empiricalPValue(
        walkForward.summary.top1HitRate,
        spatialTop1,
      ),
      top5PValue: empiricalPValue(
        walkForward.summary.top5AnyHitRate,
        spatialTop5,
      ),
      top1DeltaSpatial:
        walkForward.summary.top1HitRate - spatialTop1.meanHitRate,
      top5DeltaSpatial:
        walkForward.summary.top5AnyHitRate - spatialTop5.meanHitRate,
      top1DeltaNonSpatial:
        walkForward.summary.top1HitRate - nonSpatialTop1.meanHitRate,
      top5DeltaNonSpatial:
        walkForward.summary.top5AnyHitRate - nonSpatialTop5.meanHitRate,
    },
    samplePredictions: walkForward.steps.slice(0, 10).map((step) => ({
      drawDate: step.drawDate,
      historySize: step.historySize,
      top1: {
        shape: step.top1.shapeName,
        anchor: step.top1.anchorValue,
        values: step.top1.values,
        score: step.top1.score,
        features: step.top1.features,
        hitCount: step.top1.hitCount,
      },
      actualMainNumbers: step.actualMainNumbers,
    })),
  };
}

export interface Experiment1SeedRunSummary {
  readonly seedIndex: number;
  readonly layoutSeed: string;
  readonly selectionTop1HitRate: number;
  readonly selectionTop1HitAtLeast2Rate: number;
  readonly holdoutTop1HitRate: number;
  readonly holdoutTop1HitAtLeast2Rate: number;
  readonly holdoutTop5HitAtLeast2Rate: number;
}

export interface Experiment1WindowMetrics {
  readonly drawCount: number;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly summary: WalkForwardResult["summary"];
  readonly stability: readonly SegmentSummary[];
  readonly byShape: readonly ShapeBreakdownRow[];
  readonly baseline: {
    readonly spatialTop1Min1: BaselineDistributionSummary;
    readonly spatialTop1Min2: BaselineDistributionSummary;
    readonly nonSpatialTop1Min2: BaselineDistributionSummary;
    readonly top1Min2PValue: number;
    readonly top1Min2DeltaSpatial: number;
    readonly top1Min2DeltaNonSpatial: number;
  };
}

export interface Experiment1MultiSeedResult {
  readonly seedCount: number;
  readonly bestSeedIndex: number;
  readonly selectionCriterion: string;
  readonly protocol: {
    readonly initialHistorySize: number;
    readonly selectionFromIndex: number;
    readonly selectionToIndexExclusive: number;
    readonly holdoutFromIndex: number;
  };
  readonly caution: string;
  readonly runs: readonly Experiment1SeedRunSummary[];
  readonly best: Experiment1Report;
  readonly selection: Experiment1WindowMetrics;
  readonly holdout: Experiment1WindowMetrics;
}

function compareHoldoutSeedRuns(
  left: Experiment1SeedRunSummary,
  right: Experiment1SeedRunSummary,
): number {
  if (left.selectionTop1HitAtLeast2Rate !== right.selectionTop1HitAtLeast2Rate) {
    return right.selectionTop1HitAtLeast2Rate - left.selectionTop1HitAtLeast2Rate;
  }

  if (left.selectionTop1HitRate !== right.selectionTop1HitRate) {
    return right.selectionTop1HitRate - left.selectionTop1HitRate;
  }

  return left.seedIndex - right.seedIndex;
}

function windowDates(
  steps: readonly WalkForwardStep[],
): { dateFrom: string | null; dateTo: string | null } {
  if (steps.length === 0) {
    return { dateFrom: null, dateTo: null };
  }

  return {
    dateFrom: steps[0]!.drawDate,
    dateTo: steps[steps.length - 1]!.drawDate,
  };
}

/**
 * Seeds 0..N-1: pick best on selection window by Top-1 ≥2 hits,
 * then report holdout window once (confirmatory).
 */
export function runExperiment1MultiSeed(options: {
  readonly draws: readonly ParsedDraw[];
  readonly datasetLabel: string;
  readonly seedCount?: number;
  readonly initialHistorySize?: number;
  readonly holdoutStartIndex?: number;
  readonly baselineRepetitions?: number;
  readonly shapes?: readonly ShapeDefinition[];
}): Experiment1MultiSeedResult {
  const seedCount = options.seedCount ?? 10;
  const shapes = options.shapes ?? EXPERIMENT1_SHAPES;
  const baselineRepetitions =
    options.baselineRepetitions ?? EXPERIMENT1_BASELINE_REPETITIONS;
  const draws = [...options.draws].sort((left, right) =>
    left.drawDate.localeCompare(right.drawDate),
  );

  if (!Number.isInteger(seedCount) || seedCount < 1) {
    throw new Error("seedCount must be a positive integer.");
  }

  if (draws.length < 2) {
    throw new Error("Experiment1 needs at least two draws.");
  }

  const historySize = Math.min(
    options.initialHistorySize ?? EXPERIMENT1_INITIAL_HISTORY,
    Math.max(1, draws.length - 1),
  );
  const holdoutStart = Math.min(
    options.holdoutStartIndex ?? EXPERIMENT1_HOLDOUT_START_INDEX,
    draws.length,
  );

  if (holdoutStart <= historySize) {
    throw new Error(
      "holdoutStartIndex must be greater than initialHistorySize.",
    );
  }

  if (holdoutStart >= draws.length) {
    throw new Error("Not enough draws for a holdout window.");
  }

  const numberPool = Array.from({ length: 49 }, (_, index) => index + 1);
  const baselineSeeds = Array.from(
    { length: baselineRepetitions },
    (_, index) => `baseline-${index}`,
  );

  const runs: Experiment1SeedRunSummary[] = [];
  const walkResults: WalkForwardResult[] = [];
  const layouts: GridLayout[] = [];

  for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
    const layoutSeed = `${EXPERIMENT1_LAYOUT_SEED}-${seedIndex}`;
    const mapping = createShuffledValueMapping(1, 49, layoutSeed);
    const layout = new GridLayout({
      id: "experiment1-7x7",
      name: "Experiment1 Raster 7x7",
      type: "grid",
      minimumValue: 1,
      maximumValue: 49,
      columns: 7,
      valueMapping: mapping,
    });
    layouts.push(layout);

    const walkForward = new WalkForwardRunner().run({
      experimentId: `experiment1-seed-${seedIndex}`,
      layout,
      shapes,
      draws,
      config: {
        initialHistorySize: historySize,
        ranking: {
          criteria: EXPERIMENT1_RANKING_CRITERIA,
          limit: 5,
        },
      },
    });
    walkResults.push(walkForward);

    const selectionSteps = filterWalkForwardSteps(
      walkForward.steps,
      historySize,
      holdoutStart,
    );
    const holdoutSteps = filterWalkForwardSteps(
      walkForward.steps,
      holdoutStart,
      draws.length,
    );
    const selectionSummary = summarizeWalkForwardSteps(selectionSteps);
    const holdoutSummary = summarizeWalkForwardSteps(holdoutSteps);

    runs.push({
      seedIndex,
      layoutSeed,
      selectionTop1HitRate: selectionSummary.top1HitRate,
      selectionTop1HitAtLeast2Rate: selectionSummary.top1HitAtLeast2Rate,
      holdoutTop1HitRate: holdoutSummary.top1HitRate,
      holdoutTop1HitAtLeast2Rate: holdoutSummary.top1HitAtLeast2Rate,
      holdoutTop5HitAtLeast2Rate: holdoutSummary.top5HitAtLeast2Rate,
    });
  }

  const ranked = [...runs].sort(compareHoldoutSeedRuns);
  const bestSummary = ranked[0]!;
  const bestIndex = bestSummary.seedIndex;
  const bestWalk = walkResults[bestIndex]!;
  const bestLayout = layouts[bestIndex]!;
  const bestLayoutSeed = `${EXPERIMENT1_LAYOUT_SEED}-${bestIndex}`;

  const bestReport = runExperiment1({
    draws,
    datasetLabel: `${options.datasetLabel} · Seed ${bestIndex}`,
    layoutSeed: bestLayoutSeed,
    initialHistorySize: historySize,
    baselineRepetitions,
    shapes,
  });

  const selectionSteps = filterWalkForwardSteps(
    bestWalk.steps,
    historySize,
    holdoutStart,
  );
  const holdoutSteps = filterWalkForwardSteps(
    bestWalk.steps,
    holdoutStart,
    draws.length,
  );

  const tracked = buildTrackedPlacements(bestLayout, shapes);
  const placementCountByShape = new Map<string, number>();

  for (const placement of tracked) {
    placementCountByShape.set(
      placement.shapeId,
      (placementCountByShape.get(placement.shapeId) ?? 0) + 1,
    );
  }

  const drawIndexer = new DrawIndexer(bestLayout);
  const indexedDraws = draws.map((draw) => drawIndexer.index(draw));
  const placements = tracked.map((item) => item.indexed);

  const buildWindow = (
    steps: readonly WalkForwardStep[],
    fromIndex: number,
    toIndex: number,
  ): Experiment1WindowMetrics => {
    const summary = summarizeWalkForwardSteps(steps);
    const dates = windowDates(steps);
    const spatialTop1Min1 = runRandomPlacementBaseline({
      placements,
      draws: indexedDraws,
      testStartIndex: fromIndex,
      testEndIndex: toIndex,
      topK: 1,
      minHits: 1,
      seeds: baselineSeeds,
    });
    const spatialTop1Min2 = runRandomPlacementBaseline({
      placements,
      draws: indexedDraws,
      testStartIndex: fromIndex,
      testEndIndex: toIndex,
      topK: 1,
      minHits: 2,
      seeds: baselineSeeds,
    });
    const nonSpatialTop1Min2 = runNonSpatialGroupBaseline({
      draws,
      testStartIndex: fromIndex,
      testEndIndex: toIndex,
      topK: 1,
      groupSize: 4,
      numberPool,
      minHits: 2,
      seeds: baselineSeeds,
    });

    return {
      drawCount: steps.length,
      dateFrom: dates.dateFrom,
      dateTo: dates.dateTo,
      summary,
      stability: buildStabilitySegments(steps),
      byShape: buildShapeBreakdown(steps, shapes, placementCountByShape),
      baseline: {
        spatialTop1Min1,
        spatialTop1Min2,
        nonSpatialTop1Min2,
        top1Min2PValue: empiricalPValue(
          summary.top1HitAtLeast2Rate,
          spatialTop1Min2,
        ),
        top1Min2DeltaSpatial:
          summary.top1HitAtLeast2Rate - spatialTop1Min2.meanHitRate,
        top1Min2DeltaNonSpatial:
          summary.top1HitAtLeast2Rate - nonSpatialTop1Min2.meanHitRate,
      },
    };
  };

  return {
    seedCount,
    bestSeedIndex: bestIndex,
    selectionCriterion:
      "max selection top1HitAtLeast2Rate, then selection top1HitRate",
    protocol: {
      initialHistorySize: historySize,
      selectionFromIndex: historySize,
      selectionToIndexExclusive: holdoutStart,
      holdoutFromIndex: holdoutStart,
    },
    caution:
      "Seed chosen on selection window (draws 401–700). Holdout (701–end) is the confirmatory score; ≥2 hits is the primary target.",
    runs,
    best: bestReport,
    selection: buildWindow(selectionSteps, historySize, holdoutStart),
    holdout: buildWindow(holdoutSteps, holdoutStart, draws.length),
  };
}

