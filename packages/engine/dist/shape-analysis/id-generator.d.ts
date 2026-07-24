import type { IdGenerator } from "./domain/analysis-request.js";
/**
 * Deterministic sequential id generator for tests and reproducible runs.
 */
export declare class SequentialIdGenerator implements IdGenerator {
    private readonly padWidth;
    private counter;
    constructor(padWidth?: number);
    nextId(prefix: string): string;
}
//# sourceMappingURL=id-generator.d.ts.map