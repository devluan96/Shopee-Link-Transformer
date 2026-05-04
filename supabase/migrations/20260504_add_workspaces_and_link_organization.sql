-- Team workspaces, role permissions groundwork, and link organization

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  description text,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspaces_personal_owner_idx
  on public.workspaces (owner_id)
  where is_personal = true;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

alter table public.links
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null,
  add column if not exists folder_name text,
  add column if not exists tags text[] not null default '{}';

create index if not exists links_workspace_id_idx
  on public.links (workspace_id);

create index if not exists links_folder_name_idx
  on public.links (folder_name)
  where folder_name is not null;

create index if not exists links_tags_gin_idx
  on public.links using gin (tags);

insert into public.workspaces (owner_id, name, slug, is_personal)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1), 'Workspace cá nhân'),
  concat('personal-', replace(p.id::text, '-', '')),
  true
from public.profiles p
where not exists (
  select 1
  from public.workspaces w
  where w.owner_id = p.id
    and w.is_personal = true
);

insert into public.workspace_members (workspace_id, user_id, role)
select
  w.id,
  w.owner_id,
  'owner'
from public.workspaces w
where not exists (
  select 1
  from public.workspace_members wm
  where wm.workspace_id = w.id
    and wm.user_id = w.owner_id
);

update public.links l
set workspace_id = w.id
from public.workspaces w
where l.user_id = w.owner_id
  and w.is_personal = true
  and l.workspace_id is null;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "Users can view own workspaces" on public.workspaces;
create policy "Users can view own workspaces"
  on public.workspaces
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "Workspace owners can manage workspaces" on public.workspaces;
create policy "Workspace owners can manage workspaces"
  on public.workspaces
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

drop policy if exists "Users can view workspace members" on public.workspace_members;
create policy "Users can view workspace members"
  on public.workspace_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can manage workspace members" on public.workspace_members;
create policy "Owners can manage workspace members"
  on public.workspace_members
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

comment on column public.links.folder_name is 'Campaign folder or grouping label for the link';
comment on column public.links.tags is 'Free-form tags for link organization';
comment on column public.links.workspace_id is 'Workspace that owns this link';
