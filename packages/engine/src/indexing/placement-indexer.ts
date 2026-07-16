import type { ShapePlacement } from "../domain/shape.js";
import { BitMask } from "./bit-mask.js";
import { LayoutPositionIndex } from "./layout-position-index.js";

export interface IndexedPlacement {
  readonly anchorValue: number;
  readonly mask: BitMask;
  readonly positionCount: number;
}

export class PlacementIndexer {
  public constructor(
    private readonly layoutIndex: LayoutPositionIndex,
  ) {}

  public index(
    placement: ShapePlacement,
  ): IndexedPlacement {
    if (!placement.isValid) {
      throw new Error(
        `Cannot index invalid placement at anchor ${placement.anchorValue}.`,
      );
    }

    const indices = placement.positions.map(
      ({ absolute }) => {
        const index =
          this.layoutIndex.getIndex(absolute);

        if (index === undefined) {
          throw new Error(
            `Placement position ${absolute.x}:${absolute.y} does not exist in the Layout.`,
          );
        }

        return index;
      },
    );

    const uniqueIndices = new Set(indices);

    if (uniqueIndices.size !== indices.length) {
      throw new Error(
        "Placement contains duplicate absolute positions.",
      );
    }

    return {
      anchorValue: placement.anchorValue,
      mask: BitMask.fromIndices(indices),
      positionCount: indices.length,
    };
  }

  public indexAll(
    placements: readonly ShapePlacement[],
  ): readonly IndexedPlacement[] {
    return placements.map((placement) =>
      this.index(placement),
    );
  }
}