import type { ShapeVisualColor } from "./visualization-types.js";
/**
 * High-contrast hues spaced around the wheel so neighboring shapes stay distinct.
 */
export declare const SHAPE_COLOR_PALETTE: readonly ShapeVisualColor[];
/**
 * Deterministic palette color from a seed (prefer geometryKey over sequential ids).
 */
export declare function getShapeVisualColor(seed: string): ShapeVisualColor;
/**
 * Assigns distinct palette colors within one analysis (no two shapes share a
 * color until the palette wraps). Seeds are typically geometry keys.
 */
export declare function assignDistinctShapeColors(seeds: readonly string[]): ReadonlyMap<string, ShapeVisualColor>;
export declare function getShapeColorKey(seed: string): string;
export declare function resolveShapeCssColor(color: ShapeVisualColor, brightnessLevel: number): string;
//# sourceMappingURL=shape-color.d.ts.map