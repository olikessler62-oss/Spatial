export interface ShapeAnalysisCell {
    readonly row: number;
    readonly column: number;
    readonly isHit: boolean;
    /**
     * Optional lottery value for debugging / UI mapping only.
     * Must never influence geometric shape analysis.
     */
    readonly value?: number;
}
export interface ShapeAnalysisCard {
    readonly id: string;
    readonly drawDate: Date;
    /**
     * Stable chronological order key.
     * Higher values are newer draws.
     */
    readonly chronologicalIndex: number;
    readonly rowCount: number;
    readonly columnCount: number;
    readonly cells: readonly ShapeAnalysisCell[];
}
//# sourceMappingURL=analysis-card.d.ts.map