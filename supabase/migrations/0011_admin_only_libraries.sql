-- PROFITX Engine — Biblioteca de Prompts e Dinâmicas viram bibliotecas
-- curadas só por admin. A leitura já era global pra qualquer usuário
-- autenticado (prompts_select_all / message_dynamics_select_authenticated,
-- desde o início do projeto) — o que muda aqui é que só admin pode
-- criar/editar/excluir esses dois recursos daqui pra frente; editores e
-- viewers continuam vendo e usando tudo normalmente.

drop policy if exists "prompts_insert_editor_admin" on prompts;
drop policy if exists "prompts_update_own_or_admin" on prompts;
drop policy if exists "prompts_delete_own_or_admin" on prompts;

create policy "prompts_insert_admin_only" on prompts
  for insert with check (public.is_admin());
create policy "prompts_update_admin_only" on prompts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "prompts_delete_admin_only" on prompts
  for delete using (public.is_admin());

drop policy if exists "message_dynamics_write_editor_admin" on message_dynamics;
create policy "message_dynamics_write_admin_only" on message_dynamics
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "message_dynamic_slots_write_editor_admin" on message_dynamic_slots;
create policy "message_dynamic_slots_write_admin_only" on message_dynamic_slots
  for all using (public.is_admin()) with check (public.is_admin());
