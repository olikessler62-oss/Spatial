import type { Layout } from "../domain/layout.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ShapeDefinition } from "../domain/shape.js";
import { type PlacementHistoryFeatures } from "../analysis/features/placement-history-features.js";
import { type IndexedPlacement } from "../indexing/placement-indexer.js";
import type { RankingConfiguration } from "../ranking/ranking-types.js";
export interface TrackedPlacement {
    readonly resultId: string;
    readonly shapeId: string;
    readonly shapeName: string;
    readonly anchorValue: number;
    readonly values: readonly number[];
    readonly indexed: IndexedPlacement;
}
export interface WalkForwardSelection {
    readonly resultId: string;
    readonly shapeId: string;
    readonly shapeName: string;
    readonly anchorValue: number;
    readonly values: readonly number[];
    readonly features: PlacementHistoryFeatures;
    readonly score: number;
    readonly hitCount: number;
    readonly hitAtLeast1: boolean;
    readonly hitAtLeast2: boolean;
}
export interface WalkForwardStep {
    readonly drawIndex: number;
    readonly drawDate: string;
    readonly historySize: number;
    readonly actualMainNumbers: readonly number[];
    readonly top1: WalkForwardSelection;
    readonly top5: readonly WalkForwardSelection[];
}
export interface WalkForwardConfig {
    readonly initialHistorySize: number;
    readonly ranking?: RankingConfiguration;
}
export interface WalkForwardResult {
    readonly experimentId: string;
    readonly evaluatedDraws: number;
    readonly placementCount: number;
    readonly steps: readonly WalkForwardStep[];
    readonly summary: {
        readonly top1HitRate: number;
        readonly top1HitAtLeast2Rate: number;
        readonly top5AnyHitRate: number;
        readonly top5HitAtLeast2Rate: number;
        readonly averageTop1Hits: number;
        readonly averageTop5Hits: number;
        readonly maxTop1Hits: number;
    };
}
export declare function buildTrackedPlacements(layout: Layout, shapes: readonly ShapeDefinition[]): TrackedPlacement[];
export declare class WalkForwardRunner {
    private readonly hitEvaluator;
    private readonly rankingEngine;
    run(input: {
        readonly experimentId: string;
        readonly layout: Layout;
        readonly shapes: readonly ShapeDefinition[];
        readonly draws: readonly ParsedDraw[];
        readonly config: WalkForwardConfig;
    }): WalkForwardResult;
    private appendHits;
}
export declare function filterWalkForwardSteps(steps: readonly WalkForwardStep[], fromIndexInclusive: number, toIndexExclusive: number): WalkForwardStep[];
export declare function summarizeWalkForwardSteps(steps: readonly WalkForwardStep[]): {
    top1HitRate: number;
    top1HitAtLeast2Rate: number;
    top5AnyHitRate: number;
    top5HitAtLeast2Rate: number;
    averageTop1Hits: number;
    averageTop5Hits: number;
    maxTop1Hits: number;
};
//# sourceMappingURL=walk-forward-runner.d.ts.map