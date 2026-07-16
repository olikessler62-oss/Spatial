import type { Layout, ResolvedLayoutValue } from "../domain/layout.js";

export interface SerializedLayout {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly minimumValue: number;
  readonly maximumValue: number;
  readonly positions: readonly ResolvedLayoutValue[];
}

export function serializeLayout(layout: Layout): SerializedLayout {
  return {
    id: layout.definition.id,
    name: layout.definition.name,
    type: layout.definition.type,
    minimumValue: layout.definition.minimumValue,
    maximumValue: layout.definition.maximumValue,
    positions: layout.resolveAll(),
  };
}
