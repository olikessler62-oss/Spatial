import type { ParsedDraw } from "../domain/parsed-draw.js";
import { GridLayout } from "../layout/grid-layout.js";
import { createShuffledValueMapping } from "../layout/value-mapping.js";
import { DrawIndexer } from "../indexing/draw-indexer.js";
import { HitEvaluator } from "./hit-evaluator.js";
import {
  buildTrackedPlacements,
  type TrackedPlacement,
} from "./walk-forward-runner.js";
import {
  CORNER_5X5_LAYOUT_SEED,
  CORNER_5X5_SHAPES,
} from "./corner-5x5-shapes.js";

const WINDOW_MAX = 4; // top-left 5×5: columns/rows 0..4

export interface CornerMissFrequency {
  readonly missCount: number;
  readonly occurrences: number;
  readonly share: number;
}

export interface CornerMissedPlacement {
  readonly resultId: string;
  readonly shapeId: string;
  readonly shapeName: string;
  readonly anchorValue: number;
  readonly values: readonly number[];
  /** Consecutive non-hits ending at the latest draw (including latest). */
  readonly currentMissStreak: number;
  /** Share of all draws that were non-hits for this placement. */
  readonly historicalMissRate: number;
  readonly historicalMissCount: number;
  readonly historicalDrawCount: number;
  /** Frequency of this streak length among completed miss streaks in the past. */
  readonly currentStreakFrequency: CornerMissFrequency | null;
  readonly missStreakFrequencies: readonly CornerMissFrequency[];
}

export interface Corner5x5MissReport {
  readonly layoutSeed: string;
  readonly valueMapping: readonly number[];
  readonly latestDrawDate: string;
  readonly latestMainNumbers: readonly number[];
  readonly drawCount: number;
  readonly window: "top-left-5x5";
  readonly placementCountInWindow: number;
  readonly missedOnLatest: readonly CornerMissedPlacement[];
  readonly hitOnLatestCount: number;
}

function buildFrequencies(
  missStreaks: readonly number[],
): CornerMissFrequency[] {
  if (missStreaks.length === 0) {
    return [];
  }

  const counts = new Map<number, number>();

  for (const missCount of missStreaks) {
    counts.set(missCount, (counts.get(missCount) ?? 0) + 1);
  }

  const total = missStreaks.length;

  return [...counts.entries()]
    .map(([missCount, occurrences]) => ({
      missCount,
      occurrences,
      share: occurrences / total,
    }))
    .sort((left, right) => {
      if (right.occurrences !== left.occurrences) {
        return right.occurrences - left.occurrences;
      }
      return left.missCount - right.missCount;
    });
}

function isInsideTopLeft5x5(
  layout: GridLayout,
  placement: TrackedPlacement,
): boolean {
  return placement.values.every((value) => {
    const resolved = layout.resolve(value);
    if (resolved.position.kind !== "cartesian") {
      return false;
    }
    const column = resolved.position.column ?? resolved.position.x;
    const row = resolved.position.row ?? resolved.position.y;
    return (
      column >= 0
      && column <= WINDOW_MAX
      && row >= 0
      && row <= WINDOW_MAX
    );
  });
}

/**
 * One fixed arbitrary 7×7 layout. In the top-left 5×5, find which 5-cell
 * pattern placements missed the latest draw, then report historical miss stats.
 */
export function analyzeCorner5x5LatestMisses(options: {
  readonly draws: readonly ParsedDraw[];
  readonly layoutSeed?: string;
}): Corner5x5MissReport {
  const draws = [...options.draws].sort((left, right) =>
    left.drawDate.localeCompare(right.drawDate),
  );

  if (draws.length === 0) {
    throw new Error("At least one draw is required.");
  }

  const layoutSeed = options.layoutSeed ?? CORNER_5X5_LAYOUT_SEED;
  const valueMapping = createShuffledValueMapping(1, 49, layoutSeed);
  const layout = new GridLayout({
    id: "corner-5x5-7x7",
    name: "7×7 fest (Corner-Analyse)",
    type: "grid",
    minimumValue: 1,
    maximumValue: 49,
    columns: 7,
    valueMapping,
  });

  const windowTracked = buildTrackedPlacements(layout, CORNER_5X5_SHAPES).filter(
    (placement) => isInsideTopLeft5x5(layout, placement),
  );

  const drawIndexer = new DrawIndexer(layout);
  const indexedDraws = draws.map((draw) => drawIndexer.index(draw));
  const evaluator = new HitEvaluator();
  const latestIndex = indexedDraws.length - 1;
  const latestDraw = draws[latestIndex]!;

  const missed: CornerMissedPlacement[] = [];
  let hitOnLatestCount = 0;

  for (const placement of windowTracked) {
    const hitFlags = indexedDraws.map(
      (draw) => evaluator.evaluate(placement.indexed, draw).isHit,
    );

    if (hitFlags[latestIndex]) {
      hitOnLatestCount += 1;
      continue;
    }

    let currentMissStreak = 0;
    for (let index = latestIndex; index >= 0; index -= 1) {
      if (hitFlags[index]) {
        break;
      }
      currentMissStreak += 1;
    }

    const historicalMissCount = hitFlags.filter((hit) => !hit).length;
    const hitIndices: number[] = [];

    for (let index = 0; index < hitFlags.length; index += 1) {
      if (hitFlags[index]) {
        hitIndices.push(index);
      }
    }

    const missStreaks: number[] = [];
    for (let index = 1; index < hitIndices.length; index += 1) {
      missStreaks.push(hitIndices[index]! - hitIndices[index - 1]! - 1);
    }

    const frequencies = buildFrequencies(missStreaks);
    const currentStreakFrequency =
      frequencies.find((entry) => entry.missCount === currentMissStreak)
      ?? null;

    missed.push({
      resultId: placement.resultId,
      shapeId: placement.shapeId,
      shapeName: placement.shapeName,
      anchorValue: placement.anchorValue,
      values: placement.values,
      currentMissStreak,
      historicalMissRate: historicalMissCount / hitFlags.length,
      historicalMissCount,
      historicalDrawCount: hitFlags.length,
      currentStreakFrequency,
      missStreakFrequencies: frequencies.slice(0, 10),
    });
  }

  missed.sort((left, right) => {
    if (right.currentMissStreak !== left.currentMissStreak) {
      return right.currentMissStreak - left.currentMissStreak;
    }
    return left.shapeName.localeCompare(right.shapeName);
  });

  return {
    layoutSeed,
    valueMapping,
    latestDrawDate: latestDraw.drawDate,
    latestMainNumbers: [...latestDraw.mainNumbers],
    drawCount: draws.length,
    window: "top-left-5x5",
    placementCountInWindow: windowTracked.length,
    missedOnLatest: missed,
    hitOnLatestCount,
  };
}
