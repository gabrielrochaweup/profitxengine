-- Quais eventos vão pra Meta, escolhidos na tela (Tracking > Ferramentas >
-- Rastreamento), sem precisar mexer no código a cada troca.
--
-- Até aqui a lista era fixa no pixel.js e nos webhooks. Com o pixel tirado
-- do checkout da Onprofit, quem dispara InitiateCheckout/Purchase passa a
-- ser a gente — e isso tem que ser um interruptor, não um deploy.
--
-- Uma linha por produto. Sem linha (ou antes desta migration rodar), o app
-- usa o padrão de hoje: só PageView pelo navegador e Deposit pelo servidor.

create table if not exists tracking_script_config (
  product_id uuid primary key references products(id) on delete cascade,
  -- { "pageview": bool, "lead": bool,
  --   "initiate_checkout": "desligado" | "clique" | "pagina",
  --   "purchase": bool, "deposit": bool }
  eventos_meta jsonb not null default
    '{"pageview": true, "lead": false, "initiate_checkout": "desligado", "purchase": false, "deposit": true}'::jsonb,
  -- Pedaços de endereço que identificam a página de checkout (ex:
  -- "pay.onprofit.com.br"). Usado quando o InitiateCheckout é "ao abrir a
  -- página de checkout" — o script só dispara se o endereço contiver um deles.
  paginas_checkout text[] not null default '{}',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table tracking_script_config enable row level security;

-- Mesmo modelo das outras configurações do Tracking (0113): leitura pra
-- equipe; escrita pelo PostgREST direto só admin. A tela grava pela rota
-- /api/tracking/script-config, que usa a service key e exige "aprovado".
drop policy if exists "tracking_script_config_select_equipe" on tracking_script_config;
create policy "tracking_script_config_select_equipe" on tracking_script_config
  for select using (public.eh_aprovado() or public.is_admin());

drop policy if exists "tracking_script_config_admin_write" on tracking_script_config;
create policy "tracking_script_config_admin_write" on tracking_script_config
  for all using (public.is_admin()) with check (public.is_admin());

-- Navegador e IP da primeira visita: a API de Conversões só aceita um evento
-- como "website" (o tipo que a Meta atribui ao anúncio) com o navegador de
-- quem converteu. Sem isso o Purchase/Deposit vai como "system_generated".
-- Vale daqui pra frente; leads antigos ficam sem.
alter table tracking_leads add column if not exists client_user_agent text;
alter table tracking_leads add column if not exists client_ip text;
