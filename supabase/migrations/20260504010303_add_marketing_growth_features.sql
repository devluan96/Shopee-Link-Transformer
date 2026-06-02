alter table public.links
  add column if not exists custom_domain text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists shopee_affiliate_params text,
  add column if not exists tiktok_affiliate_params text,
  add column if not exists ab_test_enabled boolean not null default false,
  add column if not exists ab_variant_b_title text,
  add column if not exists ab_variant_b_description text,
  add column if not exists ab_variant_b_image_url text,
  add column if not exists ab_variant_b_video_url text,
  add column if not exists ab_variant_b_original_url text,
  add column if not exists ab_variant_b_secondary_url text;
comment on column public.links.custom_domain is 'Optional white-label domain used to render the short link URL';
comment on column public.links.utm_source is 'Stored UTM source appended during link creation';
comment on column public.links.utm_medium is 'Stored UTM medium appended during link creation';
comment on column public.links.utm_campaign is 'Stored UTM campaign appended during link creation';
comment on column public.links.utm_content is 'Stored UTM content appended during link creation';
comment on column public.links.utm_term is 'Stored UTM term appended during link creation';
comment on column public.links.shopee_affiliate_params is 'Optional querystring params appended automatically to Shopee URLs';
comment on column public.links.tiktok_affiliate_params is 'Optional querystring params appended automatically to TikTok URLs';
comment on column public.links.ab_test_enabled is 'Whether the short link should split traffic between A/B landing variants';
comment on column public.links.ab_variant_b_title is 'Variant B title override';
comment on column public.links.ab_variant_b_description is 'Variant B description override';
comment on column public.links.ab_variant_b_image_url is 'Variant B thumbnail/image override';
comment on column public.links.ab_variant_b_video_url is 'Variant B video override';
comment on column public.links.ab_variant_b_original_url is 'Variant B primary destination override';
comment on column public.links.ab_variant_b_secondary_url is 'Variant B secondary destination override';
