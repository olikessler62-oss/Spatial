export type ShapeRunBoundaryStatus = "complete" | "left-censored" | "right-censored" | "both-censored";
export interface ShapeRun {
    readonly id: string;
    readonly startCardId: string;
    readonly endCardId: string;
    readonly startChronologicalIndex: number;
    readonly endChronologicalIndex: number;
    readonly length: number;
    readonly boundaryStatus: ShapeRunBoundaryStatus;
    readonly isComplete: boolean;
}
export type HistoricalOpenRunPolicy = "exclude" | "include-as-censored";
export interface HistoricalShapeRunOptions {
    /**
     * Whether open/censored runs appear in separate censored summaries.
     * Completed-run statistics never include censored runs.
     */
    readonly openRunPolicy: HistoricalOpenRunPolicy;
    /** Minimum completed runs before data quality is "sufficient". */
    readonly minimumCompletedRunCount: number;
}
export declare const DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS: HistoricalShapeRunOptions;
export interface RunLengthFrequencyEntry {
    readonly runLength: number;
    readonly frequency: number;
}
export interface RunLengthSurvivalEntry {
    readonly runLength: number;
    readonly countAtLeast: number;
    readonly probabilityAtLeast: number;
}
export interface RunLengthMode {
    readonly runLengths: readonly number[];
    readonly frequency: number;
}
export interface RunLengthQuantiles {
    readonly p50: number | null;
    readonly p75: number | null;
    readonly p90: number | null;
    readonly p95: number | null;
}
export interface HistoricalRunDataQuality {
    readonly status: "sufficient" | "limited" | "insufficient";
    readonly completedRunCount: number;
    readonly minimumRequiredRunCount: number;
    readonly hasLeftCensoredRun: boolean;
    readonly hasRightCensoredRun: boolean;
    readonly notes: readonly string[];
}
export interface CensoredRunSummary {
    readonly longestObservedCensoredRun: number | null;
    readonly rightCensoredCurrentLength: number | null;
}
export interface HistoricalPercentileBreakdown {
    readonly percentageShorterThan: number;
    readonly percentageAtMost: number;
}
//# sourceMappingURL=shape-run.d.ts.map