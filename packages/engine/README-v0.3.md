# Spatial Engine v0.3 — Supabase Repository

This increment adds:

- a database-independent `DatasetRepository`,
- `SupabaseDatasetRepository`,
- atomic persistence through `api.import_dataset_version`,
- service-role client factory,
- tests with a mocked Supabase client,
- a new Supabase migration.

## Merge

Copy both included directories into the repository root:

```text
packages/
supabase/
```

## Install and test

```powershell
cd packages/engine
npm install
npm test
npm run typecheck
npm run build
```

## Deploy the database function

From the repository root:

```powershell
npx supabase migration list
npx supabase db push
```

## Security

The service-role key bypasses RLS and must only be used in trusted server-side
code, CLI tools, background workers or Edge Functions. Never expose it in a
browser, desktop renderer or mobile client.

## Generated database types

`src/supabase/database.types.ts` is intentionally minimal in v0.3. Replace it
later with generated linked-project types:

```powershell
npx supabase gen types typescript --linked > packages/engine/src/supabase/database.types.ts
```
