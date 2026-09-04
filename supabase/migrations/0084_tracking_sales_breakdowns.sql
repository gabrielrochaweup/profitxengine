-- 3 agregações novas pro painel de Análises: vendas por produto/oferta,
-- vendas por método de pagamento, e vendas por horário/dia da semana.
-- Mesmo padrão de segurança/estrutura de tracking_campaign_report.

create function public.tracking_sales_by_offer(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  offer_name text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      coalesce(e.offer_name, '(sem nome)') as offer_name,
      count(*) as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

-- Enquanto só a Onprofit manda esse dado, a maioria das linhas cai em
-- "(não identificado)" — esperado, não é bug (mesmo princípio já usado
-- pro "(não atribuído)" de tracking_campaign_report: não esconder o que
-- não tem o dado, mostrar agrupado em vez de sumir da soma).
create function public.tracking_sales_by_payment_method(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  payment_method text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      coalesce(e.payment_method, '(não identificado)') as payment_method,
      count(*) as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

-- weekday/hour extraídos no fuso de Brasília (occurred_at é UTC) — senão a
-- distribuição por horário sai deslocada em relação ao horário real de
-- quem comprou. weekday segue o padrão do Postgres: 0 = domingo, 6 = sábado.
-- Devolve uma linha por combinação (weekday, hour) que teve pelo menos 1
-- compra — o client soma por hora e por dia da semana separadamente a
-- partir desse único resultado.
create function public.tracking_sales_by_time(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  weekday smallint,
  hour smallint,
  purchases bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      extract(dow from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as weekday,
      extract(hour from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as hour,
      count(*) as purchases
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1, 2;
end;
$$;
