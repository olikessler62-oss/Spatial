export const DEFAULT_ROLLING_WINDOW_CONFIGURATION = {
    windowSizes: [25, 50, 100],
    stepSize: 1,
};
export const DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION = {
    ...DEFAULT_ROLLING_WINDOW_CONFIGURATION,
    includeBoundaryCensoredStreaksInStatistics: false,
    minimumCompletedStreaksForClassification: 2,
    trendWindowCount: 5,
    trendStableSlopeThreshold: 0.05,
    hitRateDeviationThreshold: 0.15,
    streakDeviationThreshold: 0.15,
    shortIntervalScoreThreshold: -2,
    longIntervalScoreThreshold: 2,
    horizonWindowSizes: {
        shortTerm: 25,
        mediumTerm: 50,
        longTerm: 100,
    },
};
//# sourceMappingURL=types.js.map