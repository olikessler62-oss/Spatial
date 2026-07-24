export interface RollingWindowConfiguration {
    readonly windowSizes: readonly number[];
    readonly stepSize: number;
}
export interface RollingPhaseAnalysisConfiguration extends RollingWindowConfiguration {
    /** When false, censored boundary streaks are excluded from central streak stats. */
    readonly includeBoundaryCensoredStreaksInStatistics: boolean;
    /** Minimum completed (uncensored) streaks required for classification. */
    readonly minimumCompletedStreaksForClassification: number;
    /** Window count used for linear trend regression. */
    readonly trendWindowCount: number;
    /** Absolute slope below this → trend direction "stable". */
    readonly trendStableSlopeThreshold: number;
    /** Relative hit-rate delta vs global to score phase points. */
    readonly hitRateDeviationThreshold: number;
    /** Relative median / trimmed-mean delta vs global to score phase points. */
    readonly streakDeviationThreshold: number;
    /** Absolute score thresholds for short / long interval phases. */
    readonly shortIntervalScoreThreshold: number;
    readonly longIntervalScoreThreshold: number;
    /** Maps configured window sizes to short / medium / long assessment slots. */
    readonly horizonWindowSizes: {
        readonly shortTerm: number;
        readonly mediumTerm: number;
        readonly longTerm: number;
    };
}
export declare const DEFAULT_ROLLING_WINDOW_CONFIGURATION: RollingWindowConfiguration;
export declare const DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION: RollingPhaseAnalysisConfiguration;
export interface WindowBoundaryStreak {
    readonly observedLengthInsideWindow: number;
    readonly fullHistoricalLength?: number;
    readonly startedBeforeWindow: boolean;
    readonly continuesAfterWindow: boolean;
}
export interface WindowMissStreakStatistics {
    readonly sampleSize: number;
    readonly minimum: number | null;
    readonly maximum: number | null;
    readonly arithmeticMean: number | null;
    readonly median: number | null;
    readonly mode: readonly number[];
    readonly percentile25: number | null;
    readonly percentile75: number | null;
    readonly percentile90: number | null;
    readonly percentile95: number | null;
    readonly trimmedMean10Percent: number | null;
}
export interface WindowGlobalComparison {
    readonly hitRateDifference: number;
    readonly hitRateRatio: number | null;
    readonly medianMissStreakDifference: number | null;
    readonly medianMissStreakRatio: number | null;
    readonly trimmedMeanDifference: number | null;
    readonly trimmedMeanRatio: number | null;
}
export interface WindowMetricTrend {
    readonly direction: "decreasing" | "stable" | "increasing";
    readonly slope: number;
    readonly comparedWindowCount: number;
}
export type NumberPhaseType = "short-interval" | "normal" | "long-interval" | "transition" | "insufficient-data";
export type CombinedPhasePattern = "aligned-short-interval" | "aligned-normal" | "aligned-long-interval" | "short-term-deviation" | "medium-term-transition" | "mixed-time-horizons" | "insufficient-data";
export interface RollingNumberWindowAnalysis {
    readonly number: number;
    readonly windowSize: number;
    readonly windowStartIndex: number;
    readonly windowEndIndex: number;
    readonly windowStartDate?: string;
    readonly windowEndDate?: string;
    readonly drawCount: number;
    readonly hitCount: number;
    readonly missCount: number;
    readonly hitRate: number;
    /** Fully inside-window completed miss streaks (View A lengths). */
    readonly completedMissStreaks: readonly number[];
    readonly boundaryStreaks: readonly WindowBoundaryStreak[];
    readonly missStreakStatistics: WindowMissStreakStatistics;
    /** Open miss streak at the window end (View A, inside window). */
    readonly trailingMissStreak: number;
    readonly comparisonToGlobal: WindowGlobalComparison;
    /**
     * Hit spacing as count of miss draws between consecutive hits inside the window.
     * Preferred definition from the rolling-phase spec.
     */
    readonly hitGaps: readonly number[];
}
export interface GlobalNumberStatistics {
    readonly number: number;
    readonly drawCount: number;
    readonly hitCount: number;
    readonly missCount: number;
    readonly hitRate: number;
    readonly trailingMissStreak: number;
    readonly completedMissStreaks: readonly number[];
    readonly missStreakStatistics: WindowMissStreakStatistics;
    readonly maximumMissStreak: number | null;
}
export interface PhaseWindowAssessment {
    readonly windowSize: number;
    readonly phaseType: NumberPhaseType;
    /** 0..1 descriptive fit strength — not a prediction probability. */
    readonly classificationStrength: number;
    readonly comparisonToGlobal: WindowGlobalComparison;
    readonly hitRateTrend: WindowMetricTrend;
    readonly medianMissStreakTrend: WindowMetricTrend;
    readonly explanationKeys: readonly string[];
}
export interface CombinedPhaseAssessment {
    readonly pattern: CombinedPhasePattern;
    readonly explanationKeys: readonly string[];
}
export interface CurrentNumberPhaseAssessment {
    readonly shortTerm: PhaseWindowAssessment | null;
    readonly mediumTerm: PhaseWindowAssessment | null;
    readonly longTerm: PhaseWindowAssessment | null;
    readonly combinedAssessment: CombinedPhaseAssessment;
}
export interface NumberRollingPhaseAnalysis {
    readonly number: number;
    readonly globalStatistics: GlobalNumberStatistics;
    readonly windowsBySize: Readonly<Record<number, readonly RollingNumberWindowAnalysis[]>>;
    readonly currentWindows: Readonly<Record<number, RollingNumberWindowAnalysis | null>>;
    readonly currentPhaseAssessment: CurrentNumberPhaseAssessment;
}
export interface RollingWindowRange {
    readonly windowSize: number;
    readonly windowStartIndex: number;
    readonly windowEndIndex: number;
    readonly drawCount: number;
}
export interface ChronologicalDrawRef {
    readonly drawDate: string;
    readonly mainNumbers: readonly number[];
}
//# sourceMappingURL=types.d.ts.map