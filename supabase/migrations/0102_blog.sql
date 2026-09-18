-- Gerador de blog: os domínios onde a gente publica e os posts gerados.
--
-- Esta migration cobre a produção do conteúdo (tema/slug -> texto + imagem ->
-- post pronto). Servir esse post no domínio é a etapa seguinte, e ela depende
-- de onde o blog vai rodar — por isso o domínio já guarda como ele será
-- ligado, mesmo antes de existir a ponta que responde.

-- O gerador de blog escolhe provedor/modelo igual aos outros módulos, em vez
-- de ficar preso a um provedor fixo: texto longo de SEO tem custo por post e
-- vale poder trocar de modelo sem mexer em código.
alter table ai_provider_settings drop constraint if exists ai_provider_settings_module_check;
alter table ai_provider_settings
  add constraint ai_provider_settings_module_check
  check (module in ('conversa', 'mensagem', 'imagem', 'email', 'blog'));

alter table ai_usage_log drop constraint if exists ai_usage_log_module_check;
alter table ai_usage_log
  add constraint ai_usage_log_module_check
  check (module in ('conversa', 'mensagem', 'imagem', 'email', 'blog'));

create table blog_dominios (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  -- Só o host, sem protocolo nem barra: é o que vai ser comparado com o
  -- Host da requisição quando o blog começar a responder.
  dominio text not null,
  -- Onde o blog mora dentro do site. Subdiretório concentra a autoridade no
  -- domínio principal; subdomínio é mais fácil de ligar mas o Google trata
  -- como vizinho, não como parte do site.
  caminho text not null default '/blog',
  nome text,
  idioma text not null default 'pt-BR',
  -- Contexto que entra no prompt: sem isso todo post sai com a mesma voz
  -- genérica, que é exatamente o que o Google classifica como conteúdo em
  -- escala sem propósito.
  publico_alvo text,
  tom text,
  -- Prova de posse: a pessoa publica esse valor num registro TXT do domínio
  -- e a gente confere antes de deixar publicar ali.
  token_verificacao text not null default encode(gen_random_bytes(16), 'hex'),
  verificado boolean not null default false,
  verificado_em timestamptz,
  ativo boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, dominio)
);

create index idx_blog_dominios_produto on blog_dominios (product_id);

alter table blog_dominios enable row level security;

create policy "blog_dominios_produto" on blog_dominios
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  dominio_id uuid references blog_dominios(id) on delete set null,
  slug text not null,
  titulo text not null,
  meta_descricao text,
  palavra_chave text,
  conteudo_md text not null default '',
  imagem_url text,
  imagem_alt text,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  -- O que foi pedido, guardado junto: dois meses depois ninguém lembra se o
  -- post saiu de um tema ou de uma palavra-chave, e isso muda como lê-lo.
  tema text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Slug repetido no mesmo domínio viraria duas páginas disputando a mesma
  -- busca — o jeito mais rápido de um site competir consigo mesmo.
  unique (dominio_id, slug)
);

create index idx_blog_posts_produto on blog_posts (product_id, status, created_at desc);

alter table blog_posts enable row level security;

create policy "blog_posts_produto" on blog_posts
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));
