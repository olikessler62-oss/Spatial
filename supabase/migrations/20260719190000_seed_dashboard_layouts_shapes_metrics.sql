-- Project Spatial
-- Migration: 20260719190000_seed_dashboard_layouts_shapes_metrics.sql
--
-- Seeds system layouts/shapes/metrics for the research dashboard MVP
-- and adds read policies so authenticated users can load them.

begin;

-- ---------------------------------------------------------------------------
-- Metrics
-- ---------------------------------------------------------------------------

insert into analysis.metrics (
  id, key, name, description, unit, value_type
)
values
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
  'average-hits',
  'Average Hits',
  'Average number of hits across analyzed draws for a placement.',
  'hits',
  'numeric'
),
(
  'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
  'maximum-hits',
  'Maximum Hits',
  'Maximum hit count observed for a placement across analyzed draws.',
  'hits',
  'numeric'
)
on conflict (id) do nothing;

insert into analysis.metric_versions (
  id, metric_id, version, definition, algorithm_key, parameters_schema, status
)
values
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
  1,
  'Average hits across draws for one placement candidate.',
  'average-hits',
  '{}'::jsonb,
  'published'
),
(
  'ffffffff-ffff-4fff-8fff-fffffffffff1'::uuid,
  'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid,
  1,
  'Maximum hits across draws for one placement candidate.',
  'maximum-hits',
  '{}'::jsonb,
  'published'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Shared shapes (relative coordinates)
-- ---------------------------------------------------------------------------

insert into analysis.shapes (
  id, name, shape_type, visibility, created_by
)
values
(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
  'Quadrat 2x2',
  'relative',
  'public',
  null
),
(
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
  'Linie 3',
  'relative',
  'public',
  null
)
on conflict (id) do nothing;

insert into analysis.shape_versions (
  id, shape_id, version, definition_type, definition, content_hash, status
)
values
(
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'::uuid,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 1, 'y', 0),
      jsonb_build_object('x', 0, 'y', 1),
      jsonb_build_object('x', 1, 'y', 1)
    )
  ),
  'sha256:shape-square-2x2-v1',
  'published'
),
(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'::uuid,
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 1, 'y', 0),
      jsonb_build_object('x', 2, 'y', 0)
    )
  ),
  'sha256:shape-line-3-v1',
  'published'
)
on conflict (id) do nothing;

insert into analysis.shape_positions (
  shape_version_id, ordinal, relative_x, relative_y, weight
)
values
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1'::uuid, 1, 0, 0, 1),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1'::uuid, 2, 1, 0, 1),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1'::uuid, 3, 0, 1, 1),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1'::uuid, 4, 1, 1, 1),
('dddddddd-dddd-4ddd-8ddd-ddddddddddd1'::uuid, 1, 0, 0, 1),
('dddddddd-dddd-4ddd-8ddd-ddddddddddd1'::uuid, 2, 1, 0, 1),
('dddddddd-dddd-4ddd-8ddd-ddddddddddd1'::uuid, 3, 2, 0, 1)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Layouts per lottery
-- ---------------------------------------------------------------------------

insert into analysis.layouts (
  id, lottery_id, name, layout_type, visibility, created_by
)
values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Lotto 6aus49 Raster 7x7',
  'grid',
  'public',
  null
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  'EuroJackpot Raster 5x10',
  'grid',
  'public',
  null
)
on conflict (id) do nothing;

insert into analysis.layout_versions (
  id, layout_id, version, coordinate_system, parameters, content_hash, status
)
values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  1,
  'cartesian',
  jsonb_build_object(
    'type', 'grid',
    'minimumValue', 1,
    'maximumValue', 49,
    'columns', 7
  ),
  'sha256:layout-lotto-7x7-v1',
  'published'
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'::uuid,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  1,
  'cartesian',
  jsonb_build_object(
    'type', 'grid',
    'minimumValue', 1,
    'maximumValue', 50,
    'columns', 5
  ),
  'sha256:layout-eurojackpot-5x10-v1',
  'published'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Read policies for dashboard reference data + user experiment access
-- ---------------------------------------------------------------------------

drop policy if exists "layouts_public_or_own_select" on analysis.layouts;
create policy "layouts_public_or_own_select"
on analysis.layouts
for select
to authenticated, anon
using (
  visibility in ('public', 'system')
  or created_by = auth.uid()
);

drop policy if exists "layout_versions_readable" on analysis.layout_versions;
create policy "layout_versions_readable"
on analysis.layout_versions
for select
to authenticated, anon
using (
  exists (
    select 1
    from analysis.layouts l
    where l.id = layout_id
      and (
        l.visibility in ('public', 'system')
        or l.created_by = auth.uid()
      )
  )
);

drop policy if exists "shapes_public_or_own_select" on analysis.shapes;
create policy "shapes_public_or_own_select"
on analysis.shapes
for select
to authenticated, anon
using (
  visibility in ('public', 'system')
  or created_by = auth.uid()
);

drop policy if exists "shape_versions_readable" on analysis.shape_versions;
create policy "shape_versions_readable"
on analysis.shape_versions
for select
to authenticated, anon
using (
  exists (
    select 1
    from analysis.shapes s
    where s.id = shape_id
      and (
        s.visibility in ('public', 'system')
        or s.created_by = auth.uid()
      )
  )
);

drop policy if exists "shape_positions_readable" on analysis.shape_positions;
create policy "shape_positions_readable"
on analysis.shape_positions
for select
to authenticated, anon
using (
  exists (
    select 1
    from analysis.shape_versions sv
    join analysis.shapes s on s.id = sv.shape_id
    where sv.id = shape_version_id
      and (
        s.visibility in ('public', 'system')
        or s.created_by = auth.uid()
      )
  )
);

drop policy if exists "metrics_readable" on analysis.metrics;
create policy "metrics_readable"
on analysis.metrics
for select
to authenticated, anon
using (true);

drop policy if exists "metric_versions_readable" on analysis.metric_versions;
create policy "metric_versions_readable"
on analysis.metric_versions
for select
to authenticated, anon
using (true);

drop policy if exists "experiments_select_own_or_public" on analysis.experiments;
create policy "experiments_select_own_or_public"
on analysis.experiments
for select
to authenticated
using (
  visibility in ('public', 'community', 'published')
  or created_by = auth.uid()
);

drop policy if exists "experiments_insert_own" on analysis.experiments;
create policy "experiments_insert_own"
on analysis.experiments
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "experiment_versions_select" on analysis.experiment_versions;
create policy "experiment_versions_select"
on analysis.experiment_versions
for select
to authenticated
using (
  exists (
    select 1
    from analysis.experiments e
    where e.id = experiment_id
      and (
        e.visibility in ('public', 'community', 'published')
        or e.created_by = auth.uid()
      )
  )
);

drop policy if exists "experiment_versions_insert" on analysis.experiment_versions;
create policy "experiment_versions_insert"
on analysis.experiment_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from analysis.experiments e
    where e.id = experiment_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "experiment_shapes_select" on analysis.experiment_shapes;
create policy "experiment_shapes_select"
on analysis.experiment_shapes
for select
to authenticated
using (
  exists (
    select 1
    from analysis.experiment_versions ev
    join analysis.experiments e on e.id = ev.experiment_id
    where ev.id = experiment_version_id
      and (
        e.visibility in ('public', 'community', 'published')
        or e.created_by = auth.uid()
      )
  )
);

drop policy if exists "experiment_shapes_insert" on analysis.experiment_shapes;
create policy "experiment_shapes_insert"
on analysis.experiment_shapes
for insert
to authenticated
with check (
  exists (
    select 1
    from analysis.experiment_versions ev
    join analysis.experiments e on e.id = ev.experiment_id
    where ev.id = experiment_version_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "experiment_metrics_select" on analysis.experiment_metrics;
create policy "experiment_metrics_select"
on analysis.experiment_metrics
for select
to authenticated
using (
  exists (
    select 1
    from analysis.experiment_versions ev
    join analysis.experiments e on e.id = ev.experiment_id
    where ev.id = experiment_version_id
      and (
        e.visibility in ('public', 'community', 'published')
        or e.created_by = auth.uid()
      )
  )
);

drop policy if exists "experiment_metrics_insert" on analysis.experiment_metrics;
create policy "experiment_metrics_insert"
on analysis.experiment_metrics
for insert
to authenticated
with check (
  exists (
    select 1
    from analysis.experiment_versions ev
    join analysis.experiments e on e.id = ev.experiment_id
    where ev.id = experiment_version_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "experiment_runs_select" on analysis.experiment_runs;
create policy "experiment_runs_select"
on analysis.experiment_runs
for select
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from analysis.experiment_versions ev
    join analysis.experiments e on e.id = ev.experiment_id
    where ev.id = experiment_version_id
      and (
        e.visibility in ('public', 'community', 'published')
        or e.created_by = auth.uid()
      )
  )
);

drop policy if exists "experiment_runs_insert" on analysis.experiment_runs;
create policy "experiment_runs_insert"
on analysis.experiment_runs
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "experiment_results_select" on analysis.experiment_results;
create policy "experiment_results_select"
on analysis.experiment_results
for select
to authenticated
using (
  exists (
    select 1
    from analysis.experiment_runs er
    where er.id = experiment_run_id
      and (
        er.created_by = auth.uid()
        or exists (
          select 1
          from analysis.experiment_versions ev
          join analysis.experiments e on e.id = ev.experiment_id
          where ev.id = er.experiment_version_id
            and (
              e.visibility in ('public', 'community', 'published')
              or e.created_by = auth.uid()
            )
        )
      )
  )
);

drop policy if exists "experiment_results_insert" on analysis.experiment_results;
create policy "experiment_results_insert"
on analysis.experiment_results
for insert
to authenticated
with check (
  exists (
    select 1
    from analysis.experiment_runs er
    where er.id = experiment_run_id
      and er.created_by = auth.uid()
  )
);

-- Ensure core reference lottery/dataset rows remain readable for the wizard
drop policy if exists "lotteries_public_read" on core.lotteries;
create policy "lotteries_public_read"
on core.lotteries
for select
to authenticated, anon
using (true);

drop policy if exists "datasets_select_visible" on core.datasets;
create policy "datasets_select_visible"
on core.datasets
for select
to authenticated, anon
using (
  visibility in ('public', 'system')
  or created_by = auth.uid()
);

drop policy if exists "dataset_versions_select_visible" on core.dataset_versions;
create policy "dataset_versions_select_visible"
on core.dataset_versions
for select
to authenticated, anon
using (
  exists (
    select 1
    from core.datasets d
    where d.id = dataset_id
      and (
        d.visibility in ('public', 'system')
        or d.created_by = auth.uid()
      )
  )
);

drop policy if exists "draws_select_visible" on core.draws;
create policy "draws_select_visible"
on core.draws
for select
to authenticated, anon
using (
  exists (
    select 1
    from core.dataset_versions dv
    join core.datasets d on d.id = dv.dataset_id
    where dv.id = dataset_version_id
      and (
        d.visibility in ('public', 'system')
        or d.created_by = auth.uid()
      )
  )
);

drop policy if exists "draw_main_values_select_visible" on core.draw_main_values;
create policy "draw_main_values_select_visible"
on core.draw_main_values
for select
to authenticated, anon
using (
  exists (
    select 1
    from core.draws dr
    join core.dataset_versions dv on dv.id = dr.dataset_version_id
    join core.datasets d on d.id = dv.dataset_id
    where dr.id = draw_id
      and (
        d.visibility in ('public', 'system')
        or d.created_by = auth.uid()
      )
  )
);

commit;
