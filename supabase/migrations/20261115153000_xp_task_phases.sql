-- Link work items to an XP phase and iteration (increment).

alter table public.tasks
  add column if not exists iteration_id uuid references public.iterations(id) on delete set null,
  add column if not exists xp_phase text;

alter table public.tasks
  drop constraint if exists tasks_xp_phase_check;

alter table public.tasks
  add constraint tasks_xp_phase_check
  check (xp_phase is null or xp_phase in ('planning', 'design', 'development', 'testing'));

create index if not exists tasks_phase_idx
  on public.tasks(iteration_id, xp_phase, status);
