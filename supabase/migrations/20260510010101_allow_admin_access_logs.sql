drop policy if exists "Admins can view access logs" on public.access_logs;
create policy "Admins can view access logs"
  on public.access_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
