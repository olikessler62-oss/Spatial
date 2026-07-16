# Spatial Engine

Initial implementation of the Project Spatial import pipeline.

## Current scope

- Parse CSV draw data
- Normalize ISO draw dates
- Parse main and bonus number pools
- Validate counts, uniqueness and number ranges
- Run deterministic unit tests

No Supabase dependency is included yet.

## Install and run

From `packages/engine`:

```powershell
npm install
npm test
npm run typecheck
npm run build
```
