export interface NumberPoolRule {
  readonly minimum: number;
  readonly maximum: number;
  readonly count: number;
}

export interface LotteryRuleSet {
  readonly mainNumbers: NumberPoolRule;
  readonly bonusNumbers?: NumberPoolRule;
}

/**
 * A versioned lottery rule period used for date-based resolution.
 * Validity is inclusive on both ends when `validTo` is set.
 */
export interface VersionedLotteryRuleSet {
  readonly id: string;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly rules: LotteryRuleSet;
  readonly bonusType?: string;
}
