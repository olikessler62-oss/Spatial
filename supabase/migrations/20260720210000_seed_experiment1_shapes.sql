-- Experiment1 shapes for Lotto 7×7 walk-forward tests.

begin;

insert into analysis.shapes (
  id, name, shape_type, visibility, created_by
)
values
(
  'e1111111-1111-4111-8111-111111111111'::uuid,
  'Kreuz 5',
  'relative',
  'public',
  null
),
(
  'e2222222-2222-4222-8222-222222222222'::uuid,
  'Horizontale Linie 4',
  'relative',
  'public',
  null
),
(
  'e3333333-3333-4333-8333-333333333333'::uuid,
  'Vertikale Linie 4',
  'relative',
  'public',
  null
),
(
  'e4444444-4444-4444-8444-444444444444'::uuid,
  'Diagonale Linie 4',
  'relative',
  'public',
  null
),
(
  'e5555555-5555-4555-8555-555555555555'::uuid,
  'L-Form 4',
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
  'e1111111-1111-4111-8111-1111111111a1'::uuid,
  'e1111111-1111-4111-8111-111111111111'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', -1, 'y', 0),
      jsonb_build_object('x', 1, 'y', 0),
      jsonb_build_object('x', 0, 'y', -1),
      jsonb_build_object('x', 0, 'y', 1)
    )
  ),
  'sha256:shape-cross-5-v1',
  'published'
),
(
  'e2222222-2222-4222-8222-2222222222a1'::uuid,
  'e2222222-2222-4222-8222-222222222222'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 1, 'y', 0),
      jsonb_build_object('x', 2, 'y', 0),
      jsonb_build_object('x', 3, 'y', 0)
    )
  ),
  'sha256:shape-hline-4-v1',
  'published'
),
(
  'e3333333-3333-4333-8333-3333333333a1'::uuid,
  'e3333333-3333-4333-8333-333333333333'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 0, 'y', 1),
      jsonb_build_object('x', 0, 'y', 2),
      jsonb_build_object('x', 0, 'y', 3)
    )
  ),
  'sha256:shape-vline-4-v1',
  'published'
),
(
  'e4444444-4444-4444-8444-4444444444a1'::uuid,
  'e4444444-4444-4444-8444-444444444444'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 1, 'y', 1),
      jsonb_build_object('x', 2, 'y', 2),
      jsonb_build_object('x', 3, 'y', 3)
    )
  ),
  'sha256:shape-diag-4-v1',
  'published'
),
(
  'e5555555-5555-4555-8555-5555555555a1'::uuid,
  'e5555555-5555-4555-8555-555555555555'::uuid,
  1,
  'relative_positions',
  jsonb_build_object(
    'positions', jsonb_build_array(
      jsonb_build_object('x', 0, 'y', 0),
      jsonb_build_object('x', 0, 'y', 1),
      jsonb_build_object('x', 0, 'y', 2),
      jsonb_build_object('x', 1, 'y', 2)
    )
  ),
  'sha256:shape-l-4-v1',
  'published'
)
on conflict (id) do nothing;

insert into analysis.shape_positions (
  shape_version_id, ordinal, relative_x, relative_y, weight
)
values
('e1111111-1111-4111-8111-1111111111a1'::uuid, 1, 0, 0, 1),
('e1111111-1111-4111-8111-1111111111a1'::uuid, 2, -1, 0, 1),
('e1111111-1111-4111-8111-1111111111a1'::uuid, 3, 1, 0, 1),
('e1111111-1111-4111-8111-1111111111a1'::uuid, 4, 0, -1, 1),
('e1111111-1111-4111-8111-1111111111a1'::uuid, 5, 0, 1, 1),
('e2222222-2222-4222-8222-2222222222a1'::uuid, 1, 0, 0, 1),
('e2222222-2222-4222-8222-2222222222a1'::uuid, 2, 1, 0, 1),
('e2222222-2222-4222-8222-2222222222a1'::uuid, 3, 2, 0, 1),
('e2222222-2222-4222-8222-2222222222a1'::uuid, 4, 3, 0, 1),
('e3333333-3333-4333-8333-3333333333a1'::uuid, 1, 0, 0, 1),
('e3333333-3333-4333-8333-3333333333a1'::uuid, 2, 0, 1, 1),
('e3333333-3333-4333-8333-3333333333a1'::uuid, 3, 0, 2, 1),
('e3333333-3333-4333-8333-3333333333a1'::uuid, 4, 0, 3, 1),
('e4444444-4444-4444-8444-4444444444a1'::uuid, 1, 0, 0, 1),
('e4444444-4444-4444-8444-4444444444a1'::uuid, 2, 1, 1, 1),
('e4444444-4444-4444-8444-4444444444a1'::uuid, 3, 2, 2, 1),
('e4444444-4444-4444-8444-4444444444a1'::uuid, 4, 3, 3, 1),
('e5555555-5555-4555-8555-5555555555a1'::uuid, 1, 0, 0, 1),
('e5555555-5555-4555-8555-5555555555a1'::uuid, 2, 0, 1, 1),
('e5555555-5555-4555-8555-5555555555a1'::uuid, 3, 0, 2, 1),
('e5555555-5555-4555-8555-5555555555a1'::uuid, 4, 1, 2, 1)
on conflict do nothing;

commit;
