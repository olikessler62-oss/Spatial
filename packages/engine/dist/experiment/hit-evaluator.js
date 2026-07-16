export class HitEvaluator {
    evaluate(placement, draw) {
        const hitCount = placement.mask
            .intersection(draw.mask)
            .count();
        return {
            anchorValue: placement.anchorValue,
            drawDate: draw.drawDate,
            hitCount,
            placementSize: placement.positionCount,
            coverage: placement.positionCount === 0
                ? 0
                : hitCount / placement.positionCount,
            isHit: hitCount > 0,
            ...(draw.externalId
                ? { externalId: draw.externalId }
                : {}),
        };
    }
}
//# sourceMappingURL=hit-evaluator.js.map