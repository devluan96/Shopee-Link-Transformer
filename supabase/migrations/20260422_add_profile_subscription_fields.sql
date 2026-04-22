alter table public.profiles
  add column if not exists subscription_plan text,
  add column if not exists subscription_status text default 'inactive',
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists subscription_requested_plan text;

update public.profiles
set subscription_status = coalesce(subscription_status, 'inactive')
where subscription_status is null;
