-- Project Spatial
-- Migration: 20260716150000_modularize_schema_and_add_immutability.sql
-- Purpose:
-- 1. Move already deployed public.* tables into modular schemas.
-- 2. Preserve data, indexes, constraints, triggers, policies and FKs.
-- 3. Add database-enforced immutability according to ADR-005.

begin;

create schema if not exists core;
create schema if not exists analysis;
create schema if not exists community;
create schema if not exists security;
create schema if not exists system;
create schema if not exists api;

grant usage on schema core, analysis, community, security, system, api
  to anon, authenticated, service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'lotteries','lottery_rule_sets','datasets','dataset_versions','draws',
    'draw_main_values','draw_bonus_values','import_jobs','import_errors'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I set schema core', table_name);
    end if;
  end loop;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'layouts','layout_versions','layout_positions','shapes','shape_versions',
    'shape_positions','metrics','metric_versions','experiments',
    'experiment_versions','experiment_shapes','experiment_metrics',
    'experiment_runs','experiment_results','metric_values'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I set schema analysis', table_name);
    end if;
  end loop;
end;
$$;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set schema system';
  end if;
end;
$$;

create or replace function system.reject_all_mutations()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception '% is prohibited for immutable relation %.%',
    tg_op, tg_table_schema, tg_table_name
    using errcode = '55000';
end;
$$;

create or replace function system.reject_mutation_in_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  protected_statuses text[];
  old_status text;
begin
  protected_statuses := string_to_array(coalesce(tg_argv[0], ''), ',');
  old_status := to_jsonb(old)->>'status';

  if old_status = any(protected_statuses) then
    raise exception '% is prohibited for %.% while status is %',
      tg_op, tg_table_schema, tg_table_name, old_status
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

comment on function system.reject_all_mutations() is
  'Rejects UPDATE and DELETE for fully immutable domain records.';
comment on function system.reject_mutation_in_status() is
  'Rejects UPDATE and DELETE after protected lifecycle states are reached.';

drop trigger if exists trg_lottery_rule_sets_immutable on core.lottery_rule_sets;
create trigger trg_lottery_rule_sets_immutable
before update or delete on core.lottery_rule_sets
for each row execute function system.reject_mutation_in_status(
  'validated,published,rejected,withdrawn,archived'
);

drop trigger if exists trg_dataset_versions_immutable on core.dataset_versions;
create trigger trg_dataset_versions_immutable
before update or delete on core.dataset_versions
for each row execute function system.reject_mutation_in_status(
  'validated,published,rejected,archived'
);

drop trigger if exists trg_layout_versions_immutable on analysis.layout_versions;
create trigger trg_layout_versions_immutable
before update or delete on analysis.layout_versions
for each row execute function system.reject_mutation_in_status(
  'validated,published,rejected,archived'
);

drop trigger if exists trg_shape_versions_immutable on analysis.shape_versions;
create trigger trg_shape_versions_immutable
before update or delete on analysis.shape_versions
for each row execute function system.reject_mutation_in_status(
  'validated,published,rejected,archived'
);

drop trigger if exists trg_metric_versions_immutable on analysis.metric_versions;
create trigger trg_metric_versions_immutable
before update or delete on analysis.metric_versions
for each row execute function system.reject_mutation_in_status(
  'validated,published,rejected,archived'
);

drop trigger if exists trg_experiment_versions_immutable on analysis.experiment_versions;
create trigger trg_experiment_versions_immutable
before update or delete on analysis.experiment_versions
for each row execute function system.reject_mutation_in_status(
  'locked,published,archived'
);

drop trigger if exists trg_experiment_runs_immutable on analysis.experiment_runs;
create trigger trg_experiment_runs_immutable
before update or delete on analysis.experiment_runs
for each row execute function system.reject_mutation_in_status(
  'completed,failed,cancelled'
);

drop trigger if exists trg_draws_immutable on core.draws;
create trigger trg_draws_immutable
before update or delete on core.draws
for each row execute function system.reject_all_mutations();

drop trigger if exists trg_draw_main_values_immutable on core.draw_main_values;
create trigger trg_draw_main_values_immutable
before update or delete on core.draw_main_values
for each row execute function system.reject_all_mutations();

drop trigger if exists trg_draw_bonus_values_immutable on core.draw_bonus_values;
create trigger trg_draw_bonus_values_immutable
before update or delete on core.draw_bonus_values
for each row execute function system.reject_all_mutations();

drop trigger if exists trg_experiment_results_immutable on analysis.experiment_results;
create trigger trg_experiment_results_immutable
before update or delete on analysis.experiment_results
for each row execute function system.reject_all_mutations();

drop trigger if exists trg_metric_values_immutable on analysis.metric_values;
create trigger trg_metric_values_immutable
before update or delete on analysis.metric_values
for each row execute function system.reject_all_mutations();

alter table core.lotteries enable row level security;
alter table core.lottery_rule_sets enable row level security;
alter table core.datasets enable row level security;
alter table core.dataset_versions enable row level security;
alter table core.draws enable row level security;
alter table core.draw_main_values enable row level security;
alter table core.draw_bonus_values enable row level security;
alter table core.import_jobs enable row level security;
alter table core.import_errors enable row level security;

alter table analysis.layouts enable row level security;
alter table analysis.layout_versions enable row level security;
alter table analysis.layout_positions enable row level security;
alter table analysis.shapes enable row level security;
alter table analysis.shape_versions enable row level security;
alter table analysis.shape_positions enable row level security;
alter table analysis.metrics enable row level security;
alter table analysis.metric_versions enable row level security;
alter table analysis.experiments enable row level security;
alter table analysis.experiment_versions enable row level security;
alter table analysis.experiment_shapes enable row level security;
alter table analysis.experiment_metrics enable row level security;
alter table analysis.experiment_runs enable row level security;
alter table analysis.experiment_results enable row level security;
alter table analysis.metric_values enable row level security;

grant all privileges on all tables in schema core, analysis to service_role;
grant select, insert, update, delete on all tables in schema core, analysis to authenticated;
grant select on all tables in schema core, analysis to anon;

alter default privileges in schema core, analysis
  grant all privileges on tables to service_role;
alter default privileges in schema core, analysis
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema core, analysis
  grant select on tables to anon;

commit;
