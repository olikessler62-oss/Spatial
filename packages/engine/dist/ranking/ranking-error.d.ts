export type RankingErrorCode = "EMPTY_CRITERIA" | "DUPLICATE_METRIC" | "INVALID_WEIGHT" | "ZERO_TOTAL_WEIGHT" | "INVALID_DIRECTION" | "INVALID_LIMIT" | "MISSING_METRIC_VALUE" | "INVALID_METRIC_VALUE";
export declare class RankingError extends Error {
    readonly code: RankingErrorCode;
    constructor(message: string, code: RankingErrorCode);
}
//# sourceMappingURL=ranking-error.d.ts.map