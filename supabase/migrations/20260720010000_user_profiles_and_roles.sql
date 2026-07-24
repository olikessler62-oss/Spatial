-- Project Spatial
-- Migration: 20260720010000_user_profiles_and_roles.sql
--
-- Adds security.profiles with roles admin | client and optional plan for later billing.
-- Ensures oli.kessler62@gmail.com is promoted to admin when present.

begin;

create table if not exists security.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'client',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_valid check (role in ('admin', 'client')),
  constraint profiles_plan_valid check (plan in ('free', 'pro', 'team')),
  constraint profiles_email_not_blank check (btrim(email) <> '')
);

create index if not exists idx_profiles_role on security.profiles (role);
create index if not exists idx_profiles_email on security.profiles (lower(email));

comment on table security.profiles is
  'Application user profile with role (admin|client) and billing plan placeholder.';

create or replace function security.set_profiles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, security
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on security.profiles;
create trigger trg_profiles_set_updated_at
before update on security.profiles
for each row execute function security.set_profiles_updated_at();

create or replace function security.is_platform_admin_email(p_email text)
returns boolean
language sql
immutable
as $$
  select lower(btrim(coalesce(p_email, ''))) = 'oli.kessler62@gmail.com';
$$;

create or replace function security.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, security, auth
as $$
begin
  insert into security.profiles (id, email, role, plan)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when security.is_platform_admin_email(new.email) then 'admin'
      else 'client'
    end,
    'free'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case
      when security.is_platform_admin_email(excluded.email) then 'admin'
      else security.profiles.role
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function security.handle_new_user();

-- Backfill existing auth users
insert into security.profiles (id, email, role, plan)
select
  u.id,
  coalesce(u.email, ''),
  case
    when security.is_platform_admin_email(u.email) then 'admin'
    else 'client'
  end,
  'free'
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  role = case
    when security.is_platform_admin_email(excluded.email) then 'admin'
    else security.profiles.role
  end,
  updated_at = now();

create or replace function security.current_user_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, security
as $$
  select p.role
  from security.profiles p
  where p.id = auth.uid();
$$;

grant execute on function security.current_user_role() to authenticated, service_role;

alter table security.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on security.profiles;
create policy "profiles_select_own_or_admin"
on security.profiles
for select
to authenticated
using (
  id = auth.uid()
  or security.current_user_role() = 'admin'
);

-- Role/plan changes are service-role only for now.
revoke update on table security.profiles from authenticated;

grant usage on schema security to anon, authenticated, service_role;
grant select on table security.profiles to authenticated;
grant all on table security.profiles to service_role;

commit;
