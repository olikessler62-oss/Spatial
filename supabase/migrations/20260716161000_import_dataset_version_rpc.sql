-- Project Spatial
-- Migration: 20260716161000_import_dataset_version_rpc.sql
-- Implements the atomic persistence boundary for FR-001.
--
-- Security:
-- - Function execution is granted only to service_role.
-- - The service-role key must never be exposed to a browser or mobile client.

begin;

create or replace function api.import_dataset_version(
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
language plpgsql
security definer
set search_path = pg_catalog, core, api
as $$
declare
  v_dataset_version_id uuid;
  v_version integer;
  v_event_count integer;
  v_date_from date;
  v_date_to date;
  v_draw jsonb;
  v_draw_id uuid;
  v_ordinal integer;
  v_value jsonb;
begin
  if p_dataset_id is null or p_rule_set_id is null then
    raise exception 'dataset_id and rule_set_id are required'
      using errcode = '22004';
  end if;

  if p_content_hash is null or btrim(p_content_hash) = '' then
    raise exception 'content_hash is required'
      using errcode = '22023';
  end if;

  if p_draws is null
     or jsonb_typeof(p_draws) <> 'array'
     or jsonb_array_length(p_draws) = 0 then
    raise exception 'draws must be a non-empty JSON array'
      using errcode = '22023';
  end if;

  -- Serialize version allocation for this logical Dataset.
  perform pg_advisory_xact_lock(hashtextextended(p_dataset_id::text, 0));

  if not exists (
    select 1
    from core.datasets d
    where d.id = p_dataset_id
  ) then
    raise exception 'Dataset % does not exist', p_dataset_id
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from core.lottery_rule_sets r
    where r.id = p_rule_set_id
  ) then
    raise exception 'LotteryRuleSet % does not exist', p_rule_set_id
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from core.dataset_versions dv
    where dv.dataset_id = p_dataset_id
      and dv.content_hash = p_content_hash
  ) then
    raise exception 'Dataset content hash already exists: %', p_content_hash
      using errcode = '23505';
  end if;

  select coalesce(max(dv.version), 0) + 1
  into v_version
  from core.dataset_versions dv
  where dv.dataset_id = p_dataset_id;

  select
    count(*)::integer,
    min((item->>'draw_date')::date),
    max((item->>'draw_date')::date)
  into v_event_count, v_date_from, v_date_to
  from jsonb_array_elements(p_draws) item;

  insert into core.dataset_versions (
    dataset_id,
    version,
    rule_set_id,
    event_count,
    date_from,
    date_to,
    content_hash,
    status
  )
  values (
    p_dataset_id,
    v_version,
    p_rule_set_id,
    v_event_count,
    v_date_from,
    v_date_to,
    p_content_hash,
    'building'
  )
  returning id into v_dataset_version_id;

  for v_draw in
    select value from jsonb_array_elements(p_draws)
  loop
    if jsonb_typeof(v_draw->'main_numbers') <> 'array' then
      raise exception 'main_numbers must be an array';
    end if;

    if v_draw->'bonus_numbers' is not null
       and jsonb_typeof(v_draw->'bonus_numbers') <> 'array' then
      raise exception 'bonus_numbers must be an array';
    end if;

    insert into core.draws (
      dataset_version_id,
      rule_set_id,
      external_id,
      draw_date,
      source_reference
    )
    values (
      v_dataset_version_id,
      p_rule_set_id,
      nullif(v_draw->>'external_id', ''),
      (v_draw->>'draw_date')::date,
      case
        when v_draw ? 'source_row'
        then 'csv-row:' || (v_draw->>'source_row')
        else null
      end
    )
    returning id into v_draw_id;

    v_ordinal := 0;
    for v_value in
      select value from jsonb_array_elements(v_draw->'main_numbers')
    loop
      v_ordinal := v_ordinal + 1;

      insert into core.draw_main_values (
        draw_id,
        ordinal,
        value
      )
      values (
        v_draw_id,
        v_ordinal,
        (v_value #>> '{}')::integer
      );
    end loop;

    v_ordinal := 0;
    for v_value in
      select value
      from jsonb_array_elements(coalesce(v_draw->'bonus_numbers', '[]'::jsonb))
    loop
      v_ordinal := v_ordinal + 1;

      insert into core.draw_bonus_values (
        draw_id,
        bonus_type,
        ordinal,
        value
      )
      values (
        v_draw_id,
        'default',
        v_ordinal,
        (v_value #>> '{}')::integer
      );
    end loop;
  end loop;

  update core.dataset_versions
  set status = 'validated'
  where id = v_dataset_version_id;

  return query
  select
    dv.id,
    dv.version,
    dv.event_count,
    dv.date_from,
    dv.date_to,
    dv.status
  from core.dataset_versions dv
  where dv.id = v_dataset_version_id;
end;
$$;

revoke all on function api.import_dataset_version(uuid, uuid, text, jsonb)
from public, anon, authenticated;

grant execute on function api.import_dataset_version(uuid, uuid, text, jsonb)
to service_role;

comment on function api.import_dataset_version(uuid, uuid, text, jsonb) is
  'Atomically creates one validated DatasetVersion and all contained Draw records.';

commit;
