export type ShapeAnalysisErrorCode = "SELECTED_CARD_NOT_FOUND" | "EMPTY_CARD_SET" | "INVALID_GRID_DIMENSIONS" | "INCOMPLETE_GRID" | "DUPLICATE_CELL_COORDINATE" | "INCONSISTENT_GRID_LAYOUT" | "INVALID_CHRONOLOGY" | "UNSUPPORTED_SHAPE_TYPE" | "INVALID_PARENT_GEOMETRY" | "ANALYSIS_CANCELLED" | "INVALID_SHAPE_GEOMETRY" | "INVALID_ANALYSIS_OPTIONS" | "SHAPE_STATISTICS_KEY_MISMATCH" | "INVALID_CURRENT_RUN" | "INVALID_HISTORICAL_STATISTICS" | "INVALID_EVALUATION_CONFIGURATION";
export interface ShapeAnalysisErrorDetails {
    readonly cardId?: string;
    readonly row?: number;
    readonly column?: number;
    readonly shapeType?: string;
    readonly expected?: string;
    readonly actual?: string;
}
export declare class ShapeAnalysisError extends Error {
    readonly code: ShapeAnalysisErrorCode;
    readonly details?: ShapeAnalysisErrorDetails;
    constructor(code: ShapeAnalysisErrorCode, message: string, details?: ShapeAnalysisErrorDetails);
}
//# sourceMappingURL=shape-analysis-error.d.ts.map