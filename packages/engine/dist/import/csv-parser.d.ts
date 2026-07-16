import type { ParsedDraw } from "../domain/parsed-draw.js";
export interface CsvParserOptions {
    readonly delimiter?: string;
    readonly dateColumn?: string;
    readonly mainNumbersColumn?: string;
    readonly bonusNumbersColumn?: string;
    readonly externalIdColumn?: string;
    readonly numberSeparator?: string;
}
export declare class CsvParser {
    parse(input: string, options?: CsvParserOptions): readonly ParsedDraw[];
    private parseRows;
    private requiredColumn;
    private requiredValue;
    private normalizeDate;
    private parseNumbers;
}
//# sourceMappingURL=csv-parser.d.ts.map