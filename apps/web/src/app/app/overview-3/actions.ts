"use server";

import {
  analyzeAllNumbersRollingPhase,
  DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
  type NumberRollingPhaseAnalysis,
} from "@spatial/engine";

import { loadOverview3Draws } from "@/lib/overview/loadOverview3Draws";
import { parseTrustedUuid } from "@/lib/security/trustedIds";

export interface Overview3AnalysisPayload {
  readonly drawCount: number;
  readonly minimumNumber: number;
  readonly maximumNumber: number;
  readonly analyses: readonly NumberRollingPhaseAnalysis[];
}

export async function fetchOverview3PhaseAnalyses(options: {
  readonly lotteryIdRaw: string;
  readonly minimumNumber: number;
  readonly maximumNumber: number;
}): Promise<Overview3AnalysisPayload | { readonly error: string }> {
  const lotteryId = parseTrustedUuid(options.lotteryIdRaw);
  if (!lotteryId) {
    return { error: "Ungültige Lotterie-ID." };
  }

  try {
    const draws = await loadOverview3Draws(lotteryId);
    const analyses = analyzeAllNumbersRollingPhase(draws, {
      minimumNumber: options.minimumNumber,
      maximumNumber: options.maximumNumber,
      configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
    });

    return {
      drawCount: draws.length,
      minimumNumber: options.minimumNumber,
      maximumNumber: options.maximumNumber,
      analyses,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Phasenanalyse konnte nicht geladen werden.",
    };
  }
}
