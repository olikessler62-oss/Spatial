export type RankingDirection = "ascending" | "descending";
export interface RankingCriterion {
    readonly metricId: string;
    readonly weight: number;
    readonly direction: RankingDirection;
}
export interface RankingConfiguration {
    readonly criteria: readonly RankingCriterion[];
    readonly limit?: number;
}
export interface RankableResult {
    readonly resultId: string;
    readonly metricValues: Readonly<Record<string, number>>;
}
export interface RankingCriterionScore {
    readonly metricId: string;
    readonly rawValue: number;
    readonly normalizedValue: number;
    readonly normalizedWeight: number;
    readonly contribution: number;
}
export interface RankedResult {
    readonly rank: number;
    readonly resultId: string;
    readonly score: number;
    readonly criteria: readonly RankingCriterionScore[];
}
export interface RankingResult {
    readonly entries: readonly RankedResult[];
    readonly totalResultCount: number;
    readonly appliedCriteria: readonly RankingCriterion[];
}
//# sourceMappingURL=ranking-types.d.ts.map