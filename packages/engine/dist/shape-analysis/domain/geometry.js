export function isRectangleGeometry(geometry) {
    return ("originRow" in geometry &&
        "originColumn" in geometry &&
        "width" in geometry &&
        "height" in geometry);
}
//# sourceMappingURL=geometry.js.map