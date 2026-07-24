import type { ParsedDraw } from "../../domain/parsed-draw.js";
import type { BaselineDistributionSummary } from "./random-placement-baseline.js";
/**
 * Non-spatial control: random number groups of the same sizes as pattern
 * selections, without using layout geometry.
 */
export declare function runNonSpatialGroupBaseline(options: {
    readonly draws: readonly ParsedDraw[];
    readonly testStartIndex: number;
    readonly testEndIndex?: number;
    /** Number of groups selected per test draw (e.g. 1 or 5). */
    readonly topK: number;
    /** Size of each number group (e.g. 4 for line/L shapes). */
    readonly groupSize: number;
    readonly numberPool: readonly number[];
    /** Minimum overlapping numbers to count as success. */
    readonly minHits?: number;
    readonly seeds: readonly (string | number)[];
}): BaselineDistributionSummary;
//# sourceMappingURL=nonspatial-group-baseline.d.ts.map