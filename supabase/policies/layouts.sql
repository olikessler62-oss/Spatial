alter table public.layouts
enable row level security;

drop policy if exists "layouts_select"
on public.layouts;

create policy "layouts_select"

on public.layouts

for select

using (

visibility='public'

OR

created_by = auth.uid()

);

create policy "layouts_insert"

on public.layouts

for insert

with check (

created_by = auth.uid()

);

create policy "layouts_update"

on public.layouts

for update

using (

created_by = auth.uid()

);

create policy "layouts_delete"

on public.layouts

for delete

using (

created_by = auth.uid()

);