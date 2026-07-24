import type { ShapeAnalysisCard } from "./analysis-card.js";
import type { ShapeType } from "./geometry.js";
export interface ShapeAnalysisConfiguration {
    readonly enabledShapeTypes: readonly ShapeType[];
    /**
     * Delay between visualization steps.
     * Default for the current use case: 150 ms.
     * Core engine must not sleep; UI consumes this later.
     */
    readonly visualizationStepDelayMs: number;
    /**
     * Smallest allowed contiguous cell count.
     * Default for rectangles: 4.
     */
    readonly minimumShapeCellCount: number;
}
export declare const DEFAULT_SHAPE_ANALYSIS_CONFIGURATION: ShapeAnalysisConfiguration;
export interface ShapeAnalysisRequest {
    readonly selectedCardId: string;
    /**
     * Only cards currently available in the analysis context.
     * The engine must not load further draws.
     */
    readonly cards: readonly ShapeAnalysisCard[];
    readonly configuration: ShapeAnalysisConfiguration;
}
export interface ShapeAnalysisExecutionOptions {
    readonly signal?: AbortSignal;
}
export interface IdGenerator {
    nextId(prefix: string): string;
}
//# sourceMappingURL=analysis-request.d.ts.map