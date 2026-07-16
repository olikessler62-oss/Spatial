export function serializeLayout(layout) {
    return {
        id: layout.definition.id,
        name: layout.definition.name,
        type: layout.definition.type,
        minimumValue: layout.definition.minimumValue,
        maximumValue: layout.definition.maximumValue,
        positions: layout.resolveAll(),
    };
}
//# sourceMappingURL=layout-serializer.js.map