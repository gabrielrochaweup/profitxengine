-- Simulador de conversas agora gera PT/EN/ES de uma vez. O idioma principal
-- (br) continua nas colunas antigas contact_name/contact_status/messages
-- (retrocompatível com conversas já salvas); us/es ficam aqui.
alter table fake_conversations
  add column if not exists translations jsonb;
