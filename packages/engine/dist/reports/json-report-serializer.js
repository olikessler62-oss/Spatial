export class JsonReportSerializer {
    serialize(report, options = {}) {
        return JSON.stringify(report, null, options.pretty === true ? 2 : undefined);
    }
}
//# sourceMappingURL=json-report-serializer.js.map