import type { CartesianPosition, LayoutDefinition } from "../domain/layout.js";
import { AbstractLayout } from "./abstract-layout.js";
import { LayoutError } from "./layout-error.js";

export interface GridLayoutDefinition extends LayoutDefinition {
  readonly type: "grid";
  readonly columns: number;
  readonly cellWidth?: number;
  readonly cellHeight?: number;
}

export class GridLayout extends AbstractLayout {
  public constructor(public readonly gridDefinition: GridLayoutDefinition) {
    super(gridDefinition);
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

  protected resolveIndex(index: number): CartesianPosition {
    const column = index % this.gridDefinition.columns;
    const row = Math.floor(index / this.gridDefinition.columns);
    const cellWidth = this.gridDefinition.cellWidth ?? 1;
    const cellHeight = this.gridDefinition.cellHeight ?? 1;
    return { kind: "cartesian", x: column * cellWidth, y: row * cellHeight, row, column };
  }
}
