import type { VersionedLotteryRuleSet } from "../domain/lottery-rule-set.js";
/**
 * Resolves the lottery rule set that covers a draw date.
 * When multiple periods match, the highest `validFrom` wins.
 */
export declare function resolveRuleSetForDate(drawDate: string, periods: readonly VersionedLotteryRuleSet[]): VersionedLotteryRuleSet | null;
//# sourceMappingURL=rule-set-resolver.d.ts.map