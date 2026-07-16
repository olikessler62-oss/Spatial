import { GridLayout } from "../layout/grid-layout.js";
import { CartesianShapeResolver } from "../shape/cartesian-shape-resolver.js";
import { ShapePlacementGenerator } from "../shape/shape-placement-generator.js";
import { LayoutPositionIndex } from "../indexing/layout-position-index.js";
import { PlacementIndexer } from "../indexing/placement-indexer.js";
import { SyntheticDrawGenerator } from "./synthetic-draw-generator.js";
import { ExperimentBenchmark } from "./experiment-benchmark.js";
const layout = new GridLayout({
    id: "benchmark-grid-7x7",
    name: "Benchmark Grid",
    type: "grid",
    minimumValue: 1,
    maximumValue: 49,
    columns: 7,
});
const shape = {
    id: "benchmark-square-2x2",
    name: "2x2 Square",
    positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
    ],
};
const placements = new PlacementIndexer(new LayoutPositionIndex(layout)).indexAll(new ShapePlacementGenerator(new CartesianShapeResolver()).generate(shape, layout));
const generator = new SyntheticDrawGenerator();
const benchmark = new ExperimentBenchmark();
for (const drawCount of [1_000, 10_000, 100_000]) {
    const draws = generator.generate({
        drawCount,
        layoutSize: 49,
        numbersPerDraw: 6,
        seed: 42,
    });
    const result = benchmark.run({
        name: `${drawCount}-draws`,
        placements,
        draws,
    });
    console.table({
        Draws: result.drawCount,
        Placements: result.placementCount,
        Comparisons: result.comparisons,
        "Average ms": result.averageDurationMs.toFixed(2),
        "Min ms": result.minimumDurationMs.toFixed(2),
        "Max ms": result.maximumDurationMs.toFixed(2),
        "Comparisons/sec": Math.round(result.comparisonsPerSecond),
    });
}
//# sourceMappingURL=run-benchmarks.js.map