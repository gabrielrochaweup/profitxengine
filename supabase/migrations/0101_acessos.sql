-- Os acessos da operação num lugar só: quem entra onde, se tem 2FA e onde
-- ele mora, e — quando for assinatura — quanto custa.
--
-- A senha vai cifrada com a mesma chave do resto do app
-- (CREDENTIALS_ENCRYPTION_KEY, AES-256-GCM), igual aos tokens de webhook e
-- às credenciais de anúncio. Nunca sai numa listagem: só numa chamada
-- própria, quando alguém clica em "mostrar".
create table acessos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nome text not null,
  categoria text not null default 'rede'
    check (categoria in ('rede', 'ferramenta', 'financeiro', 'outro')),
  url text,
  usuario text,
  encrypted_senha text,
  tem_2fa boolean not null default false,
  -- De que adianta saber que tem 2FA sem saber em qual celular ele está —
  -- é justamente isso que trava a equipe às 23h.
  onde_2fa text,
  responsavel text,
  assinatura boolean not null default false,
  valor_cents integer not null default 0,
  -- Boa parte das ferramentas cobra em dólar; somar tudo como se fosse real
  -- daria um total errado e convincente.
  moeda text not null default 'BRL' check (moeda in ('BRL', 'USD')),
  -- Anual não soma com mensal. Guardando o ciclo, o total mensal divide o
  -- anual por 12 em vez de misturar as duas escalas.
  ciclo text not null default 'mensal' check (ciclo in ('mensal', 'anual')),
  observacoes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_acessos_produto on acessos (product_id, categoria);

alter table acessos enable row level security;

-- Quem tem acesso ao produto enxerga: a razão de existir desta tela é a
-- equipe inteira conseguir entrar nas contas. A senha em si continua
-- protegida por estar cifrada com uma chave que só o servidor tem — o que
-- vaza numa leitura direta é texto embaralhado.
create policy "acessos_produto" on acessos
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));
