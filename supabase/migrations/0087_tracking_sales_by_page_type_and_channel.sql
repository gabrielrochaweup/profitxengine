-- 2 agregações novas: vendas por tipo de página (quiz/remarketing/vsl...)
-- e por canal (bio Instagram, descrição YouTube...). Usa utm_medium e
-- utm_content, respectivamente — campos que o Gerador de UTMs já expõe
-- pra preencher livremente, mas que nunca tinham virado gráfico nenhum.
--
-- Só conta compra que bateu com um lead (utm_medium/utm_content só
-- existem em tracking_leads, capturados na visita à landing — uma compra
-- não atribuída não tem de onde tirar isso). Mesma limitação de "Vendas
-- por produto"/"por método de pagamento", que também só enxergam o que
-- está diretamente disponível no evento.
create function public.tracking_sales_by_page_type(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  page_type text,
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
      coalesce(l.utm_medium, '(não definido)') as page_type,
      count(*) as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    join tracking_leads l on l.id = e.lead_id
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

create function public.tracking_sales_by_channel(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  channel text,
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
      coalesce(l.utm_content, '(não definido)') as channel,
      count(*) as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    join tracking_leads l on l.id = e.lead_id
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;
