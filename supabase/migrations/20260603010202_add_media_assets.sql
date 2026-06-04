create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('local', 'cloudinary', 'supabase')),
  resource_type text not null check (resource_type in ('image', 'video', 'audio')),
  object_path text not null,
  public_url text not null,
  file_name text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  modified_at timestamptz not null,
  mime_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_assets_user_provider_path_idx
  on public.media_assets (user_id, provider, object_path);
create index if not exists media_assets_user_resource_modified_idx
  on public.media_assets (user_id, resource_type, modified_at desc);
create index if not exists media_assets_user_created_idx
  on public.media_assets (user_id, created_at desc);

alter table public.media_assets enable row level security;

drop policy if exists "Users can view own media assets" on public.media_assets;
create policy "Users can view own media assets"
  on public.media_assets
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can manage own media assets" on public.media_assets;
create policy "Users can manage own media assets"
  on public.media_assets
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.media_assets is 'Per-user media library metadata for uploaded assets';
