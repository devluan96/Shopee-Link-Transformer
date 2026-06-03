create table if not exists public.feature_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists feature_usage_events_user_feature_created_idx
  on public.feature_usage_events (user_id, feature_key, created_at desc);
alter table public.feature_usage_events enable row level security;
drop policy if exists "Users can view own feature usage events" on public.feature_usage_events;
create policy "Users can view own feature usage events"
  on public.feature_usage_events
  for select
  to authenticated
  using (user_id = auth.uid());
comment on table public.feature_usage_events is 'Per-user feature usage tracking for quotas such as video uploads per day';
