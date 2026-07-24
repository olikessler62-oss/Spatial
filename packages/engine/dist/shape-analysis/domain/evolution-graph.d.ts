import type { TrackedShape } from "./tracked-shape.js";
export interface ShapeEvolutionEdge {
    readonly parentShapeId: string;
    readonly childShapeId: string;
    readonly splitCardId: string;
    readonly splitSequenceIndex: number;
    readonly type: "split";
}
export interface ShapeEvolutionGraph {
    readonly nodes: ReadonlyMap<string, TrackedShape>;
    readonly edges: readonly ShapeEvolutionEdge[];
}
export declare function createEmptyEvolutionGraph(): ShapeEvolutionGraph;
export declare function deduplicateByShapeKey<T extends {
    readonly key: string;
}>(items: readonly T[]): readonly T[];
export declare function createOccurrenceKey(shapeId: string, cardId: string): string;
/**
 * Registers a split edge. Multiple parents may point to the same child.
 */
export declare function appendSplitEdge(edges: readonly ShapeEvolutionEdge[], edge: ShapeEvolutionEdge): readonly ShapeEvolutionEdge[];
//# sourceMappingURL=evolution-graph.d.ts.map