import type { Layout } from "../domain/layout.js";
import type { ShapeDefinition, ShapePlacement, ShapeResolver } from "../domain/shape.js";
export declare class CartesianShapeResolver implements ShapeResolver {
    resolve(shape: ShapeDefinition, layout: Layout, anchorValue: number): ShapePlacement;
}
//# sourceMappingURL=cartesian-shape-resolver.d.ts.map