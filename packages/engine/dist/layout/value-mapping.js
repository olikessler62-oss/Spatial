import { LayoutError } from "./layout-error.js";
export function hashSeed(seed) {
    const text = String(seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
export function validateValueMapping(mapping, minimumValue, maximumValue) {
    const expectedSize = maximumValue - minimumValue + 1;
    if (mapping.length !== expectedSize) {
        throw new LayoutError(`valueMapping length ${mapping.length} does not match range size ${expectedSize}.`, "INVALID_VALUE_MAPPING");
    }
    const seen = new Set();
    for (const value of mapping) {
        if (!Number.isInteger(value)) {
            throw new LayoutError(`valueMapping contains non-integer value ${value}.`, "INVALID_VALUE_MAPPING");
        }
        if (value < minimumValue || value > maximumValue) {
            throw new LayoutError(`valueMapping value ${value} is outside ${minimumValue}-${maximumValue}.`, "INVALID_VALUE_MAPPING");
        }
        if (seen.has(value)) {
            throw new LayoutError(`valueMapping contains duplicate value ${value}.`, "INVALID_VALUE_MAPPING");
        }
        seen.add(value);
    }
}
/**
 * Deterministic Fisher–Yates shuffle of [minimumValue … maximumValue].
 * Same seed always yields the same permutation.
 */
export function createShuffledValueMapping(minimumValue, maximumValue, seed) {
    if (minimumValue > maximumValue) {
        throw new LayoutError("minimumValue must not be greater than maximumValue.", "INVALID_VALUE_RANGE");
    }
    const values = Array.from({ length: maximumValue - minimumValue + 1 }, (_, index) => minimumValue + index);
    let state = hashSeed(seed);
    for (let index = values.length - 1; index > 0; index -= 1) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const swapIndex = state % (index + 1);
        const current = values[index];
        values[index] = values[swapIndex];
        values[swapIndex] = current;
    }
    return values;
}
export function buildValueToIndexMap(mapping) {
    const valueToIndex = new Map();
    for (let index = 0; index < mapping.length; index += 1) {
        valueToIndex.set(mapping[index], index);
    }
    return valueToIndex;
}
//# sourceMappingURL=value-mapping.js.map