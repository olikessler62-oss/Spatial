import type { ShapePlacement } from "../domain/shape.js";
import { BitMask } from "./bit-mask.js";
import { LayoutPositionIndex } from "./layout-position-index.js";
export interface IndexedPlacement {
    readonly anchorValue: number;
    readonly mask: BitMask;
    readonly positionCount: number;
}
export declare class PlacementIndexer {
    private readonly layoutIndex;
    constructor(layoutIndex: LayoutPositionIndex);
    index(placement: ShapePlacement): IndexedPlacement;
    indexAll(placements: readonly ShapePlacement[]): readonly IndexedPlacement[];
}
//# sourceMappingURL=placement-indexer.d.ts.map