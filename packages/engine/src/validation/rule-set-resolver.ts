import type { VersionedLotteryRuleSet } from "../domain/lottery-rule-set.js";

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Resolves the lottery rule set that covers a draw date.
 * When multiple periods match, the highest `validFrom` wins.
 */
export function resolveRuleSetForDate(
  drawDate: string,
  periods: readonly VersionedLotteryRuleSet[],
): VersionedLotteryRuleSet | null {
  if (!isValidIsoDate(drawDate)) {
    return null;
  }

  let matched: VersionedLotteryRuleSet | null = null;

  for (const period of periods) {
    if (!isValidIsoDate(period.validFrom)) {
      continue;
    }

    if (period.validTo !== null && !isValidIsoDate(period.validTo)) {
      continue;
    }

    if (drawDate < period.validFrom) {
      continue;
    }

    if (period.validTo !== null && drawDate > period.validTo) {
      continue;
    }

    if (matched === null || period.validFrom > matched.validFrom) {
      matched = period;
    }
  }

  return matched;
}
