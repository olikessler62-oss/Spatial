import type { ShapeBrightnessConfiguration } from "./visualization-types.js";

/**
 * Colors stay at a fixed brightness — streak length only affects
 * edge dominance / stroke weight, not hue lightness.
 */
export function computeShapeBrightnessLevel(
  _distanceFromSelectedCard: number,
  _coveredCardCount: number,
  configuration: ShapeBrightnessConfiguration,
): number {
  return configuration.maxBrightness;
}
