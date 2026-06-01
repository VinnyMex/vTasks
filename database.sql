-- ==========================================
-- SQL DEFINITIVO vTasks Pro (Executar no Supabase)
-- ==========================================

-- 1. Limpar tabelas existentes (Cuidado: deleta dados atuais)
drop table if exists notes;
drop table if exists tasks;
drop table if exists projects;

-- 2. Criar tabela de projetos
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  view_type text default 'list',
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Criar tabela de tarefas
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  status text default 'todo', -- 'todo', 'doing', 'done'
  priority text default 'medium', -- 'low', 'medium', 'high'
  due_date timestamp with time zone,
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Criar tabela de notas (Anexas aos projetos)
create table notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  content text not null,
  type text default 'quick', -- 'quick', 'rich'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Habilitar Segurança (RLS)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;

-- 6. Criar Políticas de Acesso Público (Uso Familiar via Link)
create policy "Permitir tudo para todos - Projetos" on projects for all using (true) with check (true);
create policy "Permitir tudo para todos - Tarefas" on tasks for all using (true) with check (true);
create policy "Permitir tudo para todos - Notas" on notes for all using (true) with check (true);

-- 7. Ativar Sincronização em Tempo Real (Realtime)
begin;
  -- Verifica se a publicação existe antes de criar
  do $$ 
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end $$;
  
  -- Adiciona as tabelas à publicação realtime
  alter publication supabase_realtime add table projects, tasks, notes;
commit;
