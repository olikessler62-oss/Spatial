export class ShapePlacementGenerator {
    resolver;
    constructor(resolver) {
        this.resolver = resolver;
    }
    generate(shape, layout) {
        return layout
            .resolveAll()
            .map((entry) => this.resolver.resolve(shape, layout, entry.value))
            .filter((placement) => placement.isValid);
    }
}
//# sourceMappingURL=shape-placement-generator.js.map