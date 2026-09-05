-- Reforço defensivo depois do incidente da 0085/0086: adiciona
-- "#variable_conflict use_column" nas 3 funções da 0084, que hoje
-- funcionam mas têm exatamente o mesmo padrão de risco (RETURNS TABLE
-- com nome de coluna igual ao alias usado na consulta) — se um dia
-- alguém adicionar mais lógica aqui (como aconteceu com
-- tracking_campaign_report), essa proteção evita repetir o mesmo erro
-- silencioso em produção. Nenhuma lógica de consulta muda, só a pragma.
drop function if exists public.tracking_sales_by_offer(uuid, timestamptz, timestamptz);
drop function if exists public.tracking_sales_by_payment_method(uuid, timestamptz, timestamptz);
drop function if exists public.tracking_sales_by_time(uuid, timestamptz, timestamptz);

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
#variable_conflict use_column
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
#variable_conflict use_column
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
#variable_conflict use_column
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
