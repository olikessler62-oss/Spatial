import { DrawIndexer } from "../../indexing/draw-indexer.js";
import { HitEvaluator } from "../../experiment/hit-evaluator.js";
import { buildTrackedPlacements } from "../../experiment/walk-forward-runner.js";
function buildFrequencies(missStreaks) {
    if (missStreaks.length === 0) {
        return [];
    }
    const counts = new Map();
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
/**
 * Counts consecutive non-hits between hits (≥1 number).
 * Primary output: which miss-streak length occurs most often.
 */
export function analyzeShapeGaps(options) {
    const draws = [...options.draws].sort((left, right) => left.drawDate.localeCompare(right.drawDate));
    const drawIndexer = new DrawIndexer(options.layout);
    const indexedDraws = draws.map((draw) => drawIndexer.index(draw));
    const evaluator = new HitEvaluator();
    const tracked = buildTrackedPlacements(options.layout, options.shapes);
    const byShape = new Map();
    for (const shape of options.shapes) {
        byShape.set(shape.id, []);
    }
    for (const placement of tracked) {
        const hitFlags = indexedDraws.map((draw) => evaluator.evaluate(placement.indexed, draw).isHit);
        const hitIndices = [];
        for (let index = 0; index < hitFlags.length; index += 1) {
            if (hitFlags[index]) {
                hitIndices.push(index);
            }
        }
        const missStreaks = [];
        for (let index = 1; index < hitIndices.length; index += 1) {
            // non-hits strictly between two hits
            missStreaks.push(hitIndices[index] - hitIndices[index - 1] - 1);
        }
        const frequencies = buildFrequencies(missStreaks);
        const top = frequencies[0];
        const averageMissStreak = missStreaks.length === 0
            ? 0
            : missStreaks.reduce((sum, value) => sum + value, 0)
                / missStreaks.length;
        const maximumMissStreak = missStreaks.length === 0 ? 0 : Math.max(...missStreaks);
        const stats = {
            resultId: placement.resultId,
            shapeId: placement.shapeId,
            shapeName: placement.shapeName,
            anchorValue: placement.anchorValue,
            values: placement.values,
            hitCount: hitIndices.length,
            missStreaks,
            averageMissStreak,
            maximumMissStreak,
            mostCommonMissCount: top?.missCount ?? null,
            mostCommonMissShare: top?.share ?? 0,
        };
        const bucket = byShape.get(placement.shapeId);
        if (bucket) {
            bucket.push(stats);
        }
    }
    const shapes = options.shapes.map((shape) => {
        const placements = byShape.get(shape.id) ?? [];
        const withGaps = placements.filter((placement) => placement.missStreaks.length > 0);
        const allMissStreaks = withGaps.flatMap((placement) => placement.missStreaks);
        const frequencies = buildFrequencies(allMissStreaks);
        const top = frequencies[0];
        const averageMissStreak = allMissStreaks.length === 0
            ? 0
            : allMissStreaks.reduce((sum, value) => sum + value, 0)
                / allMissStreaks.length;
        const maximumMissStreak = allMissStreaks.length === 0 ? 0 : Math.max(...allMissStreaks);
        return {
            shapeId: shape.id,
            shapeName: shape.name,
            placementCount: placements.length,
            placementsWithGaps: withGaps.length,
            totalMissStreaks: allMissStreaks.length,
            averageMissStreak,
            maximumMissStreak,
            mostCommonMissCount: top?.missCount ?? null,
            mostCommonOccurrences: top?.occurrences ?? 0,
            mostCommonShare: top?.share ?? 0,
            missFrequencies: frequencies.slice(0, 12),
            placements: withGaps
                .slice()
                .sort((left, right) => right.maximumMissStreak - left.maximumMissStreak),
        };
    });
    return {
        drawCount: draws.length,
        dateFrom: draws[0]?.drawDate ?? null,
        dateTo: draws[draws.length - 1]?.drawDate ?? null,
        layoutSeed: options.layoutSeed,
        shapes,
    };
}
//# sourceMappingURL=shape-gap-analysis.js.map