-- Authenticated team members need profile names for assignment selectors.
-- Email addresses remain private because profiles only exposes full_name.

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can view team profiles" on public.profiles;
create policy "Authenticated users can view team profiles"
  on public.profiles
  for select
  to authenticated
  using (true);
