-- Incremental XP support tables. Existing tables are not modified or dropped.

alter table public.user_stories
  add column if not exists acceptance_criteria text;

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  story_id uuid references public.user_stories(id) on delete set null,
  title text not null,
  steps text,
  expected_result text,
  actual_result text,
  status text not null default 'pending' check (status in ('pending', 'passed', 'failed', 'blocked')),
  executed_by uuid references auth.users(id),
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bugs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  story_id uuid references public.user_stories(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  reported_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  entity_type text not null check (entity_type in ('story', 'task', 'iteration', 'bug', 'test_case')),
  entity_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_practices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  practice text not null check (practice in ('pair_programming', 'test_driven_development', 'refactoring', 'continuous_integration')),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  notes text,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists test_cases_project_idx on public.test_cases(project_id);
create index if not exists bugs_project_idx on public.bugs(project_id);
create index if not exists comments_entity_idx on public.comments(entity_type, entity_id);
create index if not exists xp_practices_project_idx on public.xp_practices(project_id);

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project_id and pm.user_id = auth.uid()
  );
$$;

alter table public.test_cases enable row level security;
alter table public.bugs enable row level security;
alter table public.comments enable row level security;
alter table public.xp_practices enable row level security;

drop policy if exists "Project members can manage test cases" on public.test_cases;
create policy "Project members can manage test cases" on public.test_cases
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
drop policy if exists "Project members can manage bugs" on public.bugs;
create policy "Project members can manage bugs" on public.bugs
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
drop policy if exists "Project members can manage comments" on public.comments;
create policy "Project members can manage comments" on public.comments
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
drop policy if exists "Project members can manage XP practices" on public.xp_practices;
create policy "Project members can manage XP practices" on public.xp_practices
  for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
