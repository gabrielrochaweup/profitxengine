-- Bucket pra imagem de referência anexada na geração de imagem (ex: foto do
-- Felipe Trader, pra IA usar como base visual em vez de só o texto do
-- prompt). Cria o bucket via SQL (insert direto em storage.buckets) em vez
-- de pedir passo manual no dashboard, e replica o mesmo padrão de RLS já
-- usado no bucket 'conversation-avatars' (0003_storage_avatars.sql):
-- leitura pública, escrita só pra autenticado.

insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true)
on conflict (id) do nothing;

create policy "reference_images_select_public"
  on storage.objects for select
  using (bucket_id = 'reference-images');

create policy "reference_images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reference-images');

create policy "reference_images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'reference-images');

create policy "reference_images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reference-images');
