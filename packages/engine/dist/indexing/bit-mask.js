export class BitMask {
    value;
    constructor(value) {
        this.value = value;
    }
    static empty() {
        return new BitMask(0n);
    }
    static fromIndices(indices) {
        let value = 0n;
        for (const index of indices) {
            if (!Number.isInteger(index) || index < 0) {
                throw new Error(`Bit index must be a non-negative integer. Received ${index}.`);
            }
            value |= 1n << BigInt(index);
        }
        return new BitMask(value);
    }
    has(index) {
        if (!Number.isInteger(index) || index < 0) {
            return false;
        }
        return (this.value & (1n << BigInt(index))) !== 0n;
    }
    intersects(other) {
        return (this.value & other.value) !== 0n;
    }
    intersection(other) {
        return new BitMask(this.value & other.value);
    }
    union(other) {
        return new BitMask(this.value | other.value);
    }
    contains(other) {
        return (this.value & other.value) === other.value;
    }
    count() {
        let remaining = this.value;
        let count = 0;
        while (remaining !== 0n) {
            remaining &= remaining - 1n;
            count += 1;
        }
        return count;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value.toString(16);
    }
}
//# sourceMappingURL=bit-mask.js.map