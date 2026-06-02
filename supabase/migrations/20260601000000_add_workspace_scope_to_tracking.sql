alter table public.clicks
  add column if not exists workspace_id uuid;

alter table public.link_outbound_events
  add column if not exists workspace_id uuid;

create index if not exists clicks_workspace_id_created_at_idx
  on public.clicks (workspace_id, created_at desc);

create index if not exists link_outbound_events_workspace_id_created_at_idx
  on public.link_outbound_events (workspace_id, created_at desc);

update public.clicks as c
set workspace_id = l.workspace_id
from public.links as l
where c.link_id = l.id
  and c.workspace_id is null;

update public.link_outbound_events as e
set workspace_id = l.workspace_id
from public.links as l
where e.link_id = l.id
  and e.workspace_id is null;
