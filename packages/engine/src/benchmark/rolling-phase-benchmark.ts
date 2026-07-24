/**
 * Benchmark: 1_000 draws × 49 numbers × windows 25/50/100, step 1.
 * Run from packages/engine: npx tsx src/benchmark/rolling-phase-benchmark.ts
 */
import { analyzeAllNumbersRollingPhase } from "../analysis/rolling-phase/number-rolling-phase-analyzer.js";
import { DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION } from "../analysis/rolling-phase/types.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";

const DRAW_COUNT = 1_000;
const NUMBERS = 49;
const PER_DRAW = 6;

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateDraws(): ParsedDraw[] {
  const random = createRandom(42);
  const draws: ParsedDraw[] = [];

  for (let index = 0; index < DRAW_COUNT; index += 1) {
    const picked = new Set<number>();
    while (picked.size < PER_DRAW) {
      picked.add(1 + Math.floor(random() * NUMBERS));
    }

    const date = new Date(Date.UTC(2000, 0, 1 + index));
    draws.push({
      drawDate: date.toISOString().slice(0, 10),
      mainNumbers: [...picked].sort((a, b) => a - b),
      bonusNumbers: [],
      sourceRow: index + 1,
    });
  }

  return draws;
}

const draws = generateDraws();
const started = performance.now();
const results = analyzeAllNumbersRollingPhase(draws, {
  minimumNumber: 1,
  maximumNumber: NUMBERS,
  configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
});
const elapsedMs = performance.now() - started;

console.log(
  JSON.stringify(
    {
      draws: DRAW_COUNT,
      numbers: NUMBERS,
      windowSizes: [...DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION.windowSizes],
      stepSize: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION.stepSize,
      resultCount: results.length,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      windowsPerNumber25: results[0]?.windowsBySize[25]?.length ?? 0,
      note: "Descriptive historical analysis only — not a prediction benchmark.",
    },
    null,
    2,
  ),
);
