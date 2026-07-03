-- ======================================================
-- POLÍTICAS DE SEGURANÇA PARA COMPROVANTES (STORAGE)
-- ======================================================
-- Execute este script no SQL Editor do Supabase para
-- liberar o upload e visualização de comprovantes.

-- 1. Permitir visualização pública (essencial para exibir as imagens no app)
create policy "Visualização pública de comprovantes"
on storage.objects for select
using ( bucket_id = 'receipts' );

-- 2. Permitir upload para usuários logados
create policy "Upload de comprovantes por usuários autenticados"
on storage.objects for insert
with check (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

-- 3. Permitir que o usuário atualize seus próprios arquivos
create policy "Usuários podem atualizar seus próprios arquivos"
on storage.objects for update
using ( 
  bucket_id = 'receipts' AND 
  (auth.uid())::text = (storage.foldername(name))[1] 
);

-- 4. Permitir que o usuário exclua seus próprios arquivos
create policy "Usuários podem excluir seus próprios arquivos"
on storage.objects for delete
using ( 
  bucket_id = 'receipts' AND 
  (auth.uid())::text = (storage.foldername(name))[1] 
);

-- ======================================================
-- POLÍTICAS DE SEGURANÇA PARA DOCUMENTOS (BUCKET travel_docs)
-- ======================================================
-- Estas políticas garantem PRIVACIDADE TOTAL para os documentos de viagem.

-- 1. Permitir visualização APENAS do próprio dono do documento
create policy "Usuários podem visualizar seus próprios documentos"
on storage.objects for select
using (
  bucket_id = 'travel_docs' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2. Permitir upload APENAS na pasta privada do próprio usuário
create policy "Upload de documentos por usuários autenticados"
on storage.objects for insert
with check (
  bucket_id = 'travel_docs' AND 
  auth.role() = 'authenticated' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Permitir que o usuário atualize seus próprios documentos
create policy "Usuários podem atualizar seus próprios documentos"
on storage.objects for update
using ( 
  bucket_id = 'travel_docs' AND 
  (auth.uid())::text = (storage.foldername(name))[1] 
);

-- 4. Permitir que o usuário exclua seus próprios documentos
create policy "Usuários podem excluir seus próprios documentos"
on storage.objects for delete
using ( 
  bucket_id = 'travel_docs' AND 
  (auth.uid())::text = (storage.foldername(name))[1] 
);

