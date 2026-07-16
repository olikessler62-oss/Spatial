import { BitMask } from "./bit-mask.js";
export class DrawIndexer {
    layout;
    constructor(layout) {
        this.layout = layout;
    }
    index(draw) {
        const indices = draw.mainNumbers.map((value) => this.layout.resolve(value).index);
        return {
            drawDate: draw.drawDate,
            ...(draw.externalId
                ? { externalId: draw.externalId }
                : {}),
            mask: BitMask.fromIndices(indices),
            drawnValueCount: indices.length,
        };
    }
}
//# sourceMappingURL=draw-indexer.js.map