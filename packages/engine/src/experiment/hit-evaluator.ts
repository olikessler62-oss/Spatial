import type { PlacementDrawResult } from "../domain/experiment.js";
import type { IndexedDraw } from "../indexing/draw-indexer.js";
import type { IndexedPlacement } from "../indexing/placement-indexer.js";

export class HitEvaluator {
  public evaluate(
    placement: IndexedPlacement,
    draw: IndexedDraw,
  ): PlacementDrawResult {
    const hitCount = placement.mask
      .intersection(draw.mask)
      .count();

    return {
      anchorValue: placement.anchorValue,
      drawDate: draw.drawDate,
      hitCount,
      placementSize: placement.positionCount,
      coverage:
        placement.positionCount === 0
          ? 0
          : hitCount / placement.positionCount,
      isHit: hitCount > 0,
      ...(draw.externalId
        ? { externalId: draw.externalId }
        : {}),
    };
  }
}