function isValidIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
/**
 * Resolves the lottery rule set that covers a draw date.
 * When multiple periods match, the highest `validFrom` wins.
 */
export function resolveRuleSetForDate(drawDate, periods) {
    if (!isValidIsoDate(drawDate)) {
        return null;
    }
    let matched = null;
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
//# sourceMappingURL=rule-set-resolver.js.map