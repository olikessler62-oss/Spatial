export type LayoutType = "grid" | "circle";

export interface CartesianPosition {
  readonly kind: "cartesian";
  readonly x: number;
  readonly y: number;
  readonly row?: number;
  readonly column?: number;
}

export interface PolarPosition {
  readonly kind: "polar";
  readonly angleRadians: number;
  readonly radius: number;
  readonly x: number;
  readonly y: number;
}

export type LayoutPosition = CartesianPosition | PolarPosition;

export interface ResolvedLayoutValue {
  readonly value: number;
  readonly index: number;
  readonly position: LayoutPosition;
}

export interface LayoutDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: LayoutType;
  readonly minimumValue: number;
  readonly maximumValue: number;
}

export interface Layout {
  readonly definition: LayoutDefinition;
  resolve(value: number): ResolvedLayoutValue;
  resolveAll(): readonly ResolvedLayoutValue[];
}
