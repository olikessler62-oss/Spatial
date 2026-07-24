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

export function createEmptyEvolutionGraph(): ShapeEvolutionGraph {
  return {
    nodes: new Map(),
    edges: [],
  };
}

export function deduplicateByShapeKey<T extends { readonly key: string }>(
  items: readonly T[],
): readonly T[] {
  const seen = new Map<string, T>();

  for (const item of items) {
    if (!seen.has(item.key)) {
      seen.set(item.key, item);
    }
  }

  return [...seen.values()];
}

export function createOccurrenceKey(
  shapeId: string,
  cardId: string,
): string {
  return `${shapeId}:${cardId}`;
}

/**
 * Registers a split edge. Multiple parents may point to the same child.
 */
export function appendSplitEdge(
  edges: readonly ShapeEvolutionEdge[],
  edge: ShapeEvolutionEdge,
): readonly ShapeEvolutionEdge[] {
  const exists = edges.some(
    (existing) =>
      existing.parentShapeId === edge.parentShapeId &&
      existing.childShapeId === edge.childShapeId &&
      existing.splitCardId === edge.splitCardId,
  );

  if (exists) {
    return edges;
  }

  return [...edges, edge];
}
