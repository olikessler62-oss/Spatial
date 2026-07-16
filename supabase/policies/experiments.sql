alter table public.experiments
enable row level security;

drop policy if exists "experiments_select"
on public.experiments;

create policy "experiments_select"

on public.experiments

for select

using (

visibility='public'

OR

visibility='community'

OR

created_by = auth.uid()

);

create policy "experiments_insert"

on public.experiments

for insert

with check (

created_by = auth.uid()

);

create policy "experiments_update"

on public.experiments

for update

using (

created_by = auth.uid()

);

create policy "experiments_delete"

on public.experiments

for delete

using (

created_by = auth.uid()

);