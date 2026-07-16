function positionKey(position) {
    return `${position.x}:${position.y}`;
}
export class LayoutPositionIndex {
    layout;
    indexByCoordinate;
    entryByCoordinate;
    constructor(layout) {
        this.layout = layout;
        const entries = layout.resolveAll();
        const indexByCoordinate = new Map();
        const entryByCoordinate = new Map();
        for (const entry of entries) {
            const key = positionKey(entry.position);
            if (indexByCoordinate.has(key)) {
                throw new Error(`Layout contains duplicate coordinate ${key}.`);
            }
            indexByCoordinate.set(key, entry.index);
            entryByCoordinate.set(key, entry);
        }
        this.indexByCoordinate = indexByCoordinate;
        this.entryByCoordinate = entryByCoordinate;
    }
    getIndex(position) {
        return this.indexByCoordinate.get(positionKey(position));
    }
    getValue(position) {
        return this.entryByCoordinate.get(positionKey(position))?.value;
    }
    get size() {
        return this.indexByCoordinate.size;
    }
}
//# sourceMappingURL=layout-position-index.js.map