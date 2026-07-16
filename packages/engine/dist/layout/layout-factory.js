import { CircleLayout } from "./circle-layout.js";
import { GridLayout } from "./grid-layout.js";
export function createLayout(definition) {
    switch (definition.type) {
        case "grid": return new GridLayout(definition);
        case "circle": return new CircleLayout(definition);
    }
}
//# sourceMappingURL=layout-factory.js.map