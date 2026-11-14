-- XP plan support: assignment metadata, reassignment history and plan bootstrap.

alter table public.project_members
  add column if not exists xp_role text,
  add column if not exists character_name text,
  add column if not exists responsibilities text,
  add column if not exists pairing_group text;

alter table public.test_cases
  add column if not exists assigned_to uuid references auth.users(id);

alter table public.xp_practices
  add column if not exists assigned_to uuid references auth.users(id);

create table if not exists public.assignment_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type text not null check (entity_type in ('user_story', 'task', 'bug', 'test_case', 'xp_practice')),
  entity_id uuid not null,
  previous_assignee uuid references auth.users(id) on delete set null,
  new_assignee uuid references auth.users(id) on delete set null,
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists assignment_history_entity_idx
  on public.assignment_history(project_id, entity_type, entity_id, changed_at desc);

alter table public.assignment_history enable row level security;

drop policy if exists "Project members can view assignment history" on public.assignment_history;
create policy "Project members can view assignment history"
  on public.assignment_history
  for select
  to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "Project members can create assignment history" on public.assignment_history;
create policy "Project members can create assignment history"
  on public.assignment_history
  for insert
  to authenticated
  with check (public.is_project_member(project_id) and changed_by = auth.uid());

create or replace function public.record_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_assignee uuid;
  new_assignee uuid;
  project_id_value uuid;
  kind text;
begin
  if tg_table_name = 'user_stories' then
    old_assignee := old.assigned_to;
    new_assignee := new.assigned_to;
    project_id_value := new.project_id;
    kind := 'user_story';
  elsif tg_table_name = 'tasks' then
    old_assignee := old.assigned_to;
    new_assignee := new.assigned_to;
    select project_id into project_id_value
    from public.user_stories
    where id = new.story_id;
    kind := 'task';
  elsif tg_table_name = 'bugs' then
    old_assignee := old.assigned_to;
    new_assignee := new.assigned_to;
    project_id_value := new.project_id;
    kind := 'bug';
  elsif tg_table_name = 'test_cases' then
    old_assignee := old.assigned_to;
    new_assignee := new.assigned_to;
    project_id_value := new.project_id;
    kind := 'test_case';
  else
    old_assignee := old.assigned_to;
    new_assignee := new.assigned_to;
    project_id_value := new.project_id;
    kind := 'xp_practice';
  end if;

  if old_assignee is distinct from new_assignee and auth.uid() is not null then
    insert into public.assignment_history (
      project_id, entity_type, entity_id, previous_assignee, new_assignee, changed_by
    )
    values (
      project_id_value,
      kind,
      new.id,
      old_assignee,
      new_assignee,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists user_stories_assignment_history on public.user_stories;
create trigger user_stories_assignment_history
  after update of assigned_to on public.user_stories
  for each row execute procedure public.record_assignment_change();

drop trigger if exists tasks_assignment_history on public.tasks;
create trigger tasks_assignment_history
  after update of assigned_to on public.tasks
  for each row execute procedure public.record_assignment_change();

drop trigger if exists bugs_assignment_history on public.bugs;
create trigger bugs_assignment_history
  after update of assigned_to on public.bugs
  for each row execute procedure public.record_assignment_change();

drop trigger if exists test_cases_assignment_history on public.test_cases;
create trigger test_cases_assignment_history
  after update of assigned_to on public.test_cases
  for each row execute procedure public.record_assignment_change();

drop trigger if exists xp_practices_assignment_history on public.xp_practices;
create trigger xp_practices_assignment_history
  after update of assigned_to on public.xp_practices
  for each row execute procedure public.record_assignment_change();

create or replace function public.seed_xp_plan(target_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  planning_id uuid;
  delivery_id uuid;
  story_id uuid;
  story_record record;
begin
  if not public.is_project_member(target_project_id) then
    raise exception 'User is not a member of this project';
  end if;

  select id into planning_id from public.iterations
  where project_id = target_project_id and name = 'Iteración 1 - Core y Diseño'
  limit 1;
  if planning_id is null then
    insert into public.iterations (project_id, name, objective, status)
    values (target_project_id, 'Iteración 1 - Core y Diseño', 'Login, equipo, historias y diseño UML.', 'planned')
    returning id into planning_id;
  end if;

  select id into delivery_id from public.iterations
  where project_id = target_project_id and name = 'Iteración 2 - UI y Pruebas'
  limit 1;
  if delivery_id is null then
    insert into public.iterations (project_id, name, objective, status)
    values (target_project_id, 'Iteración 2 - UI y Pruebas', 'Hormiguero virtual, dashboard, autómata y pruebas.', 'planned')
    returning id into delivery_id;
  end if;

  for story_record in
    select * from (values
      ('HU-01 Login y equipo', 'Como integrante quiero autenticarme y consultar el equipo para iniciar el trabajo en la colonia.', 'Planificación y Diseño', 5, planning_id),
      ('HU-02 Carga de coordenadas CSV', 'Como usuario quiero cargar y visualizar las coordenadas con progreso para validar los datos de entrada.', 'El CSV se carga con progreso 100% y muestra sus coordenadas.', 5, planning_id),
      ('HU-03 Autómata y AntCiberDron', 'Como operador quiero ejecutar el autómata para saber en qué coordenadas debe explotar la bomba.', 'El resultado indica true o false y la coordenada afectada.', 8, delivery_id),
      ('HU-04 Hormiguero virtual', 'Como usuario quiero crear y alimentar hormigas para observar su transformación y supervivencia.', 'Las hormigas nacen como HLarva y evolucionan según su alimento.', 8, delivery_id),
      ('HU-05 Dashboard XP y pruebas', 'Como equipo quiero gestionar historias, tareas, pruebas y evidencias para demostrar trazabilidad XP.', 'El dashboard permite asignar, cambiar estados y consultar métricas.', 5, delivery_id)
    ) as stories(title, description, acceptance_criteria, points, iteration_id)
  loop
    select id into story_id from public.user_stories
    where project_id = target_project_id and title = story_record.title
    limit 1;
    if story_id is null then
      insert into public.user_stories (
        project_id, iteration_id, title, description, acceptance_criteria, story_points, status
      )
      values (
        target_project_id, story_record.iteration_id, story_record.title,
        story_record.description, story_record.acceptance_criteria,
        story_record.points, 'backlog'
      )
      returning id into story_id;
    end if;

    if not exists (
      select 1 from public.tasks
      where tasks.story_id = story_id and tasks.title = 'Definir alcance y criterios'
    ) then
      insert into public.tasks (story_id, title, description, status, estimated_hours)
      values (story_id, 'Definir alcance y criterios', 'Revisar el requerimiento, criterios de aceptación y evidencia.', 'pending', 2);
    end if;
    if not exists (
      select 1 from public.tasks
      where tasks.story_id = story_id and tasks.title = 'Implementar y validar entrega'
    ) then
      insert into public.tasks (story_id, title, description, status, estimated_hours)
      values (story_id, 'Implementar y validar entrega', 'Construir la funcionalidad y ejecutar pruebas asociadas.', 'pending', 4);
    end if;
  end loop;
end;
$$;

grant execute on function public.seed_xp_plan(uuid) to authenticated;
