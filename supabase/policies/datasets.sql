alter table public.datasets
enable row level security;

drop policy if exists "datasets_select"
on public.datasets;

create policy "datasets_select"

on public.datasets

for select

using (

visibility='public'

OR

visibility='system'

OR

created_by = auth.uid()

);

drop policy if exists "datasets_insert"
on public.datasets;

create policy "datasets_insert"

on public.datasets

for insert

with check (

created_by = auth.uid()

);

drop policy if exists "datasets_update"
on public.datasets;

create policy "datasets_update"

on public.datasets

for update

using (

created_by = auth.uid()

);

drop policy if exists "datasets_delete"
on public.datasets;

create policy "datasets_delete"

on public.datasets

for delete

using (

created_by = auth.uid()

);