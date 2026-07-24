export function findProbabilityAtLeast(runLength, survivalDistribution) {
    if (survivalDistribution.length === 0) {
        return null;
    }
    const exact = survivalDistribution.find((entry) => entry.runLength === runLength);
    if (exact !== undefined) {
        return exact.probabilityAtLeast;
    }
    const maxHistorical = Math.max(...survivalDistribution.map((entry) => entry.runLength));
    if (runLength > maxHistorical) {
        return 0;
    }
    // For lengths below the first entry (usually 1), use the first probability.
    const first = survivalDistribution[0];
    if (first !== undefined && runLength < first.runLength) {
        return first.probabilityAtLeast;
    }
    // Between known lengths: use next higher or equal entry's count semantics —
    // prefer nearest lower-or-equal survival length.
    let best;
    for (const entry of survivalDistribution) {
        if (entry.runLength <= runLength) {
            best = entry;
        }
    }
    return best?.probabilityAtLeast ?? 0;
}
export function compareAgainstModes(currentRunLength, modeRunLengths, modeFrequency) {
    const sorted = [...modeRunLengths].sort((a, b) => a - b);
    const minMode = sorted[0];
    const maxMode = sorted[sorted.length - 1];
    let relation;
    if (sorted.includes(currentRunLength)) {
        relation = "matches-mode";
    }
    else if (currentRunLength < minMode) {
        relation = "below-all-modes";
    }
    else if (currentRunLength > maxMode) {
        relation = "above-all-modes";
    }
    else {
        relation = "between-modes";
    }
    const distanceToNearestMode = Math.min(...sorted.map((mode) => Math.abs(mode - currentRunLength)));
    return {
        modeRunLengths: sorted,
        modeFrequency,
        relation,
        distanceToNearestMode,
    };
}
export function compareAgainstMedian(currentRunLength, medianRunLength) {
    return {
        medianRunLength,
        difference: currentRunLength - medianRunLength,
        ratio: medianRunLength === 0 ? 0 : currentRunLength / medianRunLength,
    };
}
export function compareAgainstAverage(currentRunLength, averageRunLength) {
    return {
        averageRunLength,
        difference: currentRunLength - averageRunLength,
        ratio: averageRunLength === 0 ? 0 : currentRunLength / averageRunLength,
    };
}
export function compareAgainstMaximum(currentRunLength, maximumRunLength) {
    let relation;
    if (currentRunLength > maximumRunLength) {
        relation = "exceeds-maximum";
    }
    else if (currentRunLength === maximumRunLength) {
        relation = "matches-maximum";
    }
    else {
        relation = "below-maximum";
    }
    return {
        maximumRunLength,
        difference: currentRunLength - maximumRunLength,
        relation,
    };
}
//# sourceMappingURL=shape-run-comparison.js.map