import { describe, expect, it } from "vitest";

import {
  ExperimentAnalysisError,
  type ExperimentAnalysisErrorCode,
} from "../../src/analysis/experiment-analysis-error.js";

describe("ExperimentAnalysisError", () => {
  it("creates an error with code and message", () => {
    const error = new ExperimentAnalysisError(
      "EMPTY_EXPERIMENT_ID",
      "Experiment identifier must not be empty",
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ExperimentAnalysisError);

    expect(error.name).toBe("ExperimentAnalysisError");
    expect(error.code).toBe("EMPTY_EXPERIMENT_ID");
    expect(error.message).toBe(
      "Experiment identifier must not be empty",
    );
    expect(error.details).toBeUndefined();
  });

  it("stores optional details", () => {
    const error = new ExperimentAnalysisError(
      "DUPLICATE_RESULT_ID",
      "Duplicate result identifier",
      {
        resultId: "placement-42",
        candidateIndex: 3,
      },
    );

    expect(error.code).toBe("DUPLICATE_RESULT_ID");
    expect(error.details).toEqual({
      resultId: "placement-42",
      candidateIndex: 3,
    });
  });

  it.each<ExperimentAnalysisErrorCode>([
    "EMPTY_EXPERIMENT_ID",
    "INVALID_CREATED_AT",
    "EMPTY_RESULT_ID",
    "DUPLICATE_RESULT_ID",
  ])("supports error code %s", (code) => {
    const error = new ExperimentAnalysisError(code, "message");

    expect(error.code).toBe(code);
  });

  it("preserves the prototype chain", () => {
    const error = new ExperimentAnalysisError(
      "EMPTY_RESULT_ID",
      "Result identifier is empty",
    );

    expect(error instanceof ExperimentAnalysisError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(Object.getPrototypeOf(error)).toBe(
      ExperimentAnalysisError.prototype,
    );
  });
});