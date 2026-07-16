export class LayoutError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "LayoutError";
    }
}
//# sourceMappingURL=layout-error.js.map