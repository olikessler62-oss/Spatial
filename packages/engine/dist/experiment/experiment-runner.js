import { HitEvaluator } from "./hit-evaluator.js";
export class ExperimentRunner {
    hitEvaluator;
    constructor(dependencies = {}) {
        this.hitEvaluator =
            dependencies.hitEvaluator ?? new HitEvaluator();
    }
    run(input) {
        const results = [];
        for (const placement of input.placements) {
            for (const draw of input.draws) {
                results.push(this.hitEvaluator.evaluate(placement, draw));
            }
        }
        return {
            experimentId: input.experimentId,
            analyzedDraws: input.draws.length,
            analyzedPlacements: input.placements.length,
            comparisons: input.draws.length * input.placements.length,
            results,
            placementSummaries: this.createPlacementSummaries(input.placements, input.draws.length, results),
        };
    }
    createPlacementSummaries(placements, drawCount, results) {
        return placements.map((placement) => {
            const placementResults = results.filter((result) => result.anchorValue === placement.anchorValue);
            const totalHits = placementResults.reduce((sum, result) => sum + result.hitCount, 0);
            return {
                anchorValue: placement.anchorValue,
                placementSize: placement.positionCount,
                analyzedDraws: drawCount,
                drawsWithHits: placementResults.filter((result) => result.isHit).length,
                totalHits,
                maximumHits: placementResults.reduce((maximum, result) => Math.max(maximum, result.hitCount), 0),
                averageHits: drawCount === 0 ? 0 : totalHits / drawCount,
            };
        });
    }
}
//# sourceMappingURL=experiment-runner.js.map