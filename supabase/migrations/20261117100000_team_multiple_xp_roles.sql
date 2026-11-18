alter table public.project_members
  add column if not exists secondary_role text;

alter table public.project_members
  drop constraint if exists project_members_secondary_role_check;

alter table public.project_members
  add constraint project_members_secondary_role_check
  check (
    secondary_role is null
    or secondary_role in ('programador', 'tester', 'tracker', 'coach', 'big_boss')
  );

alter table public.project_members
  drop constraint if exists project_members_roles_distinct_check;

alter table public.project_members
  add constraint project_members_roles_distinct_check
  check (secondary_role is null or secondary_role <> role);

create or replace function public.validate_project_member_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.secondary_role = 'cliente' or new.role = 'cliente' then
    if new.secondary_role is not null and new.secondary_role <> 'cliente' then
      raise exception 'El rol Cliente no puede combinarse con otro rol';
    end if;

    if exists (
      select 1
      from public.project_members
      where project_id = new.project_id
        and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and (role = 'cliente' or secondary_role = 'cliente')
    ) then
      raise exception 'Solo puede haber un miembro con el rol Cliente en este proyecto';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_project_member_roles_trigger on public.project_members;

create trigger validate_project_member_roles_trigger
  before insert or update of role, secondary_role, project_id
  on public.project_members
  for each row
  execute function public.validate_project_member_roles();
