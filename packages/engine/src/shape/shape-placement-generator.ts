import type { Layout } from "../domain/layout.js";
import type {
  ShapeDefinition,
  ShapePlacement,
  ShapeResolver,
} from "../domain/shape.js";

export class ShapePlacementGenerator {
  public constructor(
    private readonly resolver: ShapeResolver,
  ) {}

  public generate(
    shape: ShapeDefinition,
    layout: Layout,
  ): readonly ShapePlacement[] {
    return layout
      .resolveAll()
      .map((entry) =>
        this.resolver.resolve(
          shape,
          layout,
          entry.value,
        ),
      )
      .filter((placement) => placement.isValid);
  }
}