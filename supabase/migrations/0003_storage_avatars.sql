-- Políticas de RLS para o bucket público 'conversation-avatars' (já criado via
-- Storage API). Permite que qualquer usuário autenticado faça upload/atualize/
-- remova avatares de contatos fictícios usados no Simulador de Conversas;
-- leitura é pública (bucket público, servido via CDN).

create policy "conversation_avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'conversation-avatars');

create policy "conversation_avatars_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'conversation-avatars');

create policy "conversation_avatars_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'conversation-avatars');

create policy "conversation_avatars_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'conversation-avatars');
