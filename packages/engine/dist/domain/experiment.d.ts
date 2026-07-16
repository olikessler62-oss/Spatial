import type { IndexedDraw } from "../indexing/draw-indexer.js";
import type { IndexedPlacement } from "../indexing/placement-indexer.js";
export interface ExperimentInput {
    readonly experimentId: string;
    readonly placements: readonly IndexedPlacement[];
    readonly draws: readonly IndexedDraw[];
}
export interface PlacementDrawResult {
    readonly anchorValue: number;
    readonly drawDate: string;
    readonly hitCount: number;
    readonly placementSize: number;
    readonly coverage: number;
    readonly isHit: boolean;
    readonly externalId?: string;
}
export interface PlacementExperimentSummary {
    readonly anchorValue: number;
    readonly placementSize: number;
    readonly analyzedDraws: number;
    readonly drawsWithHits: number;
    readonly totalHits: number;
    readonly maximumHits: number;
    readonly averageHits: number;
}
export interface ExperimentExecutionResult {
    readonly experimentId: string;
    readonly analyzedDraws: number;
    readonly analyzedPlacements: number;
    readonly comparisons: number;
    readonly results: readonly PlacementDrawResult[];
    readonly placementSummaries: readonly PlacementExperimentSummary[];
}
//# sourceMappingURL=experiment.d.ts.map