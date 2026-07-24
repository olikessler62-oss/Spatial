-- Project Spatial
-- Migration: 20260720180000_layout_names_geometry_only.sql
--
-- Layout names store geometry only (e.g. "Raster 7×7"). Lottery comes from lottery_id.

begin;

-- Prefer geometry derived from the latest layout_version parameters.
with latest_version as (
  select distinct on (lv.layout_id)
    lv.layout_id,
    lv.parameters
  from analysis.layout_versions lv
  order by lv.layout_id, lv.version desc
),
renamed as (
  select
    l.id,
    case
      when coalesce(lv.parameters->>'type', l.layout_type) = 'circle'
        then 'Ring ' || coalesce(
          nullif(lv.parameters->>'size', ''),
          nullif(lv.parameters->>'positionCount', ''),
          ''
        )
      when (lv.parameters ? 'rows') and (lv.parameters ? 'columns')
        then 'Raster ' || (lv.parameters->>'rows') || '×' || (lv.parameters->>'columns')
      when l.name ~* '\sRaster\s'
        then regexp_replace(l.name, '^.*\s(Raster\s.+)$', '\1', 'i')
      when l.name ~* '\sRing\s'
        then regexp_replace(l.name, '^.*\s(Ring\s.+)$', '\1', 'i')
      else l.name
    end as geometry_name
  from analysis.layouts l
  left join latest_version lv on lv.layout_id = l.id
)
update analysis.layouts l
set name = trim(both from r.geometry_name)
from renamed r
where l.id = r.id
  and trim(both from r.geometry_name) <> ''
  and l.name is distinct from trim(both from r.geometry_name);

-- Seed layouts (if still present with old names)
update analysis.layouts
set name = 'Raster 7×7'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid;

update analysis.layouts
set name = 'Raster 5×10'
where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid;

commit;
