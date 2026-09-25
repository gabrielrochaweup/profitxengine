-- Biblioteca > Números: registro manual dos números de WhatsApp/SendPulse
-- usados pra falar com o cliente, só pra organizar a equipe.
--
-- Sem função ativa de propósito — não dispara nada, não integra com o
-- SendPulse, é puramente exibição: número, nome (renomeável), cor pra
-- identificar rápido, função (suporte/comercial) e a pessoa responsável.
--
-- A pessoa responsável referencia profiles: o dropdown de atribuição usa a
-- lista real de usuários do app, não um texto livre digitado.

create table numeros_de_atendimento (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  numero text not null,
  nome text not null,
  cor text not null default '#4aa8e8',
  funcao text not null check (funcao in ('suporte', 'comercial')),
  -- on delete set null: se a pessoa sair do time, o número não desaparece —
  -- só fica sem responsável até alguém reatribuir.
  usuario_id uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index numeros_de_atendimento_product_idx on numeros_de_atendimento(product_id);
create index numeros_de_atendimento_usuario_idx on numeros_de_atendimento(usuario_id);

alter table numeros_de_atendimento enable row level security;

-- Mesma regra do resto do conteúdo compartilhado desde a 0112: quem enxerga
-- o produto organiza os números dele. Não é cofre (não guarda senha nem
-- token) nem controle de conta — é ferramenta de organização do dia a dia.
create policy "numeros_de_atendimento_select" on numeros_de_atendimento
  for select using (public.has_product_access(product_id));

create policy "numeros_de_atendimento_write" on numeros_de_atendimento
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));
