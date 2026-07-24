import type { ShapeVisualizationPlan, ShapeVisualizationStep } from "./visualization-types.js";
export interface ShapeVisualizationRunnerOptions {
    readonly signal?: AbortSignal;
    readonly onStep?: (step: ShapeVisualizationStep) => void;
    readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}
/**
 * Plays a prepared visualization plan. Does not run analysis.
 */
export declare function playShapeVisualizationPlan(plan: ShapeVisualizationPlan, options?: ShapeVisualizationRunnerOptions): Promise<void>;
//# sourceMappingURL=visualization-runner.d.ts.map