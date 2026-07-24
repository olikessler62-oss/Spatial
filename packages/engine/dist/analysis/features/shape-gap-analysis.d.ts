import type { Layout } from "../../domain/layout.js";
import type { ParsedDraw } from "../../domain/parsed-draw.js";
import type { ShapeDefinition } from "../../domain/shape.js";
export interface GapLengthFrequency {
    /** Number of consecutive non-hits between two hits. */
    readonly missCount: number;
    readonly occurrences: number;
    readonly share: number;
}
export interface PlacementGapStats {
    readonly resultId: string;
    readonly shapeId: string;
    readonly shapeName: string;
    readonly anchorValue: number;
    readonly values: readonly number[];
    readonly hitCount: number;
    /** Miss streaks between consecutive hits (0 = hit again next draw). */
    readonly missStreaks: readonly number[];
    readonly averageMissStreak: number;
    readonly maximumMissStreak: number;
    readonly mostCommonMissCount: number | null;
    readonly mostCommonMissShare: number;
}
export interface ShapeGapStats {
    readonly shapeId: string;
    readonly shapeName: string;
    readonly placementCount: number;
    readonly placementsWithGaps: number;
    readonly totalMissStreaks: number;
    readonly averageMissStreak: number;
    readonly maximumMissStreak: number;
    /** Most frequent miss-streak length across all placements. */
    readonly mostCommonMissCount: number | null;
    readonly mostCommonOccurrences: number;
    readonly mostCommonShare: number;
    /** Top frequencies, sorted by occurrences desc. */
    readonly missFrequencies: readonly GapLengthFrequency[];
    readonly placements: readonly PlacementGapStats[];
}
export interface ShapeGapAnalysisReport {
    readonly drawCount: number;
    readonly dateFrom: string | null;
    readonly dateTo: string | null;
    readonly layoutSeed: string;
    readonly shapes: readonly ShapeGapStats[];
}
/**
 * Counts consecutive non-hits between hits (≥1 number).
 * Primary output: which miss-streak length occurs most often.
 */
export declare function analyzeShapeGaps(options: {
    readonly layout: Layout;
    readonly shapes: readonly ShapeDefinition[];
    readonly draws: readonly ParsedDraw[];
    readonly layoutSeed: string;
}): ShapeGapAnalysisReport;
//# sourceMappingURL=shape-gap-analysis.d.ts.map