-- Carência antes de mandar o funil, pra não atropelar upsell.
--
-- O problema: quem compra Starter e aceita o upsell do Elite dois minutos
-- depois recebia "bem-vindo ao Starter" e, logo em seguida, "bem-vindo ao
-- Elite". Na hora em que o Starter dispara, o Elite ainda não existe — não
-- tem como o código adivinhar que vem outro atrás.
--
-- A solução é esperar um pouco antes de enviar: a compra agenda o funil em
-- vez de dispará-lo, e enquanto o prazo não vence uma compra de plano maior
-- só substitui o plano do agendamento. Passado o prazo, sai UMA mensagem,
-- do maior plano que a pessoa alcançou.
--
-- A chave única é (produto, tipo, e-mail) e não inclui o plano: é isso que
-- faz a segunda compra alcançar o mesmo agendamento em vez de criar outro.
-- O prazo original é mantido quando o plano é promovido, senão uma sequência
-- de compras empurraria a mensagem pra frente indefinidamente.
create table public.sendpulse_pendente (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tipo text not null check (tipo in ('boas_vindas', 'contrato')),
  email text not null,
  plano text not null,
  phone text not null default '',
  nome text not null default '',
  enviar_em timestamptz not null,
  criado_em timestamptz not null default now(),
  unique (product_id, tipo, email)
);

create index idx_sendpulse_pendente_vencidos on public.sendpulse_pendente (enviar_em);

alter table public.sendpulse_pendente enable row level security;

create policy sendpulse_pendente_select on public.sendpulse_pendente
  for select using (public.has_product_access(product_id));
