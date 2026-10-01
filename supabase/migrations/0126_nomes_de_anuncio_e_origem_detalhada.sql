-- Origem detalhada: campanha, conjunto e anúncio com NOME, não só ID.
--
-- O link do anúncio carrega três IDs nas UTMs (configurados nos parâmetros
-- dinâmicos da Meta):
--   utm_campaign = ID da campanha   (ex: 120248833147640634)
--   utm_term     = ID do conjunto
--   utm_content  = ID do anúncio
-- Eles são úteis pro sistema e ilegíveis pra gente. Esta migration guarda o
-- nome de cada um (sincronizado da Meta pelo botão "Sincronizar gasto") e cria
-- o relatório que abre a origem até o anúncio.
--
-- Quando a UTM já vier com texto (ex: utm_campaign=quiz-pepe), a tela mostra o
-- texto como está — só ID numérico precisa de tradução.

create table if not exists ad_entity_names (
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  entity_id text not null,
  level text not null check (level in ('campaign', 'adset', 'ad')),
  name text not null,
  updated_at timestamptz not null default now(),
  primary key (product_id, platform, entity_id)
);

create index if not exists idx_ad_entity_names_product on ad_entity_names (product_id);

alter table ad_entity_names enable row level security;

-- Leitura pra quem enxerga o produto; escrita só pelo servidor (service key,
-- rota /api/ads/sync).
drop policy if exists "ad_entity_names_select" on ad_entity_names;
create policy "ad_entity_names_select" on ad_entity_names
  for select using (public.has_product_access(product_id));

-- Origem × campanha × conjunto × anúncio, com o funil de cada combinação.
-- "leads" = pessoas que chegaram no período por aquele link; as demais
-- colunas contam pessoas (ou dinheiro) com evento DENTRO do período, ligadas
-- ao lead pela UTM dele. Robô conhecido fica de fora (mesma lista de
-- src/lib/tracking/robos.ts).
drop function if exists public.tracking_origem_detalhada(uuid, timestamptz, timestamptz);

create function public.tracking_origem_detalhada(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  leads bigint,
  checkouts bigint,
  compras bigint,
  receita_cents bigint,
  cadastros_corretora bigint,
  depositos bigint,
  depositado_cents bigint
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
    with l as (
      select
        tl.id,
        tl.first_seen_at,
        coalesce(nullif(tl.utm_source, ''), '(direto)') as utm_source,
        coalesce(nullif(tl.utm_medium, ''), '') as utm_medium,
        coalesce(nullif(tl.utm_campaign, ''), '') as utm_campaign,
        coalesce(nullif(tl.utm_term, ''), '') as utm_term,
        coalesce(nullif(tl.utm_content, ''), '') as utm_content
      from tracking_leads tl
      where tl.product_id = p_product_id
        and coalesce(tl.client_user_agent, '') !~* '(bot|crawl|spider|slurp|facebookexternalhit|meta-external|facebookcatalog|headlesschrome|lighthouse|adsbot|google-inspectiontool|python-requests|curl/|wget/)'
    ),
    e as (
      select te.lead_id, te.event_type, te.amount_cents
      from tracking_events te
      where te.product_id = p_product_id
        and te.lead_id is not null
        and te.occurred_at >= p_from
        and te.occurred_at <= p_to
        and te.event_type in ('initiate_checkout', 'purchase', 'broker_signup', 'broker_deposit')
    )
    select
      l.utm_source,
      l.utm_medium,
      l.utm_campaign,
      l.utm_term,
      l.utm_content,
      count(distinct l.id) filter (where l.first_seen_at >= p_from and l.first_seen_at <= p_to) as leads,
      count(distinct e.lead_id) filter (where e.event_type = 'initiate_checkout') as checkouts,
      count(distinct e.lead_id) filter (where e.event_type = 'purchase') as compras,
      coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0)::bigint as receita_cents,
      count(distinct e.lead_id) filter (where e.event_type = 'broker_signup') as cadastros_corretora,
      count(e.lead_id) filter (where e.event_type = 'broker_deposit') as depositos,
      coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0)::bigint as depositado_cents
    from l
    left join e on e.lead_id = l.id
    group by l.utm_source, l.utm_medium, l.utm_campaign, l.utm_term, l.utm_content
    having count(distinct l.id) filter (where l.first_seen_at >= p_from and l.first_seen_at <= p_to) > 0
        or count(e.lead_id) > 0;
end;
$$;

grant execute on function public.tracking_origem_detalhada(uuid, timestamptz, timestamptz) to authenticated;
