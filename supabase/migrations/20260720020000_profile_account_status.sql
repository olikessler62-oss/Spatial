-- Project Spatial
-- Migration: 20260720020000_profile_account_status.sql
--
-- Adds account lock status on security.profiles for admin moderation.
-- Billing address / personal data remain future work.

begin;

alter table security.profiles
  add column if not exists status text not null default 'active',
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by uuid references security.profiles (id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_valid'
      and conrelid = 'security.profiles'::regclass
  ) then
    alter table security.profiles
      add constraint profiles_status_valid
      check (status in ('active', 'locked'));
  end if;
end
$$;

create index if not exists idx_profiles_status on security.profiles (status);

comment on column security.profiles.status is
  'Account access status: active | locked (admin-controlled).';
comment on column security.profiles.locked_at is
  'When the account was locked; null when active.';
comment on column security.profiles.locked_by is
  'Admin profile id that locked the account.';

-- Ensure new users start active (handle_new_user already defaults via column default).

commit;
