/**
 * Deterministic sequential id generator for tests and reproducible runs.
 */
export class SequentialIdGenerator {
    padWidth;
    counter = 0;
    constructor(padWidth = 3) {
        this.padWidth = padWidth;
    }
    nextId(prefix) {
        this.counter += 1;
        const suffix = String(this.counter).padStart(this.padWidth, "0");
        return `${prefix}-${suffix}`;
    }
}
//# sourceMappingURL=id-generator.js.map