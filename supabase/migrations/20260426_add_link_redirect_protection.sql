alter table public.links
  add column if not exists secondary_url text,
  add column if not exists redirect_delay_ms integer not null default 3000;

alter table public.links
  alter column redirect_delay_ms set default 3000;

update public.links
set redirect_delay_ms = 3000
where redirect_delay_ms is null or redirect_delay_ms < 1000 or redirect_delay_ms > 10000;

alter table public.links
  drop constraint if exists links_redirect_delay_ms_check;

alter table public.links
  add constraint links_redirect_delay_ms_check
  check (redirect_delay_ms between 1000 and 10000);
