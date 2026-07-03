-- ==========================================
-- SQL DEFINITIVO vTasks Pro (Executar no Supabase)
-- ==========================================
-- ESTE SCRIPT É SEGURO: Não apaga dados existentes.

-- 1. Criar tabela de projetos (se não existir)
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  view_type text default 'list',
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Criar tabela de tarefas (se não existir)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id),
  content text not null,
  status text default 'todo',
  priority text default 'medium',
  due_date timestamp with time zone,
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

-- 3. Criar tabela de notas (se não existir)
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text,
  content text not null,
  type text default 'quick',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- 4. Garantir que as colunas existam
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='notes' and column_name='user_id') then
    alter table notes add column user_id uuid references auth.users(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='notes' and column_name='title') then
    alter table notes add column title text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='user_id') then
    alter table tasks add column user_id uuid references auth.users(id);
  end if;
end $$;

-- 5. Habilitar Segurança (RLS)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;

-- 6. Políticas de Acesso
drop policy if exists "Acesso individual - Projetos" on projects;
create policy "Acesso individual - Projetos" on projects for all using (true) with check (true);

drop policy if exists "Acesso individual - Notas" on notes;
create policy "Acesso individual - Notas" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Acesso individual - Tarefas" on tasks;
create policy "Acesso individual - Tarefas" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. Ativar Sincronização em Tempo Real (Realtime)
do $$ 
begin
  -- Cria a publicação se não existir
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  -- Adiciona as tabelas (usando exceção interna para evitar erro se já existirem)
  begin
    alter publication supabase_realtime add table projects, tasks, notes;
  exception when others then
    -- Ignora se já estiverem na publicação
  end;
end $$;

-- 8. Criar tabela de cenários da Espanha
create table if not exists espanha_scenarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  author text,
  budget numeric not null,
  form_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

alter table espanha_scenarios enable row level security;

drop policy if exists "Acesso individual - Cenários Espanha" on espanha_scenarios;
create policy "Acesso individual - Cenários Espanha" on espanha_scenarios for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9. Criar tabela de gastos (se não existir) e coluna de comprovante
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  recipient text,
  quantity numeric default 1,
  amount_brl numeric,
  amount_eur numeric,
  amount_usd numeric,
  currency text not null default 'BRL',
  category text,
  date date not null default current_date,
  link text,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- Garantir que a coluna receipt_url exista caso a tabela já existisse
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='expenses' and column_name='receipt_url') then
    alter table expenses add column receipt_url text;
  end if;
end $$;

alter table expenses enable row level security;

drop policy if exists "Acesso individual - Gastos" on expenses;
create policy "Acesso individual - Gastos" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 10. Ativar Sincronização em Tempo Real (Realtime) para todas as tabelas
do $$ 
begin
  begin
    alter publication supabase_realtime add table projects, tasks, notes, espanha_scenarios, expenses;
  exception when others then
  end;
end $$;

-- ======================================================
-- MÓDULO IMIGRAPRO (IMIGRAÇÃO & VIAGEM)
-- ======================================================

-- 11. Criar tabela de perfil de imigração (se não existir)
create table if not exists immigration_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  destination_country text not null default 'Espanha',
  destination_city text not null default 'Menasalbas / Toledo',
  immigration_goal text not null default 'Arraigo Social/Socioformativo',
  current_quarter int not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

alter table immigration_profiles enable row level security;
drop policy if exists "Acesso individual - Perfis Imigração" on immigration_profiles;
create policy "Acesso individual - Perfis Imigração" on immigration_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 12. Criar tabela de checklist de imigração (se não existir)
create table if not exists immigration_checklists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  quarter int not null,
  title text not null,
  description text,
  category text, -- URGENTE, DOC, LEI, LINK
  link text,
  is_completed boolean default false,
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

alter table immigration_checklists enable row level security;
drop policy if exists "Acesso individual - Checklists Imigração" on immigration_checklists;
create policy "Acesso individual - Checklists Imigração" on immigration_checklists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 13. Criar tabela de contatos de imigração (se não existir)
create table if not exists immigration_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  address text,
  purpose text,
  phone text,
  email text,
  website text,
  sede_electronica text,
  category text, -- oficial, saude, educacao, ong, outros
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

alter table immigration_contacts enable row level security;
drop policy if exists "Acesso individual - Contatos Imigração" on immigration_contacts;
create policy "Acesso individual - Contatos Imigração" on immigration_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 14. Criar tabela de documentos de viagem (se não existir)
create table if not exists travel_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null, -- identidade, moradia, educacao, trabalho, saude, outro
  file_url text not null,
  expiry_date date,
  associated_quarter int,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default now()
);

alter table travel_documents enable row level security;
drop policy if exists "Acesso individual - Documentos Viagem" on travel_documents;
create policy "Acesso individual - Documentos Viagem" on travel_documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 15. Ativar Sincronização em Tempo Real para as novas tabelas
do $$ 
begin
  begin
    alter publication supabase_realtime add table immigration_profiles, immigration_checklists, immigration_contacts, travel_documents;
  exception when others then
  end;
end $$;

-- 16. Adicionar coluna extended_state para salvar todo o estado do My-Travel-Docs (JSONB)
alter table immigration_profiles add column if not exists extended_state jsonb default '{}'::jsonb;


