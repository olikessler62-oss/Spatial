import { isEmptyRectangle } from "./hit-prefix-sum.js";
import { compareRectangles, createRectangleGeometryKey, rectangleCellCount, } from "./rectangle-geometry.js";
/**
 * True when the rectangle cannot expand in any direction within searchArea
 * without including a hit or leaving the search area.
 */
export function isMaximalEmptyRectangle(geometry, searchArea, prefixSum) {
    const searchEndRow = searchArea.originRow + searchArea.height;
    const searchEndColumn = searchArea.originColumn + searchArea.width;
    const endRow = geometry.originRow + geometry.height;
    const endColumn = geometry.originColumn + geometry.width;
    // Expand up
    if (geometry.originRow > searchArea.originRow) {
        const expanded = {
            originRow: geometry.originRow - 1,
            originColumn: geometry.originColumn,
            width: geometry.width,
            height: 1,
        };
        if (isEmptyRectangle(prefixSum, expanded)) {
            return false;
        }
    }
    // Expand down
    if (endRow < searchEndRow) {
        const expanded = {
            originRow: endRow,
            originColumn: geometry.originColumn,
            width: geometry.width,
            height: 1,
        };
        if (isEmptyRectangle(prefixSum, expanded)) {
            return false;
        }
    }
    // Expand left
    if (geometry.originColumn > searchArea.originColumn) {
        const expanded = {
            originRow: geometry.originRow,
            originColumn: geometry.originColumn - 1,
            width: 1,
            height: geometry.height,
        };
        if (isEmptyRectangle(prefixSum, expanded)) {
            return false;
        }
    }
    // Expand right
    if (endColumn < searchEndColumn) {
        const expanded = {
            originRow: geometry.originRow,
            originColumn: endColumn,
            width: 1,
            height: geometry.height,
        };
        if (isEmptyRectangle(prefixSum, expanded)) {
            return false;
        }
    }
    return true;
}
export class MaximalEmptyRectangleFinder {
    find(prefixSum, searchArea, minimumCellCount) {
        const searchEndRowExclusive = searchArea.originRow + searchArea.height;
        const searchEndColumnExclusive = searchArea.originColumn + searchArea.width;
        const candidates = [];
        for (let topRow = searchArea.originRow; topRow < searchEndRowExclusive; topRow += 1) {
            for (let bottomRow = topRow; bottomRow < searchEndRowExclusive; bottomRow += 1) {
                for (let leftColumn = searchArea.originColumn; leftColumn < searchEndColumnExclusive; leftColumn += 1) {
                    for (let rightColumn = leftColumn; rightColumn < searchEndColumnExclusive; rightColumn += 1) {
                        const width = rightColumn - leftColumn + 1;
                        const height = bottomRow - topRow + 1;
                        if (width * height < minimumCellCount) {
                            continue;
                        }
                        const geometry = {
                            originRow: topRow,
                            originColumn: leftColumn,
                            width,
                            height,
                        };
                        if (!isEmptyRectangle(prefixSum, geometry)) {
                            continue;
                        }
                        if (!isMaximalEmptyRectangle(geometry, searchArea, prefixSum)) {
                            continue;
                        }
                        candidates.push(geometry);
                    }
                }
            }
        }
        const unique = new Map();
        for (const geometry of candidates) {
            unique.set(createRectangleGeometryKey(geometry), geometry);
        }
        return [...unique.values()].sort(compareRectangles);
    }
}
export function fullGridSearchArea(rowCount, columnCount) {
    return {
        originRow: 0,
        originColumn: 0,
        width: columnCount,
        height: rowCount,
    };
}
export { rectangleCellCount };
//# sourceMappingURL=maximal-empty-rectangle-finder.js.map