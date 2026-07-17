export type ExperimentAnalysisErrorCode =
  | "EMPTY_EXPERIMENT_ID"
  | "INVALID_CREATED_AT"
  | "EMPTY_RESULT_ID"
  | "DUPLICATE_RESULT_ID";

export interface ExperimentAnalysisErrorDetails {
  readonly resultId?: string;
  readonly candidateIndex?: number;
}

export class ExperimentAnalysisError extends Error {
  public readonly code: ExperimentAnalysisErrorCode;
  public readonly details?: ExperimentAnalysisErrorDetails;

  public constructor(
  code: ExperimentAnalysisErrorCode,
  message: string,
  details?: ExperimentAnalysisErrorDetails,
) {
  super(message);

  this.name = "ExperimentAnalysisError";
  this.code = code;

  if (details !== undefined) {
    this.details = details;
  }

  Object.setPrototypeOf(this, ExperimentAnalysisError.prototype);
}
}
