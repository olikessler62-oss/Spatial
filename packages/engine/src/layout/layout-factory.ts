import type { Layout } from "../domain/layout.js";
import { CircleLayout, type CircleLayoutDefinition } from "./circle-layout.js";
import { GridLayout, type GridLayoutDefinition } from "./grid-layout.js";

export type SupportedLayoutDefinition = GridLayoutDefinition | CircleLayoutDefinition;

export function createLayout(definition: SupportedLayoutDefinition): Layout {
  switch (definition.type) {
    case "grid": return new GridLayout(definition);
    case "circle": return new CircleLayout(definition);
  }
}
