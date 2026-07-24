import type { RollingWindowRange } from "./types.js";
/**
 * Builds inclusive index ranges for rolling windows over a chronological series.
 * Indices are 0-based into an oldest→newest draw array.
 */
export declare function buildRollingWindows(drawCount: number, windowSize: number, stepSize: number): readonly RollingWindowRange[];
//# sourceMappingURL=rolling-window-builder.d.ts.map