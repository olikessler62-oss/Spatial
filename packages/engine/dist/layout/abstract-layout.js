import { LayoutError } from "./layout-error.js";
export class AbstractLayout {
    definition;
    constructor(definition) {
        this.definition = definition;
        if (definition.minimumValue > definition.maximumValue) {
            throw new LayoutError("minimumValue must not be greater than maximumValue.", "INVALID_VALUE_RANGE");
        }
    }
    resolve(value) {
        if (!Number.isInteger(value)) {
            throw new LayoutError(`Layout values must be integers. Received ${value}.`, "NON_INTEGER_VALUE");
        }
        if (value < this.definition.minimumValue || value > this.definition.maximumValue) {
            throw new LayoutError(`Value ${value} is outside ${this.definition.minimumValue}-${this.definition.maximumValue}.`, "VALUE_OUT_OF_RANGE");
        }
        const index = value - this.definition.minimumValue;
        return { value, index, position: this.resolveIndex(index) };
    }
    resolveAll() {
        const result = [];
        for (let value = this.definition.minimumValue; value <= this.definition.maximumValue; value += 1) {
            result.push(this.resolve(value));
        }
        return result;
    }
}
//# sourceMappingURL=abstract-layout.js.map