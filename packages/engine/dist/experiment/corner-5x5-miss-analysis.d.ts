import type { ParsedDraw } from "../domain/parsed-draw.js";
export interface CornerMissFrequency {
    readonly missCount: number;
    readonly occurrences: number;
    readonly share: number;
}
export interface CornerMissedPlacement {
    readonly resultId: string;
    readonly shapeId: string;
    readonly shapeName: string;
    readonly anchorValue: number;
    readonly values: readonly number[];
    /** Consecutive non-hits ending at the latest draw (including latest). */
    readonly currentMissStreak: number;
    /** Share of all draws that were non-hits for this placement. */
    readonly historicalMissRate: number;
    readonly historicalMissCount: number;
    readonly historicalDrawCount: number;
    /** Frequency of this streak length among completed miss streaks in the past. */
    readonly currentStreakFrequency: CornerMissFrequency | null;
    readonly missStreakFrequencies: readonly CornerMissFrequency[];
}
export interface Corner5x5MissReport {
    readonly layoutSeed: string;
    readonly valueMapping: readonly number[];
    readonly latestDrawDate: string;
    readonly latestMainNumbers: readonly number[];
    readonly drawCount: number;
    readonly window: "top-left-5x5";
    readonly placementCountInWindow: number;
    readonly missedOnLatest: readonly CornerMissedPlacement[];
    readonly hitOnLatestCount: number;
}
/**
 * One fixed arbitrary 7×7 layout. In the top-left 5×5, find which 5-cell
 * pattern placements missed the latest draw, then report historical miss stats.
 */
export declare function analyzeCorner5x5LatestMisses(options: {
    readonly draws: readonly ParsedDraw[];
    readonly layoutSeed?: string;
}): Corner5x5MissReport;
//# sourceMappingURL=corner-5x5-miss-analysis.d.ts.map