import type { Layout } from "../domain/layout.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ShapeDefinition } from "../domain/shape.js";
import {
  computePlacementHistoryFeatures,
  EXPERIMENT1_RANKING_CRITERIA,
  featuresToMetricValues,
  type PlacementHistoryFeatures,
} from "../analysis/features/placement-history-features.js";
import { HitEvaluator } from "./hit-evaluator.js";
import { DrawIndexer, type IndexedDraw } from "../indexing/draw-indexer.js";
import { LayoutPositionIndex } from "../indexing/layout-position-index.js";
import {
  PlacementIndexer,
  type IndexedPlacement,
} from "../indexing/placement-indexer.js";
import { CartesianShapeResolver } from "../shape/cartesian-shape-resolver.js";
import { ShapePlacementGenerator } from "../shape/shape-placement-generator.js";
import { RankingEngine } from "../ranking/ranking-engine.js";
import type {
  RankableResult,
  RankingConfiguration,
} from "../ranking/ranking-types.js";

export interface TrackedPlacement {
  readonly resultId: string;
  readonly shapeId: string;
  readonly shapeName: string;
  readonly anchorValue: number;
  readonly values: readonly number[];
  readonly indexed: IndexedPlacement;
}

export interface WalkForwardSelection {
  readonly resultId: string;
  readonly shapeId: string;
  readonly shapeName: string;
  readonly anchorValue: number;
  readonly values: readonly number[];
  readonly features: PlacementHistoryFeatures;
  readonly score: number;
  readonly hitCount: number;
  readonly hitAtLeast1: boolean;
  readonly hitAtLeast2: boolean;
}

export interface WalkForwardStep {
  readonly drawIndex: number;
  readonly drawDate: string;
  readonly historySize: number;
  readonly actualMainNumbers: readonly number[];
  readonly top1: WalkForwardSelection;
  readonly top5: readonly WalkForwardSelection[];
}

export interface WalkForwardConfig {
  readonly initialHistorySize: number;
  readonly ranking?: RankingConfiguration;
}

export interface WalkForwardResult {
  readonly experimentId: string;
  readonly evaluatedDraws: number;
  readonly placementCount: number;
  readonly steps: readonly WalkForwardStep[];
  readonly summary: {
    readonly top1HitRate: number;
    readonly top1HitAtLeast2Rate: number;
    readonly top5AnyHitRate: number;
    readonly top5HitAtLeast2Rate: number;
    readonly averageTop1Hits: number;
    readonly averageTop5Hits: number;
    readonly maxTop1Hits: number;
  };
}

function placementValues(
  placement: {
    readonly positions: readonly {
      readonly absolute: { readonly x: number; readonly y: number };
    }[];
  },
  layoutIndex: LayoutPositionIndex,
): number[] {
  return placement.positions.map((position) => {
    const value = layoutIndex.getValue({
      kind: "cartesian",
      x: position.absolute.x,
      y: position.absolute.y,
    });

    if (value === undefined) {
      throw new Error(
        `Missing layout value at ${position.absolute.x}:${position.absolute.y}.`,
      );
    }

    return value;
  });
}

export function buildTrackedPlacements(
  layout: Layout,
  shapes: readonly ShapeDefinition[],
): TrackedPlacement[] {
  const layoutIndex = new LayoutPositionIndex(layout);
  const resolver = new CartesianShapeResolver();
  const generator = new ShapePlacementGenerator(resolver);
  const indexer = new PlacementIndexer(layoutIndex);
  const tracked: TrackedPlacement[] = [];

  for (const shape of shapes) {
    const placements = generator
      .generate(shape, layout)
      .filter((placement) => placement.isValid);

    for (const placement of placements) {
      tracked.push({
        resultId: `${shape.id}:anchor-${placement.anchorValue}`,
        shapeId: shape.id,
        shapeName: shape.name,
        anchorValue: placement.anchorValue,
        values: placementValues(placement, layoutIndex),
        indexed: indexer.index(placement),
      });
    }
  }

  return tracked;
}

export class WalkForwardRunner {
  private readonly hitEvaluator = new HitEvaluator();
  private readonly rankingEngine = new RankingEngine();

  public run(input: {
    readonly experimentId: string;
    readonly layout: Layout;
    readonly shapes: readonly ShapeDefinition[];
    readonly draws: readonly ParsedDraw[];
    readonly config: WalkForwardConfig;
  }): WalkForwardResult {
    const { draws, config } = input;

    if (draws.length === 0) {
      throw new Error("At least one draw is required.");
    }

    if (
      !Number.isInteger(config.initialHistorySize)
      || config.initialHistorySize < 1
    ) {
      throw new Error("initialHistorySize must be a positive integer.");
    }

    if (config.initialHistorySize >= draws.length) {
      throw new Error(
        "initialHistorySize must leave at least one test draw.",
      );
    }

    const tracked = buildTrackedPlacements(input.layout, input.shapes);

    if (tracked.length === 0) {
      throw new Error("No valid placements for the given shapes and layout.");
    }

    const drawIndexer = new DrawIndexer(input.layout);
    const indexedDraws = draws.map((draw) => drawIndexer.index(draw));

    // hitSequences[placementIndex][drawIndex] — filled only for history draws
    const hitSequences: boolean[][] = tracked.map(() => []);

    for (let drawIndex = 0; drawIndex < config.initialHistorySize; drawIndex += 1) {
      this.appendHits(tracked, indexedDraws[drawIndex]!, hitSequences);
    }

    const ranking: RankingConfiguration = input.config.ranking ?? {
      criteria: EXPERIMENT1_RANKING_CRITERIA,
      limit: 5,
    };

    const steps: WalkForwardStep[] = [];

    for (
      let drawIndex = config.initialHistorySize;
      drawIndex < draws.length;
      drawIndex += 1
    ) {
      const historySize = drawIndex;
      const testDraw = draws[drawIndex]!;
      const testIndexed = indexedDraws[drawIndex]!;

      const featureByResultId = new Map<string, PlacementHistoryFeatures>();
      const rankable: RankableResult[] = [];

      for (let placementIndex = 0; placementIndex < tracked.length; placementIndex += 1) {
        const placement = tracked[placementIndex]!;
        const historyHits = hitSequences[placementIndex]!;

        if (historyHits.length !== historySize) {
          throw new Error("Internal error: hit history length mismatch.");
        }

        const features = computePlacementHistoryFeatures(historyHits);
        featureByResultId.set(placement.resultId, features);
        rankable.push({
          resultId: placement.resultId,
          metricValues: featuresToMetricValues(features),
        });
      }

      const ranked = this.rankingEngine.rank(rankable, {
        ...ranking,
        limit: Math.max(ranking.limit ?? 5, 5),
      });

      const topEntries = ranked.entries.slice(0, 5);
      const selections = topEntries.map((entry) => {
        const placement = tracked.find((item) => item.resultId === entry.resultId);

        if (!placement) {
          throw new Error(`Unknown ranked placement ${entry.resultId}.`);
        }

        const features = featureByResultId.get(entry.resultId)!;
        const evaluation = this.hitEvaluator.evaluate(
          placement.indexed,
          testIndexed,
        );

        return {
          resultId: placement.resultId,
          shapeId: placement.shapeId,
          shapeName: placement.shapeName,
          anchorValue: placement.anchorValue,
          values: placement.values,
          features,
          score: entry.score,
          hitCount: evaluation.hitCount,
          hitAtLeast1: evaluation.hitCount >= 1,
          hitAtLeast2: evaluation.hitCount >= 2,
        } satisfies WalkForwardSelection;
      });

      steps.push({
        drawIndex,
        drawDate: testDraw.drawDate,
        historySize,
        actualMainNumbers: [...testDraw.mainNumbers],
        top1: selections[0]!,
        top5: selections,
      });

      // Only after ranking/evaluation: extend history with the test draw
      this.appendHits(tracked, testIndexed, hitSequences);
    }

    return {
      experimentId: input.experimentId,
      evaluatedDraws: steps.length,
      placementCount: tracked.length,
      steps,
      summary: summarizeWalkForwardSteps(steps),
    };
  }

  private appendHits(
    tracked: readonly TrackedPlacement[],
    draw: IndexedDraw,
    hitSequences: boolean[][],
  ): void {
    for (let index = 0; index < tracked.length; index += 1) {
      const evaluation = this.hitEvaluator.evaluate(tracked[index]!.indexed, draw);
      hitSequences[index]!.push(evaluation.isHit);
    }
  }
}

export function filterWalkForwardSteps(
  steps: readonly WalkForwardStep[],
  fromIndexInclusive: number,
  toIndexExclusive: number,
): WalkForwardStep[] {
  return steps.filter(
    (step) =>
      step.drawIndex >= fromIndexInclusive
      && step.drawIndex < toIndexExclusive,
  );
}

export function summarizeWalkForwardSteps(steps: readonly WalkForwardStep[]) {
  if (steps.length === 0) {
    return {
      top1HitRate: 0,
      top1HitAtLeast2Rate: 0,
      top5AnyHitRate: 0,
      top5HitAtLeast2Rate: 0,
      averageTop1Hits: 0,
      averageTop5Hits: 0,
      maxTop1Hits: 0,
    };
  }

  let top1Hits = 0;
  let top1AtLeast1 = 0;
  let top1AtLeast2 = 0;
  let top5Any = 0;
  let top5AtLeast2 = 0;
  let top5HitsSum = 0;
  let maxTop1Hits = 0;

  for (const step of steps) {
    top1Hits += step.top1.hitCount;
    maxTop1Hits = Math.max(maxTop1Hits, step.top1.hitCount);

    if (step.top1.hitAtLeast1) {
      top1AtLeast1 += 1;
    }

    if (step.top1.hitAtLeast2) {
      top1AtLeast2 += 1;
    }

    if (step.top5.some((selection) => selection.hitAtLeast1)) {
      top5Any += 1;
    }

    if (step.top5.some((selection) => selection.hitAtLeast2)) {
      top5AtLeast2 += 1;
    }

    top5HitsSum +=
      step.top5.reduce((sum, selection) => sum + selection.hitCount, 0)
      / step.top5.length;
  }

  const n = steps.length;

  return {
    top1HitRate: top1AtLeast1 / n,
    top1HitAtLeast2Rate: top1AtLeast2 / n,
    top5AnyHitRate: top5Any / n,
    top5HitAtLeast2Rate: top5AtLeast2 / n,
    averageTop1Hits: top1Hits / n,
    averageTop5Hits: top5HitsSum / n,
    maxTop1Hits,
  };
}
