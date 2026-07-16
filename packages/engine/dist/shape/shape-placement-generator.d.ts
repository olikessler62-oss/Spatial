import type { Layout } from "../domain/layout.js";
import type { ShapeDefinition, ShapePlacement, ShapeResolver } from "../domain/shape.js";
export declare class ShapePlacementGenerator {
    private readonly resolver;
    constructor(resolver: ShapeResolver);
    generate(shape: ShapeDefinition, layout: Layout): readonly ShapePlacement[];
}
//# sourceMappingURL=shape-placement-generator.d.ts.map