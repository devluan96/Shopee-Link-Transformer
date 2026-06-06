insert into public.app_settings (key, value)
values (
  'video_upload_provider_preference',
  jsonb_build_object('provider', 'cloudinary')
)
on conflict (key) do nothing;

comment on table public.app_settings is 'Shared application settings for domains, deep links, and upload provider preferences';
