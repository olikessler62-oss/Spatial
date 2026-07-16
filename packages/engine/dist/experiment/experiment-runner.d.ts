import type { ExperimentExecutionResult, ExperimentInput } from "../domain/experiment.js";
import { HitEvaluator } from "./hit-evaluator.js";
export interface ExperimentRunnerDependencies {
    readonly hitEvaluator?: HitEvaluator;
}
export declare class ExperimentRunner {
    private readonly hitEvaluator;
    constructor(dependencies?: ExperimentRunnerDependencies);
    run(input: ExperimentInput): ExperimentExecutionResult;
    private createPlacementSummaries;
}
//# sourceMappingURL=experiment-runner.d.ts.map