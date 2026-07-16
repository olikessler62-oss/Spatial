import type { LotteryRuleSet } from "../domain/lottery-rule-set.js";
import { CsvParser, type CsvParserOptions } from "./csv-parser.js";
import type { ImportReport, RejectedDraw } from "./import-report.js";
import { DrawValidator } from "../validation/draw-validator.js";

export interface CsvImportServiceDependencies {
  readonly parser?: CsvParser;
  readonly validator?: DrawValidator;
}

export class CsvImportService {
  private readonly parser: CsvParser;
  private readonly validator: DrawValidator;

  public constructor(dependencies: CsvImportServiceDependencies = {}) {
    this.parser = dependencies.parser ?? new CsvParser();
    this.validator = dependencies.validator ?? new DrawValidator();
  }

  public import(
    input: string,
    rules: LotteryRuleSet,
    options: CsvParserOptions = {},
  ): ImportReport {
    const draws = this.parser.parse(input, options);
    const acceptedDraws = [];
    const rejectedDraws: RejectedDraw[] = [];

    for (const draw of draws) {
      const issues = this.validator.validate(draw, rules);

      if (issues.length === 0) {
        acceptedDraws.push(draw);
      } else {
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
