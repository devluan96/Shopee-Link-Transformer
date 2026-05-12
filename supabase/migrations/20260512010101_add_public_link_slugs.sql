alter table public.links
add column if not exists slug text;

create or replace function public.normalize_public_link_slug(source_value text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(source_value, '')));
  normalized := regexp_replace(normalized, '[[:space:]]+', '-', 'g');
  normalized := regexp_replace(
    normalized,
    '["''`.,!?@#$%^&*()+={}\[\]:;<>/\\|]+',
    '-',
    'g'
  );
  normalized := regexp_replace(normalized, '-{2,}', '-', 'g');
  normalized := trim(both '-' from normalized);

  if normalized = '' then
    return 'link';
  end if;

  return normalized;
end;
$$;

do $$
declare
  link_record record;
  base_slug text;
  candidate_slug text;
  slug_suffix integer;
  reserved_slugs text[] := array[
    'api',
    's',
    's-choice',
    'sitemap',
    'robots',
    'manifest',
    'downloads',
    'assets',
    'favicon',
    'og-image',
    'og-default',
    'logo-app-192',
    'logo-app-512'
  ];
begin
  for link_record in
    select id, short_code, custom_title
    from public.links
    where slug is null or btrim(slug) = ''
    order by created_at asc nulls last, id asc
  loop
    base_slug := public.normalize_public_link_slug(
      coalesce(nullif(btrim(link_record.custom_title), ''), link_record.short_code)
    );
    candidate_slug := base_slug;
    slug_suffix := 2;

    while candidate_slug = any(reserved_slugs)
      or exists (
        select 1
        from public.links existing_link
        where existing_link.slug = candidate_slug
          and existing_link.id <> link_record.id
      )
    loop
      candidate_slug := base_slug || '-' || slug_suffix::text;
      slug_suffix := slug_suffix + 1;
    end loop;

    update public.links
    set slug = candidate_slug
    where id = link_record.id;
  end loop;
end;
$$;

create unique index if not exists links_slug_unique
on public.links (slug)
where slug is not null;
