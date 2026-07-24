/**
 * High-contrast hues spaced around the wheel so neighboring shapes stay distinct.
 */
export const SHAPE_COLOR_PALETTE = [
    { hue: 8, saturation: 82, baseLightness: 54 },
    { hue: 32, saturation: 88, baseLightness: 52 },
    { hue: 48, saturation: 90, baseLightness: 50 },
    { hue: 95, saturation: 72, baseLightness: 44 },
    { hue: 145, saturation: 68, baseLightness: 42 },
    { hue: 172, saturation: 74, baseLightness: 44 },
    { hue: 195, saturation: 80, baseLightness: 50 },
    { hue: 215, saturation: 82, baseLightness: 56 },
    { hue: 245, saturation: 76, baseLightness: 58 },
    { hue: 275, saturation: 72, baseLightness: 56 },
    { hue: 300, saturation: 74, baseLightness: 54 },
    { hue: 330, saturation: 78, baseLightness: 56 },
];
function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
/**
 * Deterministic palette color from a seed (prefer geometryKey over sequential ids).
 */
export function getShapeVisualColor(seed) {
    const hash = hashString(seed);
    return SHAPE_COLOR_PALETTE[hash % SHAPE_COLOR_PALETTE.length];
}
/**
 * Assigns distinct palette colors within one analysis (no two shapes share a
 * color until the palette wraps). Seeds are typically geometry keys.
 */
export function assignDistinctShapeColors(seeds) {
    const unique = [...new Set(seeds)].sort((a, b) => a.localeCompare(b));
    const bySeed = new Map();
    for (let index = 0; index < unique.length; index += 1) {
        const seed = unique[index];
        bySeed.set(seed, SHAPE_COLOR_PALETTE[index % SHAPE_COLOR_PALETTE.length]);
    }
    return bySeed;
}
export function getShapeColorKey(seed) {
    const color = getShapeVisualColor(seed);
    return `hsl:${color.hue}:${color.saturation}:${color.baseLightness}`;
}
export function resolveShapeCssColor(color, brightnessLevel) {
    const clamped = Math.min(1, Math.max(0, brightnessLevel));
    // Keep hue/sat; longer streaks → lighter / more vivid on dark UI
    const lightness = color.baseLightness + clamped * 22;
    const saturation = Math.min(100, color.saturation + clamped * 8);
    return `hsl(${color.hue} ${saturation}% ${lightness}%)`;
}
//# sourceMappingURL=shape-color.js.map