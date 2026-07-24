-- Also expose get-own-profile via RPC to avoid any view/schema edge cases.

begin;

create or replace function public.get_my_account_profile()
returns table (
  id uuid,
  email text,
  role text,
  plan text,
  status text
)
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select
    p.id,
    p.email,
    p.role,
    p.plan,
    p.status
  from security.profiles p
  where p.id = auth.uid();
end;
$$;

revoke all on function public.get_my_account_profile() from public;
grant execute on function public.get_my_account_profile() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
