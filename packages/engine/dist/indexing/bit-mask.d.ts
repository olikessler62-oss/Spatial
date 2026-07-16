export declare class BitMask {
    readonly value: bigint;
    constructor(value: bigint);
    static empty(): BitMask;
    static fromIndices(indices: readonly number[]): BitMask;
    has(index: number): boolean;
    intersects(other: BitMask): boolean;
    intersection(other: BitMask): BitMask;
    union(other: BitMask): BitMask;
    contains(other: BitMask): boolean;
    count(): number;
    equals(other: BitMask): boolean;
    toString(): string;
}
//# sourceMappingURL=bit-mask.d.ts.map