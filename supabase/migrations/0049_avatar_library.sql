-- Banco de fotos de avatar reutilizáveis pro Simulador de Conversas — em vez
-- de fazer upload manual toda vez, um pool de fotos pré-carregadas que é
-- sorteado automaticamente. `last_used_at` controla o "não repete até todos
-- serem usados": sorteia entre as com last_used_at nulo (nunca usadas nesse
-- ciclo); quando não sobra nenhuma, a aplicação reseta todas pra nulo e
-- começa um novo ciclo (lógica em src/lib/avatar-library.ts, não aqui).
-- Bucket criado via SQL (mesmo padrão de 0016_reference_images_bucket.sql).

insert into storage.buckets (id, name, public)
values ('avatar-library', 'avatar-library', true)
on conflict (id) do nothing;

create policy "avatar_library_bucket_select_public"
  on storage.objects for select
  using (bucket_id = 'avatar-library');

create policy "avatar_library_bucket_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatar-library');

create policy "avatar_library_bucket_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatar-library');

create policy "avatar_library_bucket_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatar-library');

create table avatar_library (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  storage_path text not null,
  last_used_at timestamptz,
  created_at timestamptz default now() not null
);

alter table avatar_library enable row level security;

-- Leitura liberada pra todo autenticado. Update também liberado pra todo
-- autenticado (é quem marca "usado" ao sortear um avatar, não só admin).
-- Insert/delete ficam restritos a admin — a carga inicial é feita via
-- service role key, que já ignora RLS.
create policy "avatar_library_select_all" on avatar_library
  for select using (auth.role() = 'authenticated');
create policy "avatar_library_update_authenticated" on avatar_library
  for update to authenticated using (auth.role() = 'authenticated');
create policy "avatar_library_insert_admin_only" on avatar_library
  for insert with check (public.is_admin());
create policy "avatar_library_delete_admin_only" on avatar_library
  for delete using (public.is_admin());
