import { CsvParser } from "./csv-parser.js";
import { DrawValidator } from "../validation/draw-validator.js";
export class CsvImportService {
    parser;
    validator;
    constructor(dependencies = {}) {
        this.parser = dependencies.parser ?? new CsvParser();
        this.validator = dependencies.validator ?? new DrawValidator();
    }
    import(input, rules, options = {}) {
        const draws = this.parser.parse(input, options);
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
}
//# sourceMappingURL=csv-import-service.js.map