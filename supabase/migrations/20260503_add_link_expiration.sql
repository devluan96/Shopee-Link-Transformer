-- Add link expiration feature
-- Adds expires_at column to links table for automatic link expiration

-- Add expires_at column
alter table public.links
  add column if not exists expires_at timestamptz;

-- Create index for efficient expiration queries
create index if not exists links_expires_at_idx
  on public.links (expires_at)
  where expires_at is not null;

-- Add comment for documentation
comment on column public.links.expires_at is 'Timestamp when the link expires and becomes inaccessible';
