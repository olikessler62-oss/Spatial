export async function persistImportReport(repository, command) {
    if (command.report.rejectedRows > 0) {
        throw new Error("ImportReport contains rejected rows and cannot be persisted atomically.");
    }
    return repository.persistVersion({
        datasetId: command.datasetId,
        ruleSetId: command.ruleSetId,
        contentHash: command.contentHash,
        draws: command.report.acceptedDraws,
    });
}
//# sourceMappingURL=persist-import-report.js.map