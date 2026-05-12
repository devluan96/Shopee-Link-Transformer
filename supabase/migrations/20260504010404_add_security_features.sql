create table if not exists public.user_security_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  two_factor_enabled boolean not null default false,
  two_factor_secret text,
  two_factor_enabled_at timestamptz,
  last_2fa_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  ip_address text,
  method text not null,
  path text not null,
  status_code integer not null,
  user_agent text,
  referer text,
  blocked boolean not null default false,
  block_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  reason text,
  blocked_by uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_logs_user_id_idx
  on public.access_logs (user_id, created_at desc);

create index if not exists access_logs_ip_idx
  on public.access_logs (ip_address, created_at desc);

alter table public.user_security_settings enable row level security;
alter table public.access_logs enable row level security;
alter table public.blocked_ips enable row level security;

drop policy if exists "Users can view own security settings" on public.user_security_settings;
create policy "Users can view own security settings"
  on public.user_security_settings
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can manage own security settings" on public.user_security_settings;
create policy "Users can manage own security settings"
  on public.user_security_settings
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can view own access logs" on public.access_logs;
create policy "Users can view own access logs"
  on public.access_logs
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can view blocked ips" on public.blocked_ips;
create policy "Admins can view blocked ips"
  on public.blocked_ips
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

comment on table public.user_security_settings is '2FA/TOTP settings per user';
comment on table public.access_logs is 'Detailed access history for authenticated and blocked requests';
comment on table public.blocked_ips is 'IP blacklist maintained by admins';
