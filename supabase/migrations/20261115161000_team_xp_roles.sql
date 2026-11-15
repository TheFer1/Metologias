-- Replace technical roles with the XP roles used by the project.

alter table public.project_members
  drop constraint if exists project_members_role_check;

update public.project_members
set role = case role
  when 'admin' then 'big_boss'
  when 'project_leader' then 'coach'
  when 'developer' then 'programador'
  when 'tester' then 'tester'
  when 'product_owner' then 'cliente'
  else role
end;

alter table public.project_members
  add constraint project_members_role_check
  check (role in ('programador', 'cliente', 'tester', 'tracker', 'coach', 'big_boss'));

alter table public.project_members
  alter column role set default 'programador';
