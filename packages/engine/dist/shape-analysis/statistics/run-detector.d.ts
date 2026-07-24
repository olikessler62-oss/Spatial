import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type { ShapeRun, ShapeRunBoundaryStatus } from "./shape-run.js";
export declare function resolveBoundaryStatus(startIndex: number, endIndex: number, cardCount: number): ShapeRunBoundaryStatus;
/**
 * Detect contiguous free runs from a presence sequence (true = free).
 * Cards must already be sorted oldest → newest.
 */
export declare function detectShapeRuns(options: {
    readonly cards: readonly ShapeAnalysisCard[];
    readonly presence: readonly boolean[];
    readonly nextId: () => string;
}): readonly ShapeRun[];
//# sourceMappingURL=run-detector.d.ts.map