create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_invitations_pending_unique_idx
  on public.workspace_invitations (workspace_id, invited_user_id)
  where status = 'pending';

create index if not exists workspace_invitations_invited_user_idx
  on public.workspace_invitations (invited_user_id, status);

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id, status);

alter table public.workspace_invitations enable row level security;

drop policy if exists "Users can view related workspace invitations" on public.workspace_invitations;
create policy "Users can view related workspace invitations"
  on public.workspace_invitations
  for select
  to authenticated
  using (
    invited_user_id = auth.uid()
    or exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

drop policy if exists "Owners can manage workspace invitations" on public.workspace_invitations;
create policy "Owners can manage workspace invitations"
  on public.workspace_invitations
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

drop policy if exists "Invited users can respond to invitations" on public.workspace_invitations;
create policy "Invited users can respond to invitations"
  on public.workspace_invitations
  for update
  to authenticated
  using (invited_user_id = auth.uid())
  with check (invited_user_id = auth.uid());
