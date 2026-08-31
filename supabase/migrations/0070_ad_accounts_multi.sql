-- Suporte a múltiplas contas de anúncio por plataforma (antes só permitia
-- uma Meta + uma Google por produto, via unique(product_id, platform)) —
-- agora várias contas por plataforma, cada uma com um nome (label) pra
-- identificar, editável e removível independente.

-- Derruba a unique constraint original (product_id, platform) sem depender
-- do nome exato que o Postgres gerou pra ela.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'ad_platform_credentials'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 2;
  if constraint_name is not null then
    execute format('alter table ad_platform_credentials drop constraint %I', constraint_name);
  end if;
end $$;

alter table ad_platform_credentials add column label text;

-- Ainda impede duas entradas pra exatamente a mesma conta de anúncio, mas
-- permite várias contas diferentes da mesma plataforma.
alter table ad_platform_credentials
  add constraint ad_platform_credentials_account_unique unique (product_id, platform, ad_account_id);
