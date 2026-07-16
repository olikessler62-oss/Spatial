# Spatial Engine v0.4 — Seed + Import CLI

## What this increment adds

- deterministic Lotto 6aus49 seed records,
- a public PostgREST wrapper for the atomic import RPC,
- a server-side CSV import CLI,
- SHA-256 content hashing,
- duplicate detection before persistence,
- a sample CSV file.

## 1. Merge

Copy the included `packages`, `supabase` and `datasets` directories into the
repository root.

## 2. Install and test

```powershell
cd packages/engine
npm install
npm test
npm run typecheck
npm run build
```

## 3. Push the migration

From the repository root:

```powershell
npx supabase migration list
npx supabase db push
```

## 4. Configure local secrets

Inside `packages/engine`:

```powershell
Copy-Item .env.example .env
```

Fill in:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_SIDE_SERVICE_ROLE_KEY
```

Never commit `.env`.

## 5. Run the first real import

From `packages/engine`:

```powershell
npm run import:csv -- --file ../../datasets/samples/lotto-6aus49.csv
```

Default seeded IDs:

```text
Lottery:       11111111-1111-4111-8111-111111111111
Rule set:      22222222-2222-4222-8222-222222222222
Dataset:       33333333-3333-4333-8333-333333333333
```

## Expected result

The CLI prints JSON containing the content hash and the newly created
DatasetVersion. Supabase should then contain:

- one new row in `core.dataset_versions`,
- three new rows in `core.draws`,
- eighteen rows in `core.draw_main_values`,
- three rows in `core.draw_bonus_values`.

Running the same file again is rejected through its content hash.
