create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link_id uuid references public.links(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  unique_event_key text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_notifications_unique_event_key_idx
  on public.user_notifications (unique_event_key)
  where unique_event_key is not null;

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id, is_read, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.user_notifications;
create policy "Users can read own notifications"
  on public.user_notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.user_notifications;
create policy "Users can update own notifications"
  on public.user_notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

