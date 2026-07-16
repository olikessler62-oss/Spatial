alter table public.datasets enable row level security;

drop policy if exists "Public datasets are readable"
on public.datasets;

create policy "Public datasets are readable"
on public.datasets
for select
using (visibility in ('public', 'system'));