import type { RankableResult, RankingConfiguration, RankingResult } from "./ranking-types.js";
export declare class RankingEngine {
    rank(results: readonly RankableResult[], configuration: RankingConfiguration): RankingResult;
    private validateConfiguration;
    private validateResults;
    private prepareCriteria;
    private calculateMetricRange;
    private scoreResult;
    private normalizeValue;
    private compareResults;
    private compareResultIds;
    private isRankingDirection;
}
//# sourceMappingURL=ranking-engine.d.ts.map