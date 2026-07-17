export class ExperimentAnalysisError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "ExperimentAnalysisError";
        this.code = code;
        if (details !== undefined) {
            this.details = details;
        }
        Object.setPrototypeOf(this, ExperimentAnalysisError.prototype);
    }
}
//# sourceMappingURL=experiment-analysis-error.js.map