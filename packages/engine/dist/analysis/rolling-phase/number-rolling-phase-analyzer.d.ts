import type { ParsedDraw } from "../../domain/parsed-draw.js";
import { type ChronologicalDrawRef, type GlobalNumberStatistics, type NumberRollingPhaseAnalysis, type RollingNumberWindowAnalysis, type RollingPhaseAnalysisConfiguration } from "./types.js";
export declare function buildGlobalNumberStatistics(number: number, hits: readonly boolean[]): GlobalNumberStatistics;
export declare function analyzeNumberWindow(number: number, hits: readonly boolean[], hitPrefix: readonly number[], draws: readonly ChronologicalDrawRef[], windowStartIndex: number, windowEndIndex: number, windowSize: number, global: GlobalNumberStatistics, includeBoundaryCensoredStreaksInStatistics: boolean): RollingNumberWindowAnalysis;
/**
 * Full rolling-phase analysis for one lottery number.
 * Draws are sorted oldest→newest regardless of UI order.
 */
export declare function analyzeNumberRollingPhase(number: number, draws: readonly ChronologicalDrawRef[], configuration?: RollingPhaseAnalysisConfiguration): NumberRollingPhaseAnalysis;
/**
 * Analyze every number in `[minimum, maximum]` independently.
 */
export declare function analyzeAllNumbersRollingPhase(draws: readonly ParsedDraw[] | readonly ChronologicalDrawRef[], options?: {
    readonly minimumNumber?: number;
    readonly maximumNumber?: number;
    readonly numbers?: readonly number[];
    readonly configuration?: RollingPhaseAnalysisConfiguration;
}): readonly NumberRollingPhaseAnalysis[];
//# sourceMappingURL=number-rolling-phase-analyzer.d.ts.map