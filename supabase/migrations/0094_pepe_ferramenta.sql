-- Pepe (a IA) passa a mandar webhook pro Engine, como as outras
-- plataformas. São dois momentos distintos na vida do aluno dentro da
-- ferramenta: quando ele se cadastra nela e quando entra pela primeira vez.
-- Separar os dois é o que permite ver quantos criaram conta e nunca usaram.
--
-- O kind do endpoint é "tool" e não "pepe": o Pepe é a primeira ferramenta,
-- mas a mesma rota serve pra próxima, trocando só o adapter.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tracking_webhook_endpoints'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%kind%';

  if constraint_name is not null then
    execute format('alter table tracking_webhook_endpoints drop constraint %I', constraint_name);
  end if;

  alter table tracking_webhook_endpoints
    add constraint tracking_webhook_endpoints_kind_check
    check (kind in ('checkout', 'members_area', 'broker', 'contract', 'tool'));
end $$;

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
                          'tool_signup', 'tool_access'));
end $$;
