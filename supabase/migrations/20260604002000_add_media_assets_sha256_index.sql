create index if not exists media_assets_user_resource_provider_sha256_idx
  on public.media_assets (user_id, resource_type, provider, ((metadata->>'sha256')));

comment on index public.media_assets_user_resource_provider_sha256_idx
  is 'Supports hash-based reuse lookup for managed media assets';
