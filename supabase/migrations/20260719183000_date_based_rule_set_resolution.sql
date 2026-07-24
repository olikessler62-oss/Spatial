-- Project Spatial
-- Migration: 20260719183000_date_based_rule_set_resolution.sql
--
-- Adds:
-- - date-based LotteryRuleSet resolution inside DatasetVersion import,
-- - EuroJackpot reference lottery with historical euro-number rule eras,
-- - corrected Lotto 6aus49 rule validity start.

begin;

-- ---------------------------------------------------------------------------
-- Reference data: widen Lotto validity so historical imports can resolve
-- ---------------------------------------------------------------------------

update core.lottery_rule_sets
set valid_from = date '1991-01-01'
where id = '22222222-2222-4222-8222-222222222222'::uuid
  and valid_from = date '2026-01-01';

-- ---------------------------------------------------------------------------
-- Reference data: EuroJackpot with two euro-number eras
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
  '44444444-4444-4444-8444-444444444444'::uuid,
  'eurojackpot',
  'EuroJackpot',
  'EU',
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
values
(
  '55555555-5555-4555-8555-555555555555'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  1,
  date '2014-10-10',
  date '2022-03-24',
  1,
  50,
  5,
  jsonb_build_object(
    'type', 'euro_numbers',
    'minimum', 1,
    'maximum', 10,
    'count', 2
  ),
  jsonb_build_object(
    'timezone', 'Europe/Berlin',
    'days', jsonb_build_array('Tuesday', 'Friday')
  )
),
(
  '66666666-6666-4666-8666-666666666666'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  2,
  date '2022-03-25',
  null,
  1,
  50,
  5,
  jsonb_build_object(
    'type', 'euro_numbers',
    'minimum', 1,
    'maximum', 12,
    'count', 2
  ),
  jsonb_build_object(
    'timezone', 'Europe/Berlin',
    'days', jsonb_build_array('Tuesday', 'Friday')
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
  '77777777-7777-4777-8777-777777777777'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  'eurojackpot-historical',
  'EuroJackpot — Historical Draws',
  'Reference dataset spanning the Euro numbers 1–10 and 1–12 rule eras.',
  'system',
  null
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Import RPC: resolve rule_set_id per draw from draw_date
-- ---------------------------------------------------------------------------

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
  v_lottery_id uuid;
  v_draw_date date;
  v_resolved_rule_set_id uuid;
  v_provided_rule_set_id uuid;
  v_version_rule_set_id uuid;
  v_bonus_type text;
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

  perform pg_advisory_xact_lock(hashtextextended(p_dataset_id::text, 0));

  select d.lottery_id
  into v_lottery_id
  from core.datasets d
  where d.id = p_dataset_id;

  if v_lottery_id is null then
    raise exception 'Dataset % does not exist', p_dataset_id
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from core.lottery_rule_sets r
    where r.id = p_rule_set_id
      and r.lottery_id = v_lottery_id
  ) then
    raise exception 'LotteryRuleSet % does not exist for Dataset lottery', p_rule_set_id
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

  select r.id
  into v_version_rule_set_id
  from core.lottery_rule_sets r
  where r.lottery_id = v_lottery_id
    and r.valid_from <= v_date_to
    and (r.valid_to is null or r.valid_to >= v_date_to)
  order by r.valid_from desc
  limit 1;

  if v_version_rule_set_id is null then
    v_version_rule_set_id := p_rule_set_id;
  end if;

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
    v_version_rule_set_id,
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

    v_draw_date := (v_draw->>'draw_date')::date;

    select r.id, coalesce(nullif(r.bonus_rules->>'type', ''), 'default')
    into v_resolved_rule_set_id, v_bonus_type
    from core.lottery_rule_sets r
    where r.lottery_id = v_lottery_id
      and r.valid_from <= v_draw_date
      and (r.valid_to is null or r.valid_to >= v_draw_date)
    order by r.valid_from desc
    limit 1;

    if v_resolved_rule_set_id is null then
      raise exception 'No lottery rule set covers draw_date %', v_draw_date
        using errcode = '22023';
    end if;

    if v_draw ? 'rule_set_id'
       and nullif(v_draw->>'rule_set_id', '') is not null then
      v_provided_rule_set_id := (v_draw->>'rule_set_id')::uuid;

      if v_provided_rule_set_id is distinct from v_resolved_rule_set_id then
        raise exception
          'rule_set_id % does not match resolved rule set % for draw_date %',
          v_provided_rule_set_id,
          v_resolved_rule_set_id,
          v_draw_date
          using errcode = '22023';
      end if;
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
      v_resolved_rule_set_id,
      nullif(v_draw->>'external_id', ''),
      v_draw_date,
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
        v_bonus_type,
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

comment on function api.import_dataset_version(uuid, uuid, text, jsonb) is
  'Atomically creates one validated DatasetVersion and Draw records with date-based LotteryRuleSet resolution.';

commit;
