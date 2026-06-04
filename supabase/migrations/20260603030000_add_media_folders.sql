create table if not exists public.media_folders (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, name)
);

create index if not exists media_folders_user_name_idx
  on public.media_folders (user_id, name);

alter table public.media_folders enable row level security;

drop policy if exists "Users can view own media folders" on public.media_folders;
create policy "Users can view own media folders"
  on public.media_folders
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can manage own media folders" on public.media_folders;
create policy "Users can manage own media folders"
  on public.media_folders
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into public.media_folders (user_id, name)
select distinct user_id, folder_name
from public.media_assets
where provider = 'local' and folder_name is not null and folder_name <> 'root'
on conflict (user_id, name) do nothing;

comment on table public.media_folders is 'Per-user logical folders for media assets';
