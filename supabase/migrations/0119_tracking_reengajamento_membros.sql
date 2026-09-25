-- Novo event_type: 'members_reengagement_sent'.
--
-- É pra campanha de reengajamento no SendPulse: alunos que JÁ acessaram a
-- área de membros recebem um convite pra voltar a entrar. O sinal marca o
-- CONVITE saindo (a pessoa alcançou aquele passo do fluxo no SendPulse), não
-- confirma que ela voltou de verdade — SendPulse não sabe o que acontece do
-- lado de fora dele. Detalhe completo em
-- src/lib/tracking/tool-adapters/sendpulse-reengajamento.ts.
--
-- POR ISSO é um event_type NOVO, e não 'members_access' reaproveitado:
-- 'members_access' é contado como "aluno acessou a área de membros" em
-- toda consulta de funil e de relatório por campanha (tracking_campaign_report
-- e afins, todas com `filter (where e.event_type = 'members_access')`
-- hardcoded). Gravar o convite ali inflaria essa etapa com tentativa, não
-- com acesso — exatamente o que a regra "não alterar os números pra eles
-- fazerem sentido" proíbe.
--
-- Consequência desejada: como nenhum relatório soma este event_type, ele
-- NÃO aparece no funil nem no relatório por campanha — só na lista de
-- Eventos recentes (filtrável) e na consulta direta de tracking_events. Se
-- um dia isso precisar virar métrica de funil, é uma decisão própria, com
-- sua própria etapa — não uma adição silenciosa a uma que já existe.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tracking_events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%event_type%';

  if constraint_name is not null then
    execute format('alter table tracking_events drop constraint %I', constraint_name);
  end if;

  alter table tracking_events
    add constraint tracking_events_event_type_check
    check (event_type in ('page_view', 'initiate_checkout', 'purchase', 'members_access',
                          'broker_signup', 'broker_deposit', 'contract_signed',
                          'tool_signup', 'tool_access', 'members_reengagement_sent'));
end $$;
