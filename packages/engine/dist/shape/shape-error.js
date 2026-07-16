export class ShapeError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "ShapeError";
    }
}
//# sourceMappingURL=shape-error.js.map