-- O contrato do Método TRIAD é um só para os três planos: quem assinou no
-- Starter e depois faz upgrade não assina de novo. Então a assinatura vale
-- para a vida toda do aluno, e o funil pós-contrato precisa acompanhar o
-- plano atual dele — não ficar preso ao plano em que assinou.
--
-- Isso muda a trava do pós-contrato: era uma vez por DOCUMENTO (doc_token),
-- passa a ser uma vez por PLANO ALCANÇADO, igual à do boas-vindas. Com a
-- trava por documento, quem subisse de Starter para Pro nunca receberia o
-- funil do Pro, porque não existe um segundo documento para assinar.
--
-- A tabela antiga cobria só o boas-vindas; a nova cobre os dois funis, com
-- o tipo fazendo parte da chave. Estava vazia (nada disparou ainda), então
-- não há dado a preservar.
drop table if exists public.sendpulse_boasvindas_sent;

create table public.sendpulse_funil_enviado (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tipo text not null check (tipo in ('boas_vindas', 'contrato')),
  email text not null,
  plano text not null,
  created_at timestamptz not null default now(),
  unique (product_id, tipo, email, plano)
);

alter table public.sendpulse_funil_enviado enable row level security;

create policy sendpulse_funil_enviado_select on public.sendpulse_funil_enviado
  for select using (public.has_product_access(product_id));
