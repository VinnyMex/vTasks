create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  view_type text default 'list',
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  status text default 'todo',
  priority text default 'medium',
  due_date timestamp with time zone,
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  type text default 'quick',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table projects enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;

create policy "public_projects_policy" on projects for all using (true) with check (true);
create policy "public_tasks_policy" on tasks for all using (true) with check (true);
create policy "public_notes_policy" on notes for all using (true) with check (true);

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table projects, tasks, notes;
commit;
