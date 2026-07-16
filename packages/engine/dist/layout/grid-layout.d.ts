import type { CartesianPosition, LayoutDefinition } from "../domain/layout.js";
import { AbstractLayout } from "./abstract-layout.js";
export interface GridLayoutDefinition extends LayoutDefinition {
    readonly type: "grid";
    readonly columns: number;
    readonly cellWidth?: number;
    readonly cellHeight?: number;
}
export declare class GridLayout extends AbstractLayout {
    readonly gridDefinition: GridLayoutDefinition;
    constructor(gridDefinition: GridLayoutDefinition);
    protected resolveIndex(index: number): CartesianPosition;
}
//# sourceMappingURL=grid-layout.d.ts.map