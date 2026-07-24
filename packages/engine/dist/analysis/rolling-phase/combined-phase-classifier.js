function isIntervalPhase(phase) {
    return (phase === "short-interval"
        || phase === "normal"
        || phase === "long-interval");
}
export function classifyCombinedPhase(options) {
    const short = options.shortTerm?.phaseType;
    const medium = options.mediumTerm?.phaseType;
    const long = options.longTerm?.phaseType;
    const present = [short, medium, long].filter((phase) => phase !== undefined);
    if (present.length === 0
        || present.every((phase) => phase === "insufficient-data")) {
        return {
            pattern: "insufficient-data",
            explanationKeys: ["combined.insufficient-data"],
        };
    }
    const usable = present.filter((phase) => phase !== "insufficient-data");
    if (usable.length === 0) {
        return {
            pattern: "insufficient-data",
            explanationKeys: ["combined.insufficient-data"],
        };
    }
    if (isIntervalPhase(short)
        && short === medium
        && medium === long) {
        const pattern = short === "short-interval"
            ? "aligned-short-interval"
            : short === "long-interval"
                ? "aligned-long-interval"
                : "aligned-normal";
        return {
            pattern,
            explanationKeys: [`combined.${pattern}`],
        };
    }
    if (short === "long-interval"
        && medium !== "long-interval"
        && long !== "long-interval") {
        return {
            pattern: "short-term-deviation",
            explanationKeys: ["combined.short-term-deviation"],
        };
    }
    if (short === "short-interval"
        && medium !== "short-interval"
        && long !== "short-interval") {
        return {
            pattern: "short-term-deviation",
            explanationKeys: ["combined.short-term-deviation"],
        };
    }
    if (medium === "transition"
        || (short !== medium && medium !== long && short === "transition")) {
        return {
            pattern: "medium-term-transition",
            explanationKeys: ["combined.medium-term-transition"],
        };
    }
    return {
        pattern: "mixed-time-horizons",
        explanationKeys: ["combined.mixed-time-horizons"],
    };
}
//# sourceMappingURL=combined-phase-classifier.js.map