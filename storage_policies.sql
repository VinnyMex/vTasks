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
