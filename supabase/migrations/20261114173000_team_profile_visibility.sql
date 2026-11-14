-- Authenticated team members need profile names for assignment selectors.
-- Email addresses remain private because profiles only exposes full_name.

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can view team profiles" on public.profiles;
create policy "Authenticated users can view team profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

update public.profiles p
set full_name = coalesce(
  nullif(u.raw_user_meta_data ->> 'full_name', ''),
  nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
  'Usuario'
)
from auth.users u
where p.id = u.id
  and (
    nullif(trim(p.full_name), '') is null
    or trim(p.full_name) ~* '^[0-9a-f]{8}-[0-9a-f-]{27,}$'
  );
