# Spatial Engine v0.2 — Import Pipeline

This increment adds:

- `CsvImportService`
- structured `ImportReport`
- accepted and rejected draw separation
- row-level validation issues
- normalized duplicate detection
- unit tests for the full import workflow

## Merge

Copy the included `packages/engine` directory over the existing one.

No files outside `packages/engine` are changed.

## Test

```powershell
cd packages/engine
npm test
npm run typecheck
npm run build
```
