-- Segredos de webhook (ex: TOP5) armazenados cifrados e gerenciáveis pela
-- tela de Configurações, em vez de fixos em variável de ambiente — permite
-- gerar/rotacionar o segredo sem precisar de deploy. Usa a mesma cifra
-- (CREDENTIALS_ENCRYPTION_KEY) já usada em ai_credentials.
create table if not exists webhook_secrets (
  key text primary key,
  encrypted_secret text not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

alter table webhook_secrets enable row level security;

create policy "webhook_secrets_admin_all" on webhook_secrets
  for all using (public.is_admin()) with check (public.is_admin());
