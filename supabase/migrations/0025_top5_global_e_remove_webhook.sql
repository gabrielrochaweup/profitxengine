-- Centraliza o TOP 5 acumulado como um valor único e global (mesmo padrão
-- da Performance de Trading) em vez de configurado por dinâmica e atualizado
-- via webhook externo: mais simples de manter — o admin atualiza os 5
-- valores numa tela só e toda dinâmica com ${top5_bloco} no template pega
-- o valor automaticamente, sem precisar editar dinâmica por dinâmica.
create table if not exists top5_stats (
  id int primary key default 1,
  enabled boolean not null default true,
  values int[] not null default '{0,0,0,0,0}',
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  constraint top5_stats_singleton check (id = 1)
);

insert into top5_stats (id) values (1) on conflict (id) do nothing;

alter table top5_stats enable row level security;

create policy "top5_stats_select_authenticated" on top5_stats
  for select using (auth.role() = 'authenticated');
create policy "top5_stats_write_editor_admin" on top5_stats
  for all using (public.current_user_role() in ('editor', 'admin'))
  with check (public.current_user_role() in ('editor', 'admin'));

-- A configuração de TOP 5 por dinâmica (0017/0022-era) fica obsoleta com o
-- valor global acima.
alter table message_dynamics drop column if exists top5_config;

-- Segredo de webhook (0024) descontinuado — TOP 5 deixa de vir de
-- automação externa.
drop table if exists webhook_secrets;
