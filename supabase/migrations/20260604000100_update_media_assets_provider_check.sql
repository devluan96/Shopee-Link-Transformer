delete from public.media_assets
where provider = 'local';

delete from public.media_folders f
where not exists (
  select 1
  from public.media_assets a
  where a.user_id = f.user_id
    and a.folder_name = f.name
);

alter table public.media_assets
  drop constraint if exists media_assets_provider_check;

alter table public.media_assets
  add constraint media_assets_provider_check
  check (provider in ('r2', 'cloudinary', 'supabase'));

comment on constraint media_assets_provider_check on public.media_assets
  is 'Allows managed providers r2, cloudinary, and supabase';
