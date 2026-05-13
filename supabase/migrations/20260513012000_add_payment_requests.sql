create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  user_full_name text,
  account_code text not null,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount bigint not null check (amount > 0),
  transfer_content text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  user_confirmed_at timestamptz not null default now(),
  admin_confirmed_at timestamptz,
  admin_confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_requests_user_created_idx
  on public.payment_requests (user_id, created_at desc);

create index if not exists payment_requests_status_created_idx
  on public.payment_requests (status, created_at desc);

alter table public.payment_requests enable row level security;

drop policy if exists "Users can read own payment requests" on public.payment_requests;
create policy "Users can read own payment requests"
  on public.payment_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create own payment requests" on public.payment_requests;
create policy "Users can create own payment requests"
  on public.payment_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());
