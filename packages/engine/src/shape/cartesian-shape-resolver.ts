import type {
  CartesianPosition,
  Layout,
} from "../domain/layout.js";
import type {
  ShapeDefinition,
  ShapePlacement,
  ShapeResolver,
} from "../domain/shape.js";
import { ShapeError } from "./shape-error.js";

export class CartesianShapeResolver implements ShapeResolver {
  public resolve(
    shape: ShapeDefinition,
    layout: Layout,
    anchorValue: number,
  ): ShapePlacement {
    if (shape.positions.length === 0) {
      throw new ShapeError(
        "A Shape must contain at least one relative position.",
        "EMPTY_SHAPE",
      );
    }

    const anchor = layout.resolve(anchorValue);

    if (anchor.position.kind !== "cartesian") {
      throw new ShapeError(
        "CartesianShapeResolver requires a cartesian Layout.",
        "INCOMPATIBLE_LAYOUT",
      );
    }

    const layoutPositions = layout.resolveAll();

    const validCoordinates = new Set(
      layoutPositions
        .filter(
          (
            entry,
          ): entry is typeof entry & {
            position: CartesianPosition;
          } => entry.position.kind === "cartesian",
        )
        .map(
          (entry) =>
            `${entry.position.x}:${entry.position.y}`,
        ),
    );

    const positions = shape.positions.map((relative) => {
      const absolute: CartesianPosition = {
        kind: "cartesian",
        x: anchor.position.x + relative.x,
        y: anchor.position.y + relative.y,
      };

      return {
        relative,
        absolute,
      };
    });

    const invalidPositions = positions.filter(
      ({ absolute }) =>
        !validCoordinates.has(
          `${absolute.x}:${absolute.y}`,
        ),
    );

    return {
      anchorValue,
      positions,
      invalidPositions,
      isValid: invalidPositions.length === 0,
    };
  }
}