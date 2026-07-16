import type { Layout } from "../domain/layout.js";
import { type CircleLayoutDefinition } from "./circle-layout.js";
import { type GridLayoutDefinition } from "./grid-layout.js";
export type SupportedLayoutDefinition = GridLayoutDefinition | CircleLayoutDefinition;
export declare function createLayout(definition: SupportedLayoutDefinition): Layout;
//# sourceMappingURL=layout-factory.d.ts.map