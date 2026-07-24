-- Project Spatial
-- Migration: 20260721093000_user_patterns.sql
-- Purpose: Per-user overview pattern definitions (cells JSON) for Muster-Vergleich.

begin;

create table if not exists analysis.user_patterns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lottery_id uuid references core.lotteries(id) on delete set null,
  name text not null,
  grid_size integer not null default 7,
  cells jsonb not null,
  source text not null default 'custom',
  preset_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_patterns_name_not_blank check (btrim(name) <> ''),
  constraint user_patterns_grid_size_positive check (grid_size > 0 and grid_size <= 16),
  constraint user_patterns_cells_array check (jsonb_typeof(cells) = 'array'),
  constraint user_patterns_source_valid check (source in ('custom', 'preset'))
);

create index if not exists user_patterns_owner_idx
  on analysis.user_patterns (owner_id, updated_at desc);

create index if not exists user_patterns_lottery_idx
  on analysis.user_patterns (lottery_id)
  where lottery_id is not null;

alter table analysis.user_patterns enable row level security;

drop policy if exists "user_patterns_select_own" on analysis.user_patterns;
create policy "user_patterns_select_own"
on analysis.user_patterns
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "user_patterns_insert_own" on analysis.user_patterns;
create policy "user_patterns_insert_own"
on analysis.user_patterns
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "user_patterns_update_own" on analysis.user_patterns;
create policy "user_patterns_update_own"
on analysis.user_patterns
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "user_patterns_delete_own" on analysis.user_patterns;
create policy "user_patterns_delete_own"
on analysis.user_patterns
for delete
to authenticated
using (owner_id = auth.uid());

grant select, insert, update, delete on analysis.user_patterns to authenticated;
grant all on analysis.user_patterns to service_role;

commit;
