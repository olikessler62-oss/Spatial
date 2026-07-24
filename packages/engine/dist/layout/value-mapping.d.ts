/**
 * index → lottery value. Length must equal (maximumValue - minimumValue + 1)
 * and contain each value in the range exactly once.
 */
export type ValueMapping = readonly number[];
export declare function hashSeed(seed: string | number): number;
export declare function validateValueMapping(mapping: readonly number[], minimumValue: number, maximumValue: number): void;
/**
 * Deterministic Fisher–Yates shuffle of [minimumValue … maximumValue].
 * Same seed always yields the same permutation.
 */
export declare function createShuffledValueMapping(minimumValue: number, maximumValue: number, seed: string | number): number[];
export declare function buildValueToIndexMap(mapping: readonly number[]): ReadonlyMap<number, number>;
//# sourceMappingURL=value-mapping.d.ts.map