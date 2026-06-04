alter table public.media_assets
  add column if not exists folder_name text not null default 'root';

alter table public.media_assets
  add column if not exists tags text[] not null default '{}'::text[];

update public.media_assets
set folder_name = coalesce(nullif(folder_name, ''), 'root'),
    tags = coalesce(tags, '{}'::text[]);

create index if not exists media_assets_user_folder_idx
  on public.media_assets (user_id, folder_name, modified_at desc);

create index if not exists media_assets_user_mime_idx
  on public.media_assets (user_id, mime_type);

create index if not exists media_assets_user_tags_idx
  on public.media_assets using gin (tags);

comment on column public.media_assets.folder_name is 'Logical folder name for organizing the media asset';
comment on column public.media_assets.tags is 'Lowercased tags used to classify and search the media asset';
