import { DrawValidator } from "../validation/draw-validator.js";
import { resolveRuleSetForDate } from "../validation/rule-set-resolver.js";
import { CsvParser } from "./csv-parser.js";
import { looksLikeGermanLottoArchive, parseGermanLottoArchive, } from "./german-lotto-archive.js";
export class CsvImportService {
    parser;
    validator;
    constructor(dependencies = {}) {
        this.parser = dependencies.parser ?? new CsvParser();
        this.validator = dependencies.validator ?? new DrawValidator();
    }
    parseDraws(input, options = {}) {
        if (looksLikeGermanLottoArchive(input)) {
            return parseGermanLottoArchive(input);
        }
        return this.parser.parse(input, options);
    }
    import(input, rules, options = {}) {
        const draws = this.parseDraws(input, options);
        const acceptedDraws = [];
        const rejectedDraws = [];
        for (const draw of draws) {
            const issues = this.validator.validate(draw, rules);
            if (issues.length === 0) {
                acceptedDraws.push(draw);
            }
            else {
                rejectedDraws.push({ draw, issues });
            }
        }
        return {
            receivedRows: draws.length,
            acceptedRows: acceptedDraws.length,
            rejectedRows: rejectedDraws.length,
            acceptedDraws,
            rejectedDraws,
        };
    }
    /**
     * Imports draws and validates each row against the rule set covering its draw date.
     */
    importWithTimeline(input, periods, options = {}) {
        if (periods.length === 0) {
            throw new Error("At least one versioned lottery rule set is required.");
        }
        const draws = this.parseDraws(input, options);
        const acceptedDraws = [];
        const rejectedDraws = [];
        for (const draw of draws) {
            const period = resolveRuleSetForDate(draw.drawDate, periods);
            if (period === null) {
                rejectedDraws.push({
                    draw,
                    issues: [{
                            code: "RULE_SET_NOT_FOUND",
                            message: `No lottery rule set covers draw date ${draw.drawDate}.`,
                            sourceRow: draw.sourceRow,
                        }],
                });
                continue;
            }
            const issues = this.validator.validate(draw, period.rules);
            if (issues.length === 0) {
                acceptedDraws.push({
                    ...draw,
                    ruleSetId: period.id,
                });
            }
            else {
                rejectedDraws.push({ draw, issues });
            }
        }
        return {
            receivedRows: draws.length,
            acceptedRows: acceptedDraws.length,
            rejectedRows: rejectedDraws.length,
            acceptedDraws,
            rejectedDraws,
        };
    }
}
//# sourceMappingURL=csv-import-service.js.map