export class DuplicateDetector {
    find(draws) {
        const rowsByKey = new Map();
        for (const draw of draws) {
            const key = this.createKey(draw);
            const rows = rowsByKey.get(key) ?? [];
            rows.push(draw.sourceRow);
            rowsByKey.set(key, rows);
        }
        return [...rowsByKey.entries()]
            .filter(([, rows]) => rows.length > 1)
            .map(([key, rows]) => ({ key, rows }));
    }
    createKey(draw) {
        const mainNumbers = [...draw.mainNumbers].sort((a, b) => a - b).join("-");
        const bonusNumbers = [...draw.bonusNumbers].sort((a, b) => a - b).join("-");
        return [
            draw.drawDate,
            mainNumbers,
            bonusNumbers,
            draw.externalId ?? "",
        ].join("|");
    }
}
//# sourceMappingURL=duplicate-detector.js.map