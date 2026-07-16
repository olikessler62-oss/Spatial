import type { IndexedDraw } from "../indexing/draw-indexer.js";
export interface SyntheticDrawGeneratorOptions {
    readonly drawCount: number;
    readonly layoutSize: number;
    readonly numbersPerDraw: number;
    readonly seed?: number;
}
export declare class SyntheticDrawGenerator {
    generate(options: SyntheticDrawGeneratorOptions): readonly IndexedDraw[];
    private validateOptions;
    private createRandom;
    private createDate;
}
//# sourceMappingURL=synthetic-draw-generator.d.ts.map