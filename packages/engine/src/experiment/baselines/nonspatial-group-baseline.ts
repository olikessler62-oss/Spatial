import { hashSeed } from "../../layout/value-mapping.js";
import type { ParsedDraw } from "../../domain/parsed-draw.js";
import type { BaselineDistributionSummary } from "./random-placement-baseline.js";

function createRandom(seed: string | number): () => number {
  let state = hashSeed(seed);

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );

  return sorted[index]!;
}

function summarizeRates(hitRates: number[]): BaselineDistributionSummary {
  const sorted = [...hitRates].sort((left, right) => left - right);
  const mean =
    hitRates.reduce((sum, rate) => sum + rate, 0) / Math.max(hitRates.length, 1);
  const variance =
    hitRates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0)
    / Math.max(hitRates.length, 1);

  return {
    repetitions: hitRates.length,
    meanHitRate: mean,
    stdDevHitRate: Math.sqrt(variance),
    minHitRate: sorted[0] ?? 0,
    maxHitRate: sorted[sorted.length - 1] ?? 0,
    percentile5: percentile(sorted, 5),
    percentile50: percentile(sorted, 50),
    percentile95: percentile(sorted, 95),
    hitRates: sorted,
  };
}

function pickUniqueNumbers(
  pool: readonly number[],
  count: number,
  random: () => number,
): number[] {
  const indices = pool.map((_, index) => index);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = indices[index]!;
    indices[index] = indices[swapIndex]!;
    indices[swapIndex] = current;
  }

  return indices.slice(0, count).map((index) => pool[index]!);
}

/**
 * Non-spatial control: random number groups of the same sizes as pattern
 * selections, without using layout geometry.
 */
export function runNonSpatialGroupBaseline(options: {
  readonly draws: readonly ParsedDraw[];
  readonly testStartIndex: number;
  readonly testEndIndex?: number;
  /** Number of groups selected per test draw (e.g. 1 or 5). */
  readonly topK: number;
  /** Size of each number group (e.g. 4 for line/L shapes). */
  readonly groupSize: number;
  readonly numberPool: readonly number[];
  /** Minimum overlapping numbers to count as success. */
  readonly minHits?: number;
  readonly seeds: readonly (string | number)[];
}): BaselineDistributionSummary {
  const {
    draws,
    testStartIndex,
    topK,
    groupSize,
    numberPool,
    seeds,
  } = options;
  const testEndIndex = options.testEndIndex ?? draws.length;
  const minHits = options.minHits ?? 1;

  if (groupSize < 1 || groupSize > numberPool.length) {
    throw new Error("groupSize must be between 1 and the number pool size.");
  }

  if (topK < 1) {
    throw new Error("topK must be at least 1.");
  }

  if (minHits < 1) {
    throw new Error("minHits must be at least 1.");
  }

  const hitRates: number[] = [];

  for (const seed of seeds) {
    const random = createRandom(seed);
    let hits = 0;
    let tests = 0;

    for (
      let drawIndex = testStartIndex;
      drawIndex < testEndIndex && drawIndex < draws.length;
      drawIndex += 1
    ) {
      const drawn = new Set(draws[drawIndex]!.mainNumbers);
      let anyHit = false;

      for (let group = 0; group < topK; group += 1) {
        const values = pickUniqueNumbers(numberPool, groupSize, random);
        const overlap = values.reduce(
          (count, value) => count + (drawn.has(value) ? 1 : 0),
          0,
        );

        if (overlap >= minHits) {
          anyHit = true;
          break;
        }
      }

      if (anyHit) {
        hits += 1;
      }

      tests += 1;
    }

    hitRates.push(tests === 0 ? 0 : hits / tests);
  }

  return summarizeRates(hitRates);
}
