-- Repair profiles created without a display name.

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Miembro del equipo'
  )
from auth.users u
on conflict (id) do update
set full_name = excluded.full_name
where nullif(trim(public.profiles.full_name), '') is null
   or lower(trim(public.profiles.full_name)) in ('usuario sin nombre', 'sin nombre')
   or trim(public.profiles.full_name) ~* '^[0-9a-f]{8}-[0-9a-f-]{27,}$';

update public.profiles p
set full_name = coalesce(
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
  'Miembro del equipo'
)
from auth.users u
where p.id = u.id
  and (
    nullif(trim(p.full_name), '') is null
    or lower(trim(p.full_name)) in ('usuario sin nombre', 'sin nombre')
    or trim(p.full_name) ~* '^[0-9a-f]{8}-[0-9a-f-]{27,}$'
  );
