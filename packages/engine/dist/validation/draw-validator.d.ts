import type { LotteryRuleSet } from "../domain/lottery-rule-set.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
export interface ValidationIssue {
    readonly code: string;
    readonly message: string;
    readonly sourceRow: number;
}
export declare class DrawValidator {
    validate(draw: ParsedDraw, rules: LotteryRuleSet): readonly ValidationIssue[];
    private validatePool;
}
//# sourceMappingURL=draw-validator.d.ts.map