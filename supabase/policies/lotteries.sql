alter table public.lotteries
enable row level security;

drop policy if exists "lotteries_public_read"
on public.lotteries;

create policy "lotteries_public_read"

on public.lotteries

for select

using (true);