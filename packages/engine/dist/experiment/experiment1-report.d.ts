import { EXPERIMENT1_RANKING_CRITERIA } from "../analysis/features/placement-history-features.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ShapeDefinition } from "../domain/shape.js";
import { type BaselineDistributionSummary } from "./baselines/random-placement-baseline.js";
import { type WalkForwardResult, type WalkForwardStep } from "./walk-forward-runner.js";
export interface SegmentSummary {
    readonly label: string;
    readonly startIndex: number;
    readonly endIndex: number;
    readonly drawCount: number;
    readonly top1HitRate: number;
    readonly top5AnyHitRate: number;
    readonly averageTop1Hits: number;
}
export interface ShapeBreakdownRow {
    readonly shapeId: string;
    readonly shapeName: string;
    readonly placementCount: number;
    readonly top1Selections: number;
    readonly top5Selections: number;
    readonly top1HitRate: number;
    readonly top5HitRate: number;
    readonly averageTop1Hits: number;
}
export interface Experiment1Report {
    readonly configuration: {
        readonly datasetLabel: string;
        readonly drawCount: number;
        readonly initialHistorySize: number;
        readonly testDrawCount: number;
        readonly dateFrom: string | null;
        readonly dateTo: string | null;
        readonly layoutSeed: string;
        readonly valueMapping: readonly number[];
        readonly shapes: readonly string[];
        readonly placementCount: number;
        readonly rankingCriteria: typeof EXPERIMENT1_RANKING_CRITERIA;
        readonly baselineRepetitions: number;
    };
    readonly summary: WalkForwardResult["summary"];
    readonly stability: readonly SegmentSummary[];
    readonly byShape: readonly ShapeBreakdownRow[];
    readonly baseline: {
        readonly spatialTop1: BaselineDistributionSummary;
        readonly spatialTop5: BaselineDistributionSummary;
        readonly nonSpatialTop1: BaselineDistributionSummary;
        readonly nonSpatialTop5: BaselineDistributionSummary;
        readonly top1PValue: number;
        readonly top5PValue: number;
        readonly top1DeltaSpatial: number;
        readonly top5DeltaSpatial: number;
        readonly top1DeltaNonSpatial: number;
        readonly top5DeltaNonSpatial: number;
    };
    readonly samplePredictions: readonly {
        readonly drawDate: string;
        readonly historySize: number;
        readonly top1: {
            readonly shape: string;
            readonly anchor: number;
            readonly values: readonly number[];
            readonly score: number;
            readonly features: WalkForwardStep["top1"]["features"];
            readonly hitCount: number;
        };
        readonly actualMainNumbers: readonly number[];
    }[];
}
export declare function buildStabilitySegments(steps: readonly WalkForwardStep[]): SegmentSummary[];
export declare function buildShapeBreakdown(steps: readonly WalkForwardStep[], shapes: readonly ShapeDefinition[], placementCountByShape: ReadonlyMap<string, number>): ShapeBreakdownRow[];
export declare function runExperiment1(options: {
    readonly draws: readonly ParsedDraw[];
    readonly datasetLabel: string;
    readonly layoutSeed?: string;
    readonly initialHistorySize?: number;
    readonly baselineRepetitions?: number;
    readonly shapes?: readonly ShapeDefinition[];
}): Experiment1Report;
export interface Experiment1SeedRunSummary {
    readonly seedIndex: number;
    readonly layoutSeed: string;
    readonly selectionTop1HitRate: number;
    readonly selectionTop1HitAtLeast2Rate: number;
    readonly holdoutTop1HitRate: number;
    readonly holdoutTop1HitAtLeast2Rate: number;
    readonly holdoutTop5HitAtLeast2Rate: number;
}
export interface Experiment1WindowMetrics {
    readonly drawCount: number;
    readonly dateFrom: string | null;
    readonly dateTo: string | null;
    readonly summary: WalkForwardResult["summary"];
    readonly stability: readonly SegmentSummary[];
    readonly byShape: readonly ShapeBreakdownRow[];
    readonly baseline: {
        readonly spatialTop1Min1: BaselineDistributionSummary;
        readonly spatialTop1Min2: BaselineDistributionSummary;
        readonly nonSpatialTop1Min2: BaselineDistributionSummary;
        readonly top1Min2PValue: number;
        readonly top1Min2DeltaSpatial: number;
        readonly top1Min2DeltaNonSpatial: number;
    };
}
export interface Experiment1MultiSeedResult {
    readonly seedCount: number;
    readonly bestSeedIndex: number;
    readonly selectionCriterion: string;
    readonly protocol: {
        readonly initialHistorySize: number;
        readonly selectionFromIndex: number;
        readonly selectionToIndexExclusive: number;
        readonly holdoutFromIndex: number;
    };
    readonly caution: string;
    readonly runs: readonly Experiment1SeedRunSummary[];
    readonly best: Experiment1Report;
    readonly selection: Experiment1WindowMetrics;
    readonly holdout: Experiment1WindowMetrics;
}
/**
 * Seeds 0..N-1: pick best on selection window by Top-1 ≥2 hits,
 * then report holdout window once (confirmatory).
 */
export declare function runExperiment1MultiSeed(options: {
    readonly draws: readonly ParsedDraw[];
    readonly datasetLabel: string;
    readonly seedCount?: number;
    readonly initialHistorySize?: number;
    readonly holdoutStartIndex?: number;
    readonly baselineRepetitions?: number;
    readonly shapes?: readonly ShapeDefinition[];
}): Experiment1MultiSeedResult;
//# sourceMappingURL=experiment1-report.d.ts.map