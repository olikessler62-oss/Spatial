import type { WindowBoundaryStreak } from "./types.js";
export interface WindowMissStreakAnalysis {
    /** Fully interior completed streaks (started and ended by hits inside the window). */
    readonly completedMissStreaks: readonly number[];
    readonly boundaryStreaks: readonly WindowBoundaryStreak[];
    /** Misses at the end of the window (View A length). */
    readonly trailingMissStreak: number;
    /**
     * Lengths used for central statistics depending on includeBoundaryCensored.
     * Always uses View A (observed inside window) lengths.
     */
    readonly statisticsSample: readonly number[];
    /** Miss counts between consecutive hits inside the window. */
    readonly hitGaps: readonly number[];
}
/**
 * Analyzes miss streaks for a boolean hit series over [windowStart, windowEnd].
 *
 * Central statistics use fensterinterne (View A) lengths.
 * Boundary streaks carry optional fullHistoricalLength (View B metadata).
 */
export declare function analyzeWindowMissStreaks(hits: readonly boolean[], windowStartIndex: number, windowEndIndex: number, includeBoundaryCensoredStreaksInStatistics: boolean): WindowMissStreakAnalysis;
/** Global completed miss streaks + trailing open streak over the full series. */
export declare function analyzeGlobalMissStreaks(hits: readonly boolean[]): {
    readonly completedMissStreaks: readonly number[];
    readonly trailingMissStreak: number;
};
//# sourceMappingURL=miss-streak-analyzer.d.ts.map