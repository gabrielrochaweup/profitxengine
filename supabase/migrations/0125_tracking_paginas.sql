-- Tracking por PÁGINA.
--
-- O mesmo script roda em várias páginas (landing, quiz do Inlead, checkout,
-- login do Pepe…), mas até aqui só a PRIMEIRA página de cada pessoa ficava
-- guardada (tracking_leads.landing_url). Quem chegava na página B depois de
-- já ter passado pela A sumia da B — e não dava pra comparar páginas.
--
-- Agora cada pessoa ganha uma linha por página que visitou, com a origem
-- (UTMs) daquela chegada e quantas vezes abriu. O collect grava; a tela
-- Performance → Páginas lê pela função tracking_paginas_report.
--
-- Nada existente é alterado: os leads de hoje viram a primeira visita de
-- cada um (backfill abaixo), e daqui pra frente toda abertura conta.

-- "dominio/caminho": domínio em minúsculas, sem protocolo, sem ?query, sem
-- #, sem barra no fim. Mesma regra de normalizarPagina() no
-- src/lib/tracking/paginas.ts — as duas precisam bater.
create or replace function public.tracking_normalizar_pagina(url text)
returns text
language sql
immutable
as $$
  select case
    when url is null or url !~* '^[a-z][a-z0-9+.-]*://' then null
    else
      lower(substring(url from '^[a-zA-Z][a-zA-Z0-9+.-]*://([^/?#]+)'))
      || coalesce(nullif(rtrim(substring(url from '^[a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]+([^?#]*)'), '/'), ''), '')
  end
$$;

create table if not exists tracking_page_visits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  lead_id uuid not null,
  pagina text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  visitas integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (product_id, lead_id, pagina)
);

create index if not exists idx_tracking_page_visits_produto_data on tracking_page_visits (product_id, first_seen_at);
create index if not exists idx_tracking_page_visits_lead on tracking_page_visits (lead_id);

alter table tracking_page_visits enable row level security;

-- Leitura igual à de tracking_leads; escrita só pelo servidor (service key).
drop policy if exists "tracking_page_visits_select" on tracking_page_visits;
create policy "tracking_page_visits_select" on tracking_page_visits
  for select using (public.has_product_access(product_id));

-- Primeira chegada de uma pessoa numa página cria a linha (com a origem
-- dessa chegada); as aberturas seguintes só somam e atualizam a data.
create or replace function public.tracking_registrar_visita(
  p_product_id uuid,
  p_lead_id uuid,
  p_pagina text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_referrer text
)
returns void
language sql
as $$
  insert into tracking_page_visits
    (product_id, lead_id, pagina, utm_source, utm_medium, utm_campaign, utm_content, referrer)
  values
    (p_product_id, p_lead_id, p_pagina, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_referrer)
  on conflict (product_id, lead_id, pagina)
  do update set visitas = tracking_page_visits.visitas + 1, last_seen_at = now();
$$;

-- Só o servidor chama (o collect usa a service key).
revoke all on function public.tracking_registrar_visita(uuid, uuid, text, text, text, text, text, text) from public, anon, authenticated;

-- Backfill: a página de entrada de cada lead que já existe vira a primeira
-- visita dele. Robô conhecido fica de fora (mesma lista de
-- src/lib/tracking/robos.ts).
insert into tracking_page_visits
  (product_id, lead_id, pagina, utm_source, utm_medium, utm_campaign, utm_content, referrer, visitas, first_seen_at, last_seen_at)
select
  l.product_id,
  l.id,
  public.tracking_normalizar_pagina(l.landing_url),
  l.utm_source,
  l.utm_medium,
  l.utm_campaign,
  l.utm_content,
  l.referrer,
  1,
  l.first_seen_at,
  l.first_seen_at
from tracking_leads l
where public.tracking_normalizar_pagina(l.landing_url) is not null
  and coalesce(l.client_user_agent, '') !~* '(bot|crawl|spider|slurp|facebookexternalhit|meta-external|facebookcatalog|headlesschrome|lighthouse|adsbot|google-inspectiontool|python-requests|curl/|wget/)'
on conflict (product_id, lead_id, pagina) do nothing;

-- Relatório por página × origem × campanha. "Pessoas" = quem CHEGOU na
-- página no período (primeira visita a ela dentro da janela). Conversões
-- contam a pessoa se o evento aconteceu DEPOIS de ela chegar na página —
-- quem passa por duas páginas e compra conta nas duas, e a tela diz isso.
drop function if exists public.tracking_paginas_report(uuid, timestamptz, timestamptz);

create function public.tracking_paginas_report(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  pagina text,
  utm_source text,
  utm_campaign text,
  pessoas bigint,
  visitas bigint,
  leads_novos bigint,
  checkouts bigint,
  compras bigint,
  depositos bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    with v as (
      select pv.*
      from tracking_page_visits pv
      where pv.product_id = p_product_id
        and pv.first_seen_at >= p_from
        and pv.first_seen_at <= p_to
    )
    select
      v.pagina,
      coalesce(nullif(v.utm_source, ''), '(direto)') as utm_source,
      coalesce(nullif(v.utm_campaign, ''), '(sem campanha)') as utm_campaign,
      count(distinct v.lead_id) as pessoas,
      coalesce(sum(v.visitas), 0)::bigint as visitas,
      count(distinct v.lead_id) filter (
        where exists (
          select 1 from tracking_leads l
          where l.id = v.lead_id
            and public.tracking_normalizar_pagina(l.landing_url) = v.pagina
        )
      ) as leads_novos,
      count(distinct v.lead_id) filter (
        where exists (
          select 1 from tracking_events e
          where e.lead_id = v.lead_id and e.product_id = p_product_id
            and e.event_type = 'initiate_checkout'
            and e.occurred_at >= v.first_seen_at and e.occurred_at <= p_to
        )
      ) as checkouts,
      count(distinct v.lead_id) filter (
        where exists (
          select 1 from tracking_events e
          where e.lead_id = v.lead_id and e.product_id = p_product_id
            and e.event_type = 'purchase'
            and e.occurred_at >= v.first_seen_at and e.occurred_at <= p_to
        )
      ) as compras,
      count(distinct v.lead_id) filter (
        where exists (
          select 1 from tracking_events e
          where e.lead_id = v.lead_id and e.product_id = p_product_id
            and e.event_type = 'broker_deposit'
            and e.occurred_at >= v.first_seen_at and e.occurred_at <= p_to
        )
      ) as depositos
    from v
    group by 1, 2, 3;
end;
$$;

grant execute on function public.tracking_paginas_report(uuid, timestamptz, timestamptz) to authenticated;
