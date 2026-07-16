import { BitMask } from "./bit-mask.js";
export class PlacementIndexer {
    layoutIndex;
    constructor(layoutIndex) {
        this.layoutIndex = layoutIndex;
    }
    index(placement) {
        if (!placement.isValid) {
            throw new Error(`Cannot index invalid placement at anchor ${placement.anchorValue}.`);
        }
        const indices = placement.positions.map(({ absolute }) => {
            const index = this.layoutIndex.getIndex(absolute);
            if (index === undefined) {
                throw new Error(`Placement position ${absolute.x}:${absolute.y} does not exist in the Layout.`);
            }
            return index;
        });
        const uniqueIndices = new Set(indices);
        if (uniqueIndices.size !== indices.length) {
            throw new Error("Placement contains duplicate absolute positions.");
        }
        return {
            anchorValue: placement.anchorValue,
            mask: BitMask.fromIndices(indices),
            positionCount: indices.length,
        };
    }
    indexAll(placements) {
        return placements.map((placement) => this.index(placement));
    }
}
//# sourceMappingURL=placement-indexer.js.map