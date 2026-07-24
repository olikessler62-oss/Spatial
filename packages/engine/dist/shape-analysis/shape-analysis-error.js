export class ShapeAnalysisError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "ShapeAnalysisError";
        this.code = code;
        if (details !== undefined) {
            this.details = details;
        }
        Object.setPrototypeOf(this, ShapeAnalysisError.prototype);
    }
}
//# sourceMappingURL=shape-analysis-error.js.map