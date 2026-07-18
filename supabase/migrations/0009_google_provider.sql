-- Terceiro provedor de IA: Google (Gemini/Nano Banana), texto e imagem.
alter table ai_credentials drop constraint if exists ai_credentials_provider_check;
alter table ai_credentials add constraint ai_credentials_provider_check
  check (provider in ('openai', 'anthropic', 'google'));

alter table ai_provider_settings drop constraint if exists ai_provider_settings_provider_check;
alter table ai_provider_settings add constraint ai_provider_settings_provider_check
  check (provider in ('openai', 'anthropic', 'google'));

-- Políticas do bucket público 'generated-images' (criado via script/Storage API).
-- Guarda as imagens geradas por IA (Dinâmicas do Dia, Mensagens X1, E-mails) como
-- arquivo permanente no nosso Storage, já que os modelos mais novos (GPT Image,
-- Gemini/Nano Banana) devolvem base64 em vez de URL hospedada.
create policy "generated_images_select_public"
  on storage.objects for select
  using (bucket_id = 'generated-images');

create policy "generated_images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'generated-images');
