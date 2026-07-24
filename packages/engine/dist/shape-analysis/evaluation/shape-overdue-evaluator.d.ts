import type { ShapeOverdueBatchRequest, ShapeOverdueEvaluationRequest } from "./shape-overdue-evaluation-request.js";
import type { ShapeOverdueBatchResult, ShapeOverdueBatchSummary, ShapeOverdueEvaluation } from "./shape-overdue-evaluation-result.js";
import { findProbabilityAtLeast } from "./shape-run-comparison.js";
import { DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION } from "./shape-overdue-types.js";
export interface ShapeOverdueEvaluator {
    evaluate(request: ShapeOverdueEvaluationRequest): ShapeOverdueEvaluation;
}
export declare class DefaultShapeOverdueEvaluator implements ShapeOverdueEvaluator {
    evaluate(request: ShapeOverdueEvaluationRequest): ShapeOverdueEvaluation;
    private classify;
    private validateKeys;
    private validateCurrent;
    private validateHistorical;
    private validateConfiguration;
}
export declare function evaluateShapeOverdueBatch(request: ShapeOverdueBatchRequest, evaluator?: ShapeOverdueEvaluator): ShapeOverdueBatchResult;
export declare function summarizeShapeOverdueBatch(evaluations: readonly ShapeOverdueEvaluation[]): ShapeOverdueBatchSummary;
export declare function compareShapeOverdueEvaluations(a: ShapeOverdueEvaluation, b: ShapeOverdueEvaluation): number;
export { DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION, findProbabilityAtLeast, };
//# sourceMappingURL=shape-overdue-evaluator.d.ts.map