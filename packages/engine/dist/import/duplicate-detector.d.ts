import type { ParsedDraw } from "../domain/parsed-draw.js";
export interface DuplicateGroup {
    readonly key: string;
    readonly rows: readonly number[];
}
export declare class DuplicateDetector {
    find(draws: readonly ParsedDraw[]): readonly DuplicateGroup[];
    createKey(draw: ParsedDraw): string;
}
//# sourceMappingURL=duplicate-detector.d.ts.map