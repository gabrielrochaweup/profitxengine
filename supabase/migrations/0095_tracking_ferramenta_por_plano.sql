-- Quantos alunos se cadastraram na ferramenta, separados por plano.
--
-- O plano sai do payload da própria ferramenta (user.plan), não da compra:
-- a pergunta é "quem está dentro do Pepe e em que plano", e quem responde
-- isso com autoridade é o Pepe. Se divergir da compra, é sinal de que os
-- dois sistemas estão fora de sincronia — e aí a divergência é o achado,
-- não um detalhe a esconder.
--
-- Conta pessoas, não eventos: um aluno que gerar dois cadastros por reenvio
-- não pode virar dois na conta.
create or replace function public.tracking_ferramenta_por_plano(
  p_product_id uuid,
  p_source text,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  plano text,
  cadastrados bigint,
  acessaram bigint
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
    with pessoas as (
      select
        lower(e.email) as email,
        coalesce(nullif(lower(e.raw_payload #>> '{user,plan}'), ''), '(sem plano)') as plano,
        max(case when e.event_type = 'tool_signup' then 1 else 0 end) as cadastrou,
        max(case when e.event_type = 'tool_access' then 1 else 0 end) as acessou
      from tracking_events e
      where e.product_id = p_product_id
        and e.source = p_source
        and e.event_type in ('tool_signup', 'tool_access')
        and e.email is not null
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2
    )
    select
      pessoas.plano,
      count(*) filter (where pessoas.cadastrou = 1) as cadastrados,
      count(*) filter (where pessoas.acessou = 1) as acessaram
    from pessoas
    group by 1
    order by cadastrados desc;
end;
$$;
