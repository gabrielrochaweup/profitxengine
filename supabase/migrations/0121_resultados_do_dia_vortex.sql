-- Resultados do dia (Pepe, Live, Copy) chegando sozinhos da Vortex.
--
-- Até aqui o placar era digitado à mão em Configurações > Performance de
-- Trading — e estava parado desde 17/07: as dinâmicas mostravam números de
-- julho. Agora a Vortex manda o dia assim que a equipe salva o placar lá
-- (webhook), e o botão "Atualizar resultados" na tela da dinâmica vai buscar
-- quando precisar (mesmo token, direção contrária).

-- ── 1. Tipo novo de endpoint ────────────────────────────────────────────
-- A Vortex espera colar uma URL .../api/tracking/webhooks/resultados-do-dia/...
-- e o token gerado aqui. O kind existe pra que o slug de outro tipo (um
-- checkout, por exemplo) nunca seja aceito nesta rota.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tracking_webhook_endpoints'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%kind%';

  if constraint_name is not null then
    execute format('alter table tracking_webhook_endpoints drop constraint %I', constraint_name);
  end if;

  alter table tracking_webhook_endpoints
    add constraint tracking_webhook_endpoints_kind_check
    check (kind in ('checkout', 'members_area', 'broker', 'contract', 'tool', 'daily_results'));
end $$;

-- ── 2. Um registro por dia recebido ─────────────────────────────────────
-- Único por (produto, data): a Vortex reenvia o MESMO dia quando alguém
-- corrige o placar lá, e isso tem que ser atualização, não um segundo
-- resultado. O upsert por essa chave é o que garante isso.
--
-- "aplicado" diz se o dia foi parar nos resultados que as dinâmicas usam.
-- Nem todo dia vai: correção de um dia ANTIGO fica registrada aqui mas não
-- sobrescreve o dia mais recente, e dia ainda não lançado (preenchido =
-- false) não sobrescreve nada. "motivo" diz por quê, em português.
create table resultados_do_dia (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  data date not null,
  preenchido boolean not null,
  texto text,
  resumo jsonb,
  raw_payload jsonb not null,
  origem text not null check (origem in ('webhook', 'botao')),
  aplicado boolean not null default false,
  motivo text,
  recebido_em timestamptz not null default now(),
  unique (product_id, data)
);

create index resultados_do_dia_aplicado_idx on resultados_do_dia (product_id, data desc) where aplicado;

alter table resultados_do_dia enable row level security;

-- Leitura pra quem enxerga o produto (a tela mostra o último dia recebido).
-- Não há política de escrita: só o webhook e a rota do botão gravam, com a
-- service key — ninguém escreve um resultado direto pelo navegador.
create policy "resultados_do_dia_select" on resultados_do_dia
  for select using (public.has_product_access(product_id));
