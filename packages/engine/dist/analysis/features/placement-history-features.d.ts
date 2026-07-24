export interface PlacementHistoryFeatures {
    readonly drawsSinceLastHit: number;
    readonly averageHistoricalGap: number;
    readonly maximumHistoricalGap: number;
    readonly hitFrequency: number;
    readonly hitsLast10: number;
    readonly hitsLast25: number;
    readonly hitsLast50: number;
    /** drawsSinceLastHit / averageHistoricalGap; 0 when undefined/never-hit. */
    readonly currentGapRatio: number;
    /** 1 - recent hit density in last up-to-50 draws (for ranking). */
    readonly recentInactivity: number;
}
/**
 * Features from a chronological hit sequence for draws strictly before the test draw.
 * `true` means the placement had at least one number hit in that draw.
 */
export declare function computePlacementHistoryFeatures(hitSequence: readonly boolean[]): PlacementHistoryFeatures;
export declare function featuresToMetricValues(features: PlacementHistoryFeatures): Readonly<Record<string, number>>;
/** Experiment1 default ranking weights. */
export declare const EXPERIMENT1_RANKING_CRITERIA: {
    metricId: string;
    weight: number;
    direction: "descending";
}[];
//# sourceMappingURL=placement-history-features.d.ts.map