export type ExperimentAnalysisErrorCode = "EMPTY_EXPERIMENT_ID" | "INVALID_CREATED_AT" | "EMPTY_RESULT_ID" | "DUPLICATE_RESULT_ID";
export interface ExperimentAnalysisErrorDetails {
    readonly resultId?: string;
    readonly candidateIndex?: number;
}
export declare class ExperimentAnalysisError extends Error {
    readonly code: ExperimentAnalysisErrorCode;
    readonly details?: ExperimentAnalysisErrorDetails;
    constructor(code: ExperimentAnalysisErrorCode, message: string, details?: ExperimentAnalysisErrorDetails);
}
//# sourceMappingURL=experiment-analysis-error.d.ts.map