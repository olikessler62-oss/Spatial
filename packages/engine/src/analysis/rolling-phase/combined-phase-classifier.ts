import type {
  CombinedPhaseAssessment,
  CombinedPhasePattern,
  NumberPhaseType,
  PhaseWindowAssessment,
} from "./types.js";

function isIntervalPhase(
  phase: NumberPhaseType | undefined,
): phase is "short-interval" | "normal" | "long-interval" {
  return (
    phase === "short-interval"
    || phase === "normal"
    || phase === "long-interval"
  );
}

export function classifyCombinedPhase(options: {
  readonly shortTerm: PhaseWindowAssessment | null;
  readonly mediumTerm: PhaseWindowAssessment | null;
  readonly longTerm: PhaseWindowAssessment | null;
}): CombinedPhaseAssessment {
  const short = options.shortTerm?.phaseType;
  const medium = options.mediumTerm?.phaseType;
  const long = options.longTerm?.phaseType;
  const present = [short, medium, long].filter(
    (phase): phase is NumberPhaseType => phase !== undefined,
  );

  if (
    present.length === 0
    || present.every((phase) => phase === "insufficient-data")
  ) {
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

  if (
    isIntervalPhase(short)
    && short === medium
    && medium === long
  ) {
    const pattern: CombinedPhasePattern =
      short === "short-interval"
        ? "aligned-short-interval"
        : short === "long-interval"
          ? "aligned-long-interval"
          : "aligned-normal";

    return {
      pattern,
      explanationKeys: [`combined.${pattern}`],
    };
  }

  if (
    short === "long-interval"
    && medium !== "long-interval"
    && long !== "long-interval"
  ) {
    return {
      pattern: "short-term-deviation",
      explanationKeys: ["combined.short-term-deviation"],
    };
  }

  if (
    short === "short-interval"
    && medium !== "short-interval"
    && long !== "short-interval"
  ) {
    return {
      pattern: "short-term-deviation",
      explanationKeys: ["combined.short-term-deviation"],
    };
  }

  if (
    medium === "transition"
    || (short !== medium && medium !== long && short === "transition")
  ) {
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
