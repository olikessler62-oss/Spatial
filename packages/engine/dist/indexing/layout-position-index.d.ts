import type { Layout, LayoutPosition } from "../domain/layout.js";
export declare class LayoutPositionIndex {
    readonly layout: Layout;
    private readonly indexByCoordinate;
    private readonly entryByCoordinate;
    constructor(layout: Layout);
    getIndex(position: LayoutPosition): number | undefined;
    getValue(position: LayoutPosition): number | undefined;
    get size(): number;
}
//# sourceMappingURL=layout-position-index.d.ts.map