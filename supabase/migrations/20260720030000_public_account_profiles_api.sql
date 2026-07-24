-- Project Spatial
-- Migration: 20260720030000_public_account_profiles_api.sql
--
-- Expose account profiles to PostgREST via public view/RPCs.
-- The security schema is not in the Data API exposed schemas list.

begin;

create or replace view public.account_profiles
with (security_invoker = true) as
select
  id,
  email,
  role,
  plan,
  status,
  created_at,
  updated_at,
  locked_at,
  locked_by
from security.profiles;

comment on view public.account_profiles is
  'API-facing view over security.profiles (RLS enforced as invoker).';

grant select on table public.account_profiles to authenticated, service_role;

create or replace function public.ensure_account_profile(
  p_id uuid,
  p_email text,
  p_role text,
  p_plan text default 'free'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
begin
  if p_role not in ('admin', 'client') then
    raise exception 'Invalid role';
  end if;

  if p_plan not in ('free', 'pro', 'team') then
    raise exception 'Invalid plan';
  end if;

  insert into security.profiles (id, email, role, plan, status)
  values (p_id, p_email, p_role, p_plan, 'active')
  on conflict (id) do update
  set
    email = excluded.email,
    role = case
      when security.is_platform_admin_email(excluded.email) then 'admin'
      when security.profiles.role = 'admin' then 'admin'
      else excluded.role
    end,
    updated_at = now();
end;
$$;

revoke all on function public.ensure_account_profile(uuid, text, text, text) from public;
grant execute on function public.ensure_account_profile(uuid, text, text, text)
  to service_role;

create or replace function public.admin_set_account_status(
  p_account_id uuid,
  p_status text,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
declare
  actor_role text;
  target_email text;
  target_role text;
begin
  select role into actor_role
  from security.profiles
  where id = p_actor_id;

  if actor_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  if p_status not in ('active', 'locked') then
    raise exception 'Invalid status';
  end if;

  if p_account_id = p_actor_id then
    raise exception 'Cannot lock own account';
  end if;

  select email, role into target_email, target_role
  from security.profiles
  where id = p_account_id;

  if target_email is null then
    raise exception 'Account not found';
  end if;

  if security.is_platform_admin_email(target_email) or target_role = 'admin' then
    raise exception 'Admin accounts cannot be locked';
  end if;

  if p_status = 'locked' then
    update security.profiles
    set
      status = 'locked',
      locked_at = now(),
      locked_by = p_actor_id,
      updated_at = now()
    where id = p_account_id;
  else
    update security.profiles
    set
      status = 'active',
      locked_at = null,
      locked_by = null,
      updated_at = now()
    where id = p_account_id;
  end if;
end;
$$;

revoke all on function public.admin_set_account_status(uuid, text, uuid) from public;
grant execute on function public.admin_set_account_status(uuid, text, uuid)
  to service_role;

create or replace function public.admin_promote_platform_admin(
  p_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, security, public
as $$
begin
  if not security.is_platform_admin_email(p_email) then
    raise exception 'Not a platform admin email';
  end if;

  update security.profiles
  set
    role = 'admin',
    email = p_email,
    updated_at = now()
  where id = p_id;
end;
$$;

revoke all on function public.admin_promote_platform_admin(uuid, text) from public;
grant execute on function public.admin_promote_platform_admin(uuid, text)
  to service_role;

notify pgrst, 'reload schema';

commit;
