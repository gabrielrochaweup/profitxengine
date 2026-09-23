-- Editar o conteúdo compartilhado deixa de ser privilégio de admin.
--
-- Este é o fim da mesma lista que começou em Tracking: as telas apareciam,
-- mas o botão de criar/editar/apagar era escondido no React E bloqueado aqui
-- no banco. Abrir só o React daria o pior dos mundos — o botão aparece, a
-- pessoa clica e leva um erro de permissão.
--
-- A regra passa a ser a mesma do resto do app: quem ENXERGA o produto edita
-- o conteúdo dele. Como has_product_access() já responde "aprovado ou admin"
-- (migration 0112), ela sozinha diz tudo, e as políticas abaixo ficam iguais
-- às de leitura das mesmas tabelas.
--
-- Fora daqui, e de propósito: acessos, ai_credentials, ai_provider_settings,
-- products, product_access, profiles e webhook_secrets. São cofre (senha,
-- chave de API) ou controle (quem entra, que papel tem, qual produto existe)
-- — não são ferramenta de trabalho.

-- ── Biblioteca de prompts ───────────────────────────────────────────────
drop policy if exists "prompt_categories_insert_admin_only" on prompt_categories;
drop policy if exists "prompt_categories_update_admin_only" on prompt_categories;
drop policy if exists "prompt_categories_delete_admin_only" on prompt_categories;
create policy "prompt_categories_write_equipe" on prompt_categories
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

drop policy if exists "prompts_insert_admin_only" on prompts;
drop policy if exists "prompts_update_admin_only" on prompts;
drop policy if exists "prompts_delete_admin_only" on prompts;
create policy "prompts_write_equipe" on prompts
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- ── Biblioteca de imagens ───────────────────────────────────────────────
drop policy if exists "image_folders_write_admin_only" on image_folders;
create policy "image_folders_write_equipe" on image_folders
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- Mover imagem entre pastas e renomear era só de admin; apagar já era de
-- quem subiu. Agora as duas coisas são da equipe — a biblioteca é comum.
drop policy if exists "generated_images_update_admin_only" on generated_images;
create policy "generated_images_update_equipe" on generated_images
  for update using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- ── Modelos de prompt (imagens) ─────────────────────────────────────────
drop policy if exists "image_prompt_templates_write_admin_only" on image_prompt_templates;
create policy "image_prompt_templates_write_equipe" on image_prompt_templates
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

drop policy if exists "image_prompt_characters_write_admin_only" on image_prompt_characters;
create policy "image_prompt_characters_write_equipe" on image_prompt_characters
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

drop policy if exists "image_prompt_ctas_write_admin_only" on image_prompt_ctas;
create policy "image_prompt_ctas_write_equipe" on image_prompt_ctas
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

drop policy if exists "image_prompt_tones_write_admin_only" on image_prompt_tones;
create policy "image_prompt_tones_write_equipe" on image_prompt_tones
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- ── Modelos de prompt (conversas) e avatares ────────────────────────────
-- Estas não têm product_id: são bibliotecas do app inteiro. A condição
-- equivalente é "estar aprovado".
drop policy if exists "testimonial_prompt_templates_write_admin_only" on testimonial_prompt_templates;
create policy "testimonial_prompt_templates_write_equipe" on testimonial_prompt_templates
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "testimonial_prompt_styles_write_admin_only" on testimonial_prompt_styles;
create policy "testimonial_prompt_styles_write_equipe" on testimonial_prompt_styles
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "testimonial_prompt_variations_write_admin_only" on testimonial_prompt_variations;
create policy "testimonial_prompt_variations_write_equipe" on testimonial_prompt_variations
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "testimonial_prompt_image_variants_write_admin_only" on testimonial_prompt_image_variants;
create policy "testimonial_prompt_image_variants_write_equipe" on testimonial_prompt_image_variants
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "post_prompt_templates_write_admin_only" on post_prompt_templates;
create policy "post_prompt_templates_write_equipe" on post_prompt_templates
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "avatar_library_insert_admin_only" on avatar_library;
drop policy if exists "avatar_library_delete_admin_only" on avatar_library;
create policy "avatar_library_write_equipe" on avatar_library
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

-- ── Dinâmicas do Dia ────────────────────────────────────────────────────
-- A tela de gerenciar já era aberta a todo mundo; só o banco recusava. Era
-- o pior tipo de bloqueio: o formulário salva e dá erro.
drop policy if exists "message_dynamics_write_admin_only" on message_dynamics;
create policy "message_dynamics_write_equipe" on message_dynamics
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

drop policy if exists "message_dynamic_slots_write_admin_only" on message_dynamic_slots;
create policy "message_dynamic_slots_write_equipe" on message_dynamic_slots
  for all using (public.eh_aprovado() or public.is_admin())
  with check (public.eh_aprovado() or public.is_admin());

-- ── Dashboard: o cartão de webhook recusado ─────────────────────────────
-- O painel do dia lê este log com a sessão de quem está olhando. Sendo de
-- admin, o editor recebia lista vazia e o alerta sumia da tela dele — que é
-- exatamente o contrário do que um painel de "precisa de atenção" serve.
-- Leitura abre; escrita continua de quem recebe webhook (service key).
create policy "tracking_webhook_log_select_equipe" on tracking_webhook_log
  for select using (public.eh_aprovado() or public.is_admin());
