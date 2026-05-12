create unique index if not exists links_short_code_unique_idx
  on public.links (short_code);

create index if not exists clicks_link_id_created_at_idx
  on public.clicks (link_id, created_at desc);

alter table public.links
  alter column redirect_delay_ms set default 3000;

update public.links
set redirect_delay_ms = 3000
where redirect_delay_ms is null
   or redirect_delay_ms < 1000
   or redirect_delay_ms > 10000;

alter table public.links
  drop constraint if exists links_redirect_delay_ms_check;

alter table public.links
  add constraint links_redirect_delay_ms_check
  check (redirect_delay_ms between 1000 and 10000);
