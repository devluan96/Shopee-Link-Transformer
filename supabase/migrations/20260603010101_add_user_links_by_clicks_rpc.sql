create or replace function public.get_user_links_by_clicks(
  workspace_ids uuid[],
  limit_count integer default null,
  offset_count integer default 0
)
returns table (
  id uuid,
  short_code text,
  slug text,
  original_url text,
  custom_domain text,
  workspace_id uuid,
  folder_name text,
  tags text[],
  custom_title text,
  custom_description text,
  custom_image_url text,
  video_url text,
  created_at timestamptz,
  expires_at timestamptz,
  secondary_url text,
  redirect_delay_ms integer,
  usage_context text,
  user_id uuid,
  shopee_affiliate_params text,
  tiktok_affiliate_params text,
  ab_test_enabled boolean,
  ab_variant_b_title text,
  ab_variant_b_description text,
  ab_variant_b_image_url text,
  ab_variant_b_video_url text,
  ab_variant_b_original_url text,
  ab_variant_b_secondary_url text,
  clicks bigint,
  tiktok_clicks bigint,
  total_count bigint
)
language plpgsql
stable
as $$
begin
  if workspace_ids is null or cardinality(workspace_ids) = 0 then
    return;
  end if;

  if limit_count is null then
    return query
      with accessible_links as (
        select l.*
        from public.links l
        where l.workspace_id = any(workspace_ids)
      ),
      ranked_links as (
        select
          l.id,
          l.short_code,
          l.slug,
          l.original_url,
          l.custom_domain,
          l.workspace_id,
          l.folder_name,
          l.tags,
          l.custom_title,
          l.custom_description,
          l.custom_image_url,
          l.video_url,
          l.created_at,
          l.expires_at,
          l.secondary_url,
          l.redirect_delay_ms,
          l.usage_context,
          l.user_id,
          l.shopee_affiliate_params,
          l.tiktok_affiliate_params,
          l.ab_test_enabled,
          l.ab_variant_b_title,
          l.ab_variant_b_description,
          l.ab_variant_b_image_url,
          l.ab_variant_b_video_url,
          l.ab_variant_b_original_url,
          l.ab_variant_b_secondary_url,
          coalesce(click_counts.clicks, 0)::bigint as clicks,
          coalesce(click_counts.tiktok_clicks, 0)::bigint as tiktok_clicks,
          count(*) over ()::bigint as total_count
        from accessible_links l
        left join (
          select
            e.link_id,
            count(*) filter (
              where coalesce(e.user_agent, '') !~* '(bot|crawler|spider|scrape|googlebot|bingbot)'
                and split_part(
                  split_part(
                    split_part(lower(coalesce(e.destination_url, '')), '://', 2),
                    '/',
                    1
                  ),
                  ':',
                  1
                ) ~* '(^|\\.)shopee\\.[a-z.]+$'
            ) as clicks,
            count(*) filter (
              where coalesce(e.user_agent, '') !~* '(bot|crawler|spider|scrape|googlebot|bingbot)'
                and split_part(
                  split_part(
                    split_part(lower(coalesce(e.destination_url, '')), '://', 2),
                    '/',
                    1
                  ),
                  ':',
                  1
                ) ~* '(^|\\.)tiktok\\.com$|(^|\\.)vt\\.tiktok\\.com$|(^|\\.)vm\\.tiktok\\.com$'
            ) as tiktok_clicks
          from public.link_outbound_events e
          where e.link_id in (select id from accessible_links)
          group by e.link_id
        ) click_counts on click_counts.link_id = l.id
      )
      select *
      from ranked_links
      order by (clicks + tiktok_clicks) desc, created_at desc nulls last, id desc;
    return;
  end if;

  return query
    with accessible_links as (
      select l.*
      from public.links l
      where l.workspace_id = any(workspace_ids)
    ),
    ranked_links as (
      select
        l.id,
        l.short_code,
        l.slug,
        l.original_url,
        l.custom_domain,
        l.workspace_id,
        l.folder_name,
        l.tags,
        l.custom_title,
        l.custom_description,
        l.custom_image_url,
        l.video_url,
        l.created_at,
        l.expires_at,
        l.secondary_url,
        l.redirect_delay_ms,
        l.usage_context,
        l.user_id,
        l.shopee_affiliate_params,
        l.tiktok_affiliate_params,
        l.ab_test_enabled,
        l.ab_variant_b_title,
        l.ab_variant_b_description,
        l.ab_variant_b_image_url,
        l.ab_variant_b_video_url,
        l.ab_variant_b_original_url,
        l.ab_variant_b_secondary_url,
        coalesce(click_counts.clicks, 0)::bigint as clicks,
        coalesce(click_counts.tiktok_clicks, 0)::bigint as tiktok_clicks,
        count(*) over ()::bigint as total_count
      from accessible_links l
      left join (
        select
          e.link_id,
          count(*) filter (
            where coalesce(e.user_agent, '') !~* '(bot|crawler|spider|scrape|googlebot|bingbot)'
              and split_part(
                split_part(
                  split_part(lower(coalesce(e.destination_url, '')), '://', 2),
                  '/',
                  1
                ),
                ':',
                1
              ) ~* '(^|\\.)shopee\\.[a-z.]+$'
          ) as clicks,
          count(*) filter (
            where coalesce(e.user_agent, '') !~* '(bot|crawler|spider|scrape|googlebot|bingbot)'
              and split_part(
                split_part(
                  split_part(lower(coalesce(e.destination_url, '')), '://', 2),
                  '/',
                  1
                ),
                ':',
                1
              ) ~* '(^|\\.)tiktok\\.com$|(^|\\.)vt\\.tiktok\\.com$|(^|\\.)vm\\.tiktok\\.com$'
          ) as tiktok_clicks
        from public.link_outbound_events e
        where e.link_id in (select id from accessible_links)
        group by e.link_id
      ) click_counts on click_counts.link_id = l.id
    )
    select *
    from ranked_links
    order by (clicks + tiktok_clicks) desc, created_at desc nulls last, id desc
    limit limit_count
    offset greatest(offset_count, 0);
end;
$$;
