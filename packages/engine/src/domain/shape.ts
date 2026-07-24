import type { CartesianPosition, Layout } from "./layout.js";

export interface RelativePosition {
  readonly x: number;
  readonly y: number;
}

export interface ShapeDefinition {
  readonly id: string;
  readonly name: string;
  readonly positions: readonly RelativePosition[];
}

export interface ResolvedShapePosition {
  readonly relative: RelativePosition;
  readonly absolute: CartesianPosition;
}

export interface ShapeResolver {
  resolve(
    shape: ShapeDefinition,
    layout: Layout,
    anchorValue: number,
  ): ShapePlacement;
}

export interface ShapePlacement {
  readonly anchorValue: number;
  readonly positions: readonly ResolvedShapePosition[];
  readonly isValid: boolean;
  readonly invalidPositions: readonly ResolvedShapePosition[];
}