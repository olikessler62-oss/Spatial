-- Project Spatial
-- Migration: 20260716162000_seed_reference_data_and_public_import_rpc.sql
--
-- Adds:
-- - deterministic Lotto 6aus49 reference data for the first E2E import,
-- - a public-schema RPC wrapper so PostgREST can invoke the atomic api function
--   without exposing the complete api schema.

begin;

-- ---------------------------------------------------------------------------
-- Initial reference data
-- ---------------------------------------------------------------------------

insert into core.lotteries (
  id,
  slug,
  name,
  country_code,
  operator_name,
  is_active
)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'lotto-6aus49-de',
  'Lotto 6 aus 49',
  'DE',
  'Reference Seed',
  true
)
on conflict (id) do nothing;

insert into core.lottery_rule_sets (
  id,
  lottery_id,
  version,
  valid_from,
  valid_to,
  main_value_min,
  main_value_max,
  main_value_count,
  bonus_rules,
  draw_schedule
)
values (
  '22222222-2222-4222-8222-222222222222'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  1,
  date '2026-01-01',
  null,
  1,
  49,
  6,
  jsonb_build_object(
    'type', 'superzahl',
    'minimum', 0,
    'maximum', 9,
    'count', 1
  ),
  jsonb_build_object(
    'timezone', 'Europe/Berlin',
    'days', jsonb_build_array('Wednesday', 'Saturday')
  )
)
on conflict (id) do nothing;

insert into core.datasets (
  id,
  lottery_id,
  slug,
  name,
  description,
  visibility,
  created_by
)
values (
  '33333333-3333-4333-8333-333333333333'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'lotto-6aus49-de-historical',
  'Lotto 6 aus 49 — Historical Draws',
  'Initial reference dataset for the Project Spatial import pipeline.',
  'system',
  null
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Public PostgREST wrapper
-- ---------------------------------------------------------------------------

create or replace function public.import_dataset_version(
  p_dataset_id uuid,
  p_rule_set_id uuid,
  p_content_hash text,
  p_draws jsonb
)
returns table (
  dataset_version_id uuid,
  version integer,
  event_count integer,
  date_from date,
  date_to date,
  status text
)
language sql
security invoker
set search_path = pg_catalog, public, api
as $$
  select *
  from api.import_dataset_version(
    p_dataset_id,
    p_rule_set_id,
    p_content_hash,
    p_draws
  );
$$;

revoke all on function public.import_dataset_version(uuid, uuid, text, jsonb)
from public, anon, authenticated;

grant execute on function public.import_dataset_version(uuid, uuid, text, jsonb)
to service_role;

comment on function public.import_dataset_version(uuid, uuid, text, jsonb) is
  'PostgREST wrapper for the atomic Project Spatial DatasetVersion import.';

commit;
