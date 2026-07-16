import { AbstractLayout } from "./abstract-layout.js";
import { LayoutError } from "./layout-error.js";
export class GridLayout extends AbstractLayout {
    gridDefinition;
    constructor(gridDefinition) {
        super(gridDefinition);
        this.gridDefinition = gridDefinition;
        if (!Number.isInteger(gridDefinition.columns) || gridDefinition.columns <= 0) {
            throw new LayoutError("Grid columns must be a positive integer.", "INVALID_GRID_COLUMNS");
        }
        if (gridDefinition.cellWidth !== undefined && gridDefinition.cellWidth <= 0) {
            throw new LayoutError("cellWidth must be greater than zero.", "INVALID_CELL_WIDTH");
        }
        if (gridDefinition.cellHeight !== undefined && gridDefinition.cellHeight <= 0) {
            throw new LayoutError("cellHeight must be greater than zero.", "INVALID_CELL_HEIGHT");
        }
    }
    resolveIndex(index) {
        const column = index % this.gridDefinition.columns;
        const row = Math.floor(index / this.gridDefinition.columns);
        const cellWidth = this.gridDefinition.cellWidth ?? 1;
        const cellHeight = this.gridDefinition.cellHeight ?? 1;
        return { kind: "cartesian", x: column * cellWidth, y: row * cellHeight, row, column };
    }
}
//# sourceMappingURL=grid-layout.js.map