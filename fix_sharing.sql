-- 1. Adicionar user_id nas tabelas existentes
alter table projects add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table tasks add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table notes add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2. Criar tabela de membros da família/equipe
create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null,
  member_id uuid references auth.users(id) not null,
  email text not null,
  role text default 'viewer', -- 'viewer', 'editor', 'admin'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(owner_id, member_id)
);

-- 3. Criar tabela de compartilhamentos específicos (Shares)
create table if not exists shares (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null,
  member_id uuid references auth.users(id) not null,
  resource text not null, -- 'task', 'note', 'expense', 'project'
  resource_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(member_id, resource, resource_id)
);

-- 4. Habilitar RLS e Políticas
alter table members enable row level security;
alter table shares enable row level security;

drop policy if exists "Membros: Dono pode tudo" on members;
create policy "Membros: Dono pode tudo" on members for all using (auth.uid() = owner_id);
drop policy if exists "Membros: Membro pode ver seus convites" on members;
create policy "Membros: Membro pode ver seus convites" on members for select using (auth.uid() = member_id);

drop policy if exists "Shares: Dono pode tudo" on shares;
create policy "Shares: Dono pode tudo" on shares for all using (auth.uid() = owner_id);
drop policy if exists "Shares: Membro pode ver o que foi compartilhado" on shares;
create policy "Shares: Membro pode ver o que foi compartilhado" on shares for select using (auth.uid() = member_id);

-- 5. Função auxiliar para buscar ID por email (necessário para adicionar membros)
create or replace function get_user_id_by_email(p_email text)
returns uuid as $$
  select id from auth.users where email = p_email limit 1;
$$ language sql security definer;

-- 6. Habilitar Realtime para as novas tabelas
begin;
  alter publication supabase_realtime add table members, shares;
commit;
