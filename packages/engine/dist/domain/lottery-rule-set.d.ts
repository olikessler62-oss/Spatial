export interface NumberPoolRule {
    readonly minimum: number;
    readonly maximum: number;
    readonly count: number;
}
export interface LotteryRuleSet {
    readonly mainNumbers: NumberPoolRule;
    readonly bonusNumbers?: NumberPoolRule;
}
//# sourceMappingURL=lottery-rule-set.d.ts.map