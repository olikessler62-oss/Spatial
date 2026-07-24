/**
 * Colors stay at a fixed brightness — streak length only affects
 * edge dominance / stroke weight, not hue lightness.
 */
export function computeShapeBrightnessLevel(_distanceFromSelectedCard, _coveredCardCount, configuration) {
    return configuration.maxBrightness;
}
//# sourceMappingURL=shape-brightness.js.map