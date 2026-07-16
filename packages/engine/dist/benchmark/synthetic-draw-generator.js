import { BitMask } from "../indexing/bit-mask.js";
export class SyntheticDrawGenerator {
    generate(options) {
        this.validateOptions(options);
        const random = this.createRandom(options.seed ?? 42);
        const draws = [];
        for (let drawIndex = 0; drawIndex < options.drawCount; drawIndex += 1) {
            const indices = new Set();
            while (indices.size < options.numbersPerDraw) {
                indices.add(Math.floor(random() * options.layoutSize));
            }
            draws.push({
                drawDate: this.createDate(drawIndex),
                externalId: `synthetic-${drawIndex + 1}`,
                mask: BitMask.fromIndices([...indices]),
                drawnValueCount: indices.size,
            });
        }
        return draws;
    }
    validateOptions(options) {
        if (!Number.isInteger(options.drawCount) || options.drawCount < 0) {
            throw new Error("drawCount must be a non-negative integer.");
        }
        if (!Number.isInteger(options.layoutSize) || options.layoutSize <= 0) {
            throw new Error("layoutSize must be a positive integer.");
        }
        if (!Number.isInteger(options.numbersPerDraw)
            || options.numbersPerDraw <= 0
            || options.numbersPerDraw > options.layoutSize) {
            throw new Error("numbersPerDraw must be between 1 and layoutSize.");
        }
    }
    createRandom(seed) {
        let state = seed >>> 0;
        return () => {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 0x100000000;
        };
    }
    createDate(index) {
        const date = new Date(Date.UTC(2000, 0, 1 + index));
        return date.toISOString().slice(0, 10);
    }
}
//# sourceMappingURL=synthetic-draw-generator.js.map