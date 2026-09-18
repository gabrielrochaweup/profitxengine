-- Duas áreas novas do Tracking, sem relação entre si além de morarem na
-- mesma aba:
--
-- 1) ad_business_managers — o inventário de BMs (Meta) e contas de gerente
--    (Google). Hoje isso vive num bloco de notas, e o que se perde ali é
--    saber QUAL está em uso quando uma cai: o status é a coluna que importa.
--
-- 2) tracking_utm_presets — as UTMs de cada canal, salvas em vez de
--    redigitadas. Digitar de novo é como o mesmo canal vira "instagram" num
--    dia e "Instagram" no outro, virando duas linhas no relatório.

create table ad_business_managers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  nome text not null,
  -- ID da BM no Meta / ID da conta de gerente (MCC) no Google.
  external_id text,
  status text not null default 'pronta'
    check (status in ('ativa', 'pronta', 'restrita', 'bloqueada')),
  -- Uma por linha, texto livre: quem preenche isso copia de uma lista do
  -- Gerenciador, e obrigar a cadastrar uma a uma faria o inventário nunca
  -- sair do bloco de notas. A contagem sai das linhas.
  contas text not null default '',
  paginas text not null default '',
  observacoes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ad_business_managers_produto on ad_business_managers (product_id, platform);

alter table ad_business_managers enable row level security;

create policy "ad_business_managers_admin_all" on ad_business_managers
  for all using (public.is_admin()) with check (public.is_admin());

create table tracking_utm_presets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nome text not null,
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  utm_content text not null default '',
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_tracking_utm_presets_produto on tracking_utm_presets (product_id, position);

alter table tracking_utm_presets enable row level security;

create policy "tracking_utm_presets_admin_all" on tracking_utm_presets
  for all using (public.is_admin()) with check (public.is_admin());

-- Os canais que já estão em uso hoje, pro painel não nascer vazio. Só no
-- produto que tem tracking ligado; os outros começam limpos e cadastram o
-- que for deles. Valores em minúscula e sem espaço de propósito: o
-- relatório agrupa pela string exata.
--
-- Meta Ads, WhatsApp e E-mail entram junto porque eram os atalhos fixos do
-- gerador, que esta tela substitui — sem eles aqui, quem for montar um link
-- de anúncio da Meta teria que digitar "meta/cpc" de cabeça, que é
-- exatamente o hábito que causa "Meta" e "meta" virarem duas linhas.
insert into tracking_utm_presets (product_id, nome, utm_source, utm_medium, position)
select p.id, v.nome, v.source, v.medium, v.pos
from products p
cross join (values
  ('Meta Ads',               'meta',        'cpc',          5),
  ('SendPulse (automações)', 'sendpulse',   'automacao',   10),
  ('SendFlow (grupo)',       'sendflow',    'grupo',       20),
  ('Instagram (bio/stories)','instagram',   'bio',         30),
  ('ManyChat',               'manychat',    'chatbot',     40),
  ('Facebook',               'facebook',    'social',      50),
  ('YouTube',                'youtube',     'social',      60),
  ('TikTok',                 'tiktok',      'social',      70),
  ('Google',                 'google',      'cpc',         80),
  ('Egiani',                 'egiani',      'atendimento', 90),
  ('Alessandra',             'alessandra',  'atendimento', 100),
  ('Leonardo',               'leonardo',    'atendimento', 110),
  ('WhatsApp',               'whatsapp',    'referral',    120),
  ('E-mail',                 'email',       'email',       130)
) as v(nome, source, medium, pos)
where p.slug = 'profitx';
