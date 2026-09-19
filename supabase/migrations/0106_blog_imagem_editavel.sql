-- A capa do post deixa de ser um resultado e vira uma coisa que se ajusta.
--
-- O prompt que gerou a imagem era descartado de propósito: servia uma vez, na
-- chamada logo depois de escrever o texto, e virava "dado morto na tabela".
-- Só que sem ele não dá pra fazer o que a edição pede — olhar a capa, mexer
-- numa palavra do prompt e gerar de novo. Quem quisesse ajustar tinha que
-- reescrever o prompt do zero, adivinhando o que o modelo tinha recebido.
--
-- Ele passa a ser guardado junto do post, como o texto e o alt: é rascunho de
-- trabalho, não histórico.

alter table blog_posts add column if not exists imagem_prompt text;

-- Bucket próprio pra capa enviada do computador.
--
-- Dava pra reaproveitar o 'reference-images', que já é público — mas lá são
-- imagens que servem de REFERÊNCIA pra uma geração, e some sem consequência.
-- A capa de um post publicado é o oposto disso: ela é servida numa página
-- pública e some da página se o arquivo sumir.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "blog_images_select_public" on storage.objects;
create policy "blog_images_select_public"
  on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "blog_images_insert_authenticated" on storage.objects;
create policy "blog_images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

drop policy if exists "blog_images_update_authenticated" on storage.objects;
create policy "blog_images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images');

drop policy if exists "blog_images_delete_authenticated" on storage.objects;
create policy "blog_images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');
