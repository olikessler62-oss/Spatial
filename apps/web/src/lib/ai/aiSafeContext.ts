import type { Overview1SelectionState } from "@/lib/overview/overview1LocalState";

/**
 * Structured context that may later be embedded in LLM prompts.
 *
 * Rules:
 * - Only build this from already-validated app state (never from raw URL/body text).
 * - Contains no free-text user instructions — only IDs and enums.
 * - If AI is added, pass this object (or JSON of it) as *data*, not as system instructions.
 */
export type AiSafeAnalysisContext = {
  readonly schemaVersion: 1;
  readonly lotteryId: string;
  readonly layoutId: string;
};

export function buildAiSafeAnalysisContext(
  state: Overview1SelectionState,
): AiSafeAnalysisContext | null {
  if (!state.lotteryId || !state.layoutId) {
    return null;
  }

  return {
    schemaVersion: 1,
    lotteryId: state.lotteryId,
    layoutId: state.layoutId,
  };
}

/**
 * Serialize for a future model call. Output is JSON data only —
 * do not concatenate into natural-language system prompts.
 */
export function serializeAiSafeAnalysisContext(
  context: AiSafeAnalysisContext,
): string {
  return JSON.stringify(context);
}
