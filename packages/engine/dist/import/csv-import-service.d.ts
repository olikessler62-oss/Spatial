import type { LotteryRuleSet } from "../domain/lottery-rule-set.js";
import { CsvParser, type CsvParserOptions } from "./csv-parser.js";
import type { ImportReport } from "./import-report.js";
import { DrawValidator } from "../validation/draw-validator.js";
export interface CsvImportServiceDependencies {
    readonly parser?: CsvParser;
    readonly validator?: DrawValidator;
}
export declare class CsvImportService {
    private readonly parser;
    private readonly validator;
    constructor(dependencies?: CsvImportServiceDependencies);
    import(input: string, rules: LotteryRuleSet, options?: CsvParserOptions): ImportReport;
}
//# sourceMappingURL=csv-import-service.d.ts.map