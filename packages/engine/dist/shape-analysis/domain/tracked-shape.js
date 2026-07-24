export function coveredCardCount(previousCardCount) {
    return previousCardCount + 1;
}
/**
 * Spec 3: a child discovered at sequence index i starts with
 * previousCardCount = i (distance from the selected card).
 */
export function initialChildPreviousCardCount(discoverySequenceIndex) {
    return discoverySequenceIndex;
}
/**
 * @deprecated Prefer initialChildPreviousCardCount(discoverySequenceIndex).
 * Kept for Spec 1 wording where discovery index equals parent count at split.
 */
export function inheritPreviousCardCount(parent) {
    return parent.previousCardCount;
}
export function createAnalysisBoundaryOutcome(previousCardCount) {
    return {
        status: "analysis-boundary",
        terminationReason: "analysis-window-exhausted",
        isCompleteRun: false,
        previousCardCount,
        coveredCardCount: coveredCardCount(previousCardCount),
    };
}
//# sourceMappingURL=tracked-shape.js.map