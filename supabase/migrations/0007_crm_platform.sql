-- Terceira plataforma no Simulador de Conversas: chat estilo CRM/atendimento
alter table fake_conversations
  drop constraint if exists fake_conversations_platform_check;

alter table fake_conversations
  add constraint fake_conversations_platform_check
  check (platform in ('whatsapp', 'instagram', 'crm'));

alter table fake_conversations
  add column if not exists crm_instance_name text,
  add column if not exists crm_assignee_name text,
  add column if not exists crm_assignee_avatar_url text,
  add column if not exists crm_status text;
