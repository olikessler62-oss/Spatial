-- Project Spatial
-- Migration: 001_core_schema.sql
-- Target: Supabase PostgreSQL
-- Based on: DB-001 Core Database v0.1
-- RLS policies are intentionally deferred to a separate migration.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lottery ------------------------------------------------------------------
create table public.lotteries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code char(2),
  operator_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lotteries_slug_not_blank check (btrim(slug) <> ''),
  constraint lotteries_name_not_blank check (btrim(name) <> ''),
  constraint lotteries_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create trigger trg_lotteries_set_updated_at
before update on public.lotteries
for each row execute function public.set_updated_at();

create table public.lottery_rule_sets (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references public.lotteries(id) on delete restrict,
  version integer not null,
  valid_from date not null,
  valid_to date,
  main_value_min integer not null,
  main_value_max integer not null,
  main_value_count integer not null,
  bonus_rules jsonb not null default '{}'::jsonb,
  draw_schedule jsonb,
  created_at timestamptz not null default now(),
  constraint lottery_rule_sets_version_positive check (version > 0),
  constraint lottery_rule_sets_valid_period check (valid_to is null or valid_to >= valid_from),
  constraint lottery_rule_sets_main_range check (main_value_max >= main_value_min),
  constraint lottery_rule_sets_main_count_positive check (main_value_count > 0),
  constraint lottery_rule_sets_main_count_fits_range check (main_value_count <= (main_value_max - main_value_min + 1)),
  constraint lottery_rule_sets_bonus_rules_object check (jsonb_typeof(bonus_rules) = 'object'),
  constraint lottery_rule_sets_draw_schedule_object check (draw_schedule is null or jsonb_typeof(draw_schedule) = 'object'),
  constraint lottery_rule_sets_lottery_version_unique unique (lottery_id, version)
);

-- Dataset ------------------------------------------------------------------
create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references public.lotteries(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text,
  visibility text not null default 'private',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint datasets_slug_not_blank check (btrim(slug) <> ''),
  constraint datasets_name_not_blank check (btrim(name) <> ''),
  constraint datasets_visibility_valid check (visibility in ('private', 'workspace', 'public', 'system'))
);

create trigger trg_datasets_set_updated_at
before update on public.datasets
for each row execute function public.set_updated_at();

create table public.dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets(id) on delete restrict,
  version integer not null,
  rule_set_id uuid not null references public.lottery_rule_sets(id) on delete restrict,
  event_count integer not null default 0,
  date_from date,
  date_to date,
  content_hash text not null,
  status text not null default 'building',
  created_at timestamptz not null default now(),
  constraint dataset_versions_version_positive check (version > 0),
  constraint dataset_versions_event_count_nonnegative check (event_count >= 0),
  constraint dataset_versions_date_range_valid check (date_to is null or date_from is null or date_to >= date_from),
  constraint dataset_versions_content_hash_not_blank check (btrim(content_hash) <> ''),
  constraint dataset_versions_status_valid check (status in ('building', 'validated', 'published', 'rejected', 'archived')),
  constraint dataset_versions_dataset_version_unique unique (dataset_id, version)
);

-- Draw ---------------------------------------------------------------------
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  dataset_version_id uuid not null references public.dataset_versions(id) on delete restrict,
  rule_set_id uuid not null references public.lottery_rule_sets(id) on delete restrict,
  external_id text,
  draw_date date not null,
  draw_timestamp timestamptz,
  source_reference text,
  source_checksum text,
  created_at timestamptz not null default now(),
  constraint draws_external_identity_unique unique nulls not distinct (dataset_version_id, draw_date, external_id)
);

create table public.draw_main_values (
  draw_id uuid not null references public.draws(id) on delete cascade,
  ordinal smallint not null,
  value integer not null,
  constraint draw_main_values_pk primary key (draw_id, ordinal),
  constraint draw_main_values_ordinal_positive check (ordinal > 0),
  constraint draw_main_values_value_unique unique (draw_id, value)
);

create table public.draw_bonus_values (
  draw_id uuid not null references public.draws(id) on delete cascade,
  bonus_type text not null,
  ordinal smallint not null,
  value integer not null,
  constraint draw_bonus_values_pk primary key (draw_id, bonus_type, ordinal),
  constraint draw_bonus_values_type_not_blank check (btrim(bonus_type) <> ''),
  constraint draw_bonus_values_ordinal_positive check (ordinal > 0),
  constraint draw_bonus_values_value_unique unique (draw_id, bonus_type, value)
);

-- Import -------------------------------------------------------------------
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets(id) on delete restrict,
  source_type text not null,
  source_name text,
  source_uri text,
  source_hash text,
  status text not null default 'queued',
  rows_received integer not null default 0,
  rows_imported integer not null default 0,
  rows_rejected integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  constraint import_jobs_source_type_valid check (source_type in ('csv', 'json', 'xlsx', 'api', 'manual')),
  constraint import_jobs_status_valid check (status in ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled')),
  constraint import_jobs_row_counts_nonnegative check (rows_received >= 0 and rows_imported >= 0 and rows_rejected >= 0),
  constraint import_jobs_completed_after_started check (completed_at is null or completed_at >= started_at)
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer,
  error_code text not null,
  message text not null,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  constraint import_errors_row_number_positive check (row_number is null or row_number > 0),
  constraint import_errors_code_not_blank check (btrim(error_code) <> ''),
  constraint import_errors_message_not_blank check (btrim(message) <> '')
);

-- Layout -------------------------------------------------------------------
create table public.layouts (
  id uuid primary key default gen_random_uuid(),
  lottery_id uuid not null references public.lotteries(id) on delete restrict,
  name text not null,
  layout_type text not null,
  visibility text not null default 'private',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint layouts_name_not_blank check (btrim(name) <> ''),
  constraint layouts_type_not_blank check (btrim(layout_type) <> ''),
  constraint layouts_visibility_valid check (visibility in ('private', 'workspace', 'public', 'system'))
);

create table public.layout_versions (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete restrict,
  version integer not null,
  coordinate_system text not null,
  parameters jsonb not null default '{}'::jsonb,
  content_hash text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint layout_versions_version_positive check (version > 0),
  constraint layout_versions_coordinate_system_not_blank check (btrim(coordinate_system) <> ''),
  constraint layout_versions_parameters_object check (jsonb_typeof(parameters) = 'object'),
  constraint layout_versions_content_hash_not_blank check (btrim(content_hash) <> ''),
  constraint layout_versions_status_valid check (status in ('draft', 'validated', 'published', 'rejected', 'archived')),
  constraint layout_versions_layout_version_unique unique (layout_id, version)
);

create table public.layout_positions (
  id uuid primary key default gen_random_uuid(),
  layout_version_id uuid not null references public.layout_versions(id) on delete cascade,
  mapped_value integer not null,
  x double precision,
  y double precision,
  radius double precision,
  angle double precision,
  logical_coordinates jsonb,
  metadata jsonb not null default '{}'::jsonb,
  constraint layout_positions_mapping_unique unique (layout_version_id, mapped_value),
  constraint layout_positions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

-- Shape --------------------------------------------------------------------
create table public.shapes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shape_type text not null,
  visibility text not null default 'private',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint shapes_name_not_blank check (btrim(name) <> ''),
  constraint shapes_type_not_blank check (btrim(shape_type) <> ''),
  constraint shapes_visibility_valid check (visibility in ('private', 'workspace', 'public', 'system'))
);

create table public.shape_versions (
  id uuid primary key default gen_random_uuid(),
  shape_id uuid not null references public.shapes(id) on delete restrict,
  version integer not null,
  definition_type text not null,
  definition jsonb not null,
  anchor_definition jsonb,
  content_hash text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint shape_versions_version_positive check (version > 0),
  constraint shape_versions_definition_type_not_blank check (btrim(definition_type) <> ''),
  constraint shape_versions_content_hash_not_blank check (btrim(content_hash) <> ''),
  constraint shape_versions_status_valid check (status in ('draft', 'validated', 'published', 'rejected', 'archived')),
  constraint shape_versions_shape_version_unique unique (shape_id, version)
);

create table public.shape_positions (
  shape_version_id uuid not null references public.shape_versions(id) on delete cascade,
  ordinal integer not null,
  relative_x double precision,
  relative_y double precision,
  weight numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  constraint shape_positions_pk primary key (shape_version_id, ordinal),
  constraint shape_positions_ordinal_positive check (ordinal > 0),
  constraint shape_positions_weight_nonnegative check (weight >= 0),
  constraint shape_positions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

-- Metric -------------------------------------------------------------------
create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  unit text,
  value_type text not null,
  created_at timestamptz not null default now(),
  constraint metrics_key_not_blank check (btrim(key) <> ''),
  constraint metrics_name_not_blank check (btrim(name) <> ''),
  constraint metrics_description_not_blank check (btrim(description) <> ''),
  constraint metrics_value_type_valid check (value_type in ('numeric', 'text', 'json', 'boolean'))
);

create table public.metric_versions (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.metrics(id) on delete restrict,
  version integer not null,
  definition text not null,
  algorithm_key text not null,
  parameters_schema jsonb not null default '{}'::jsonb,
  rounding_rules jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint metric_versions_version_positive check (version > 0),
  constraint metric_versions_definition_not_blank check (btrim(definition) <> ''),
  constraint metric_versions_algorithm_key_not_blank check (btrim(algorithm_key) <> ''),
  constraint metric_versions_parameters_schema_object check (jsonb_typeof(parameters_schema) = 'object'),
  constraint metric_versions_status_valid check (status in ('draft', 'validated', 'published', 'rejected', 'archived')),
  constraint metric_versions_metric_version_unique unique (metric_id, version)
);

-- Experiment ---------------------------------------------------------------
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  constraint experiments_name_not_blank check (btrim(name) <> ''),
  constraint experiments_visibility_valid check (visibility in ('private', 'workspace', 'shared_link', 'community', 'published'))
);

create table public.experiment_versions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete restrict,
  version integer not null,
  dataset_version_id uuid not null references public.dataset_versions(id) on delete restrict,
  layout_version_id uuid not null references public.layout_versions(id) on delete restrict,
  event_filter jsonb not null default '{}'::jsonb,
  placement_configuration jsonb not null default '{}'::jsonb,
  hit_rule_configuration jsonb not null default '{}'::jsonb,
  engine_version text not null,
  configuration_hash text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint experiment_versions_version_positive check (version > 0),
  constraint experiment_versions_event_filter_object check (jsonb_typeof(event_filter) = 'object'),
  constraint experiment_versions_placement_object check (jsonb_typeof(placement_configuration) = 'object'),
  constraint experiment_versions_hit_rule_object check (jsonb_typeof(hit_rule_configuration) = 'object'),
  constraint experiment_versions_engine_not_blank check (btrim(engine_version) <> ''),
  constraint experiment_versions_hash_not_blank check (btrim(configuration_hash) <> ''),
  constraint experiment_versions_status_valid check (status in ('draft', 'configured', 'validated', 'locked', 'published', 'archived')),
  constraint experiment_versions_experiment_version_unique unique (experiment_id, version)
);

create table public.experiment_shapes (
  experiment_version_id uuid not null references public.experiment_versions(id) on delete cascade,
  shape_version_id uuid not null references public.shape_versions(id) on delete restrict,
  role text not null,
  parameters jsonb not null default '{}'::jsonb,
  constraint experiment_shapes_pk primary key (experiment_version_id, shape_version_id, role),
  constraint experiment_shapes_role_not_blank check (btrim(role) <> ''),
  constraint experiment_shapes_parameters_object check (jsonb_typeof(parameters) = 'object')
);

create table public.experiment_metrics (
  experiment_version_id uuid not null references public.experiment_versions(id) on delete cascade,
  metric_version_id uuid not null references public.metric_versions(id) on delete restrict,
  parameters jsonb not null default '{}'::jsonb,
  constraint experiment_metrics_pk primary key (experiment_version_id, metric_version_id),
  constraint experiment_metrics_parameters_object check (jsonb_typeof(parameters) = 'object')
);

-- Experiment Run / Result --------------------------------------------------
create table public.experiment_runs (
  id uuid primary key default gen_random_uuid(),
  experiment_version_id uuid not null references public.experiment_versions(id) on delete restrict,
  status text not null default 'queued',
  engine_version text not null,
  configuration_hash text not null,
  dataset_hash text not null,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms bigint,
  error_details jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint experiment_runs_status_valid check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  constraint experiment_runs_engine_not_blank check (btrim(engine_version) <> ''),
  constraint experiment_runs_configuration_hash_not_blank check (btrim(configuration_hash) <> ''),
  constraint experiment_runs_dataset_hash_not_blank check (btrim(dataset_hash) <> ''),
  constraint experiment_runs_time_order_valid check (completed_at is null or started_at is null or completed_at >= started_at),
  constraint experiment_runs_duration_nonnegative check (duration_ms is null or duration_ms >= 0)
);

create table public.experiment_results (
  id uuid primary key default gen_random_uuid(),
  experiment_run_id uuid not null unique references public.experiment_runs(id) on delete restrict,
  result_hash text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint experiment_results_hash_not_blank check (btrim(result_hash) <> ''),
  constraint experiment_results_summary_object check (jsonb_typeof(summary) = 'object')
);

create table public.metric_values (
  id uuid primary key default gen_random_uuid(),
  experiment_result_id uuid not null references public.experiment_results(id) on delete cascade,
  metric_version_id uuid not null references public.metric_versions(id) on delete restrict,
  analysis_object_key text,
  numeric_value numeric,
  text_value text,
  json_value jsonb,
  boolean_value boolean,
  created_at timestamptz not null default now(),
  constraint metric_values_exactly_one_value check (num_nonnulls(numeric_value, text_value, json_value, boolean_value) = 1),
  constraint metric_values_identity_unique unique nulls not distinct (experiment_result_id, metric_version_id, analysis_object_key)
);

-- Indexes ------------------------------------------------------------------
create index idx_lottery_rule_sets_lottery_validity on public.lottery_rule_sets (lottery_id, valid_from, valid_to);
create index idx_datasets_lottery on public.datasets (lottery_id);
create index idx_dataset_versions_dataset on public.dataset_versions (dataset_id, version desc);
create index idx_draws_dataset_version_date on public.draws (dataset_version_id, draw_date);
create index idx_draws_rule_set on public.draws (rule_set_id);
create index idx_draw_main_values_value on public.draw_main_values (value, draw_id);
create index idx_import_jobs_dataset_started on public.import_jobs (dataset_id, started_at desc);
create index idx_import_errors_job on public.import_errors (import_job_id, row_number);
create index idx_layouts_lottery on public.layouts (lottery_id);
create index idx_layout_versions_layout on public.layout_versions (layout_id, version desc);
create index idx_layout_positions_version on public.layout_positions (layout_version_id);
create index idx_shape_versions_shape on public.shape_versions (shape_id, version desc);
create index idx_metric_versions_metric on public.metric_versions (metric_id, version desc);
create index idx_experiment_versions_experiment on public.experiment_versions (experiment_id, version desc);
create index idx_experiment_runs_version_created on public.experiment_runs (experiment_version_id, created_at desc);
create index idx_metric_values_result_metric on public.metric_values (experiment_result_id, metric_version_id);

comment on table public.lotteries is 'Logical lottery products independent of historical rule changes.';
comment on table public.lottery_rule_sets is 'Versioned historical lottery rules.';
comment on table public.dataset_versions is 'Immutable snapshots of logical datasets once published.';
comment on table public.experiment_versions is 'Versioned and reproducible experiment configurations.';
comment on table public.experiment_runs is 'Concrete executions of experiment versions.';
comment on table public.experiment_results is 'Immutable primary result of one completed experiment run.';

commit;
