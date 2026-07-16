export class DrawValidator {
    validate(draw, rules) {
        return [
            ...this.validatePool(draw.mainNumbers, rules.mainNumbers, "main", draw.sourceRow),
            ...(rules.bonusNumbers
                ? this.validatePool(draw.bonusNumbers, rules.bonusNumbers, "bonus", draw.sourceRow)
                : draw.bonusNumbers.length > 0
                    ? [{ code: "UNEXPECTED_BONUS_NUMBERS", message: "Bonus numbers were supplied, but the rule set defines none.", sourceRow: draw.sourceRow }]
                    : []),
        ];
    }
    validatePool(numbers, rule, pool, sourceRow) {
        const issues = [];
        if (numbers.length !== rule.count)
            issues.push({ code: `${pool.toUpperCase()}_COUNT_INVALID`, message: `Expected ${rule.count} ${pool} numbers, received ${numbers.length}.`, sourceRow });
        if (new Set(numbers).size !== numbers.length)
            issues.push({ code: `${pool.toUpperCase()}_DUPLICATE`, message: `${pool} numbers must be unique.`, sourceRow });
        for (const number of numbers)
            if (number < rule.minimum || number > rule.maximum)
                issues.push({ code: `${pool.toUpperCase()}_OUT_OF_RANGE`, message: `${pool} number ${number} is outside ${rule.minimum}-${rule.maximum}.`, sourceRow });
        return issues;
    }
}
//# sourceMappingURL=draw-validator.js.map