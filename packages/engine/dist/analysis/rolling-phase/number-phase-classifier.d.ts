import type { NumberPhaseType, PhaseWindowAssessment, RollingPhaseAnalysisConfiguration, RollingNumberWindowAnalysis, WindowGlobalComparison, WindowMetricTrend } from "./types.js";
export interface PhaseClassificationInput {
    readonly windowSize: number;
    readonly window: RollingNumberWindowAnalysis;
    readonly comparisonToGlobal: WindowGlobalComparison;
    readonly hitRateTrend: WindowMetricTrend;
    readonly medianMissStreakTrend: WindowMetricTrend;
    readonly previousPhaseTypes: readonly NumberPhaseType[];
    readonly configuration: RollingPhaseAnalysisConfiguration;
}
/**
 * Descriptive phase classification (not a prediction).
 * Scores long-interval evidence; strong trends → transition.
 */
export declare function classifyNumberPhase(input: PhaseClassificationInput): PhaseWindowAssessment;
//# sourceMappingURL=number-phase-classifier.d.ts.map