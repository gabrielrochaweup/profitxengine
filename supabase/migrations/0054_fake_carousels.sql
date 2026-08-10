-- Terceiro modelo no Gerador de Criativos: "Carrossel" — fundo gerado por
-- IA + texto sobreposto em campos fixos, com suporte a múltiplos frames
-- (baixados de uma vez, numerados). Cada frame fica guardado como um
-- objeto dentro do array jsonb `frames`, mesmo padrão já usado em
-- fake_conversations.messages — não crio tabela filha porque os frames só
-- precisam ser lidos/gravados junto com o post inteiro, sem query
-- individual.
create table fake_carousels (
  id uuid primary key default gen_random_uuid(),
  title text,
  format text check (format in ('quadrado', 'feed', 'stories')) not null default 'quadrado',
  frames jsonb not null default '[]'::jsonb,
  prompt_id uuid references prompts(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table fake_carousels enable row level security;

-- Mesmo padrão de fake_posts (0051): select liberado pra autenticado,
-- insert só editor/admin, update/delete só dono ou admin.
create policy "fake_carousels_select_all" on fake_carousels
  for select using (auth.role() = 'authenticated');
create policy "fake_carousels_insert_editor_admin" on fake_carousels
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "fake_carousels_update_own_or_admin" on fake_carousels
  for update using (created_by = auth.uid() or public.is_admin());
create policy "fake_carousels_delete_own_or_admin" on fake_carousels
  for delete using (created_by = auth.uid() or public.is_admin());

-- Novo contexto de imagem gerada, pro fundo de cada frame do carrossel.
alter table generated_images drop constraint generated_images_context_type_check;
alter table generated_images add constraint generated_images_context_type_check
  check (context_type in ('dinamica_slot', 'livre_engagement', 'x1_message', 'email', 'criativo', 'carrossel'));
