import type { RollingWindowRange } from "./types.js";

/**
 * Builds inclusive index ranges for rolling windows over a chronological series.
 * Indices are 0-based into an oldest→newest draw array.
 */
export function buildRollingWindows(
  drawCount: number,
  windowSize: number,
  stepSize: number,
): readonly RollingWindowRange[] {
  if (
    drawCount <= 0
    || windowSize <= 0
    || stepSize <= 0
    || !Number.isFinite(drawCount)
    || !Number.isFinite(windowSize)
    || !Number.isFinite(stepSize)
  ) {
    return [];
  }

  if (windowSize > drawCount) {
    return [];
  }

  const windows: RollingWindowRange[] = [];

  for (
    let start = 0;
    start + windowSize - 1 < drawCount;
    start += stepSize
  ) {
    const end = start + windowSize - 1;
    windows.push({
      windowSize,
      windowStartIndex: start,
      windowEndIndex: end,
      drawCount: windowSize,
    });
  }

  return windows;
}
