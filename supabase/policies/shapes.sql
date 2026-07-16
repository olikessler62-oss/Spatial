alter table public.shapes
enable row level security;

drop policy if exists "shapes_select"
on public.shapes;

create policy "shapes_select"

on public.shapes

for select

using (

visibility='public'

OR

created_by = auth.uid()

);

create policy "shapes_insert"

on public.shapes

for insert

with check (

created_by = auth.uid()

);

create policy "shapes_update"

on public.shapes

for update

using (

created_by = auth.uid()

);

create policy "shapes_delete"

on public.shapes

for delete

using (

created_by = auth.uid()

);