import type { LotteryRuleSet, VersionedLotteryRuleSet } from "../domain/lottery-rule-set.js";
import { DrawValidator } from "../validation/draw-validator.js";
import { CsvParser, type CsvParserOptions } from "./csv-parser.js";
import type { ImportReport } from "./import-report.js";
export interface CsvImportServiceDependencies {
    readonly parser?: CsvParser;
    readonly validator?: DrawValidator;
}
export declare class CsvImportService {
    private readonly parser;
    private readonly validator;
    constructor(dependencies?: CsvImportServiceDependencies);
    private parseDraws;
    import(input: string, rules: LotteryRuleSet, options?: CsvParserOptions): ImportReport;
    /**
     * Imports draws and validates each row against the rule set covering its draw date.
     */
    importWithTimeline(input: string, periods: readonly VersionedLotteryRuleSet[], options?: CsvParserOptions): ImportReport;
}
//# sourceMappingURL=csv-import-service.d.ts.map