import type { ParsedDraw } from "../domain/parsed-draw.js";
import { GridLayout } from "../layout/grid-layout.js";
import { createShuffledValueMapping } from "../layout/value-mapping.js";
import {
  EXPERIMENT1_LAYOUT_SEED,
  EXPERIMENT1_SHAPES,
} from "../experiment/experiment1-shapes.js";
import {
  analyzeShapeGaps,
  type ShapeGapAnalysisReport,
} from "../analysis/features/shape-gap-analysis.js";

const GAP_SHAPE_IDS = new Set(["l-3", "l-4", "l-5", "cross-5"]);

export function runExperiment1ShapeGapAnalysis(options: {
  readonly draws: readonly ParsedDraw[];
  readonly layoutSeed?: string;
  readonly seedIndex?: number;
}): ShapeGapAnalysisReport {
  const seedIndex = options.seedIndex ?? 0;
  const layoutSeed =
    options.layoutSeed ?? `${EXPERIMENT1_LAYOUT_SEED}-${seedIndex}`;
  const shapes = EXPERIMENT1_SHAPES.filter((shape) =>
    GAP_SHAPE_IDS.has(shape.id),
  );

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

  return analyzeShapeGaps({
    layout,
    shapes,
    draws: options.draws,
    layoutSeed,
  });
}
