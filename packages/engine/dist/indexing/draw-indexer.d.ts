import type { Layout } from "../domain/layout.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import { BitMask } from "./bit-mask.js";
export interface IndexedDraw {
    readonly drawDate: string;
    readonly externalId?: string;
    readonly mask: BitMask;
    readonly drawnValueCount: number;
}
export declare class DrawIndexer {
    private readonly layout;
    constructor(layout: Layout);
    index(draw: ParsedDraw): IndexedDraw;
}
//# sourceMappingURL=draw-indexer.d.ts.map