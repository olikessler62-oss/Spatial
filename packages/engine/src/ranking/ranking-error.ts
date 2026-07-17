export type RankingErrorCode =
  | "EMPTY_CRITERIA"
  | "DUPLICATE_METRIC"
  | "INVALID_WEIGHT"
  | "ZERO_TOTAL_WEIGHT"
  | "INVALID_DIRECTION"
  | "INVALID_LIMIT"
  | "MISSING_METRIC_VALUE"
  | "INVALID_METRIC_VALUE";

export class RankingError extends Error {
  public constructor(
    message: string,
    public readonly code: RankingErrorCode,
  ) {
    super(message);
    this.name = "RankingError";
  }
}