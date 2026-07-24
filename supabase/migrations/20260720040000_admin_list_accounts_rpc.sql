-- Project Spatial
-- Migration: 20260720040000_admin_list_accounts_rpc.sql
--
-- List accounts via public RPC so the Data API never needs schema "security".

begin;

create or replace function public.admin_list_account_profiles()
returns table (
  id uuid,
  email text,
  role text,
  plan text,
  status text,
  created_at timestamptz,
  locked_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
declare
  caller_role text;
begin
  -- service_role has no auth.uid(); allow that path for server admin client.
  if auth.uid() is null then
    return query
    select
      p.id,
      p.email,
      p.role,
      p.plan,
      p.status,
      p.created_at,
      p.locked_at
    from security.profiles p
    order by p.created_at desc;
    return;
  end if;

  select p.role into caller_role
  from security.profiles p
  where p.id = auth.uid();

  if caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    p.id,
    p.email,
    p.role,
    p.plan,
    p.status,
    p.created_at,
    p.locked_at
  from security.profiles p
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_account_profiles() from public;
grant execute on function public.admin_list_account_profiles() to service_role;

notify pgrst, 'reload schema';

commit;
