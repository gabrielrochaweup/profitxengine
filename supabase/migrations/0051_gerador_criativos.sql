-- Gerador de Criativos: posts estilo rede social (card com avatar/nome/selo,
-- card de link opcional e corpo de texto) + aba de criativos livres por
-- prompt (reaproveita o ImageGenerationPanel já existente, só precisa de um
-- novo valor de context_type).

create table fake_posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  author_name text,
  author_handle text,
  author_avatar_url text,
  verified boolean not null default true,
  display_style text check (display_style in ('paragrafo', 'titulo_grande')) not null default 'paragrafo',
  body text,
  subtitle text,
  link_card_image_url text,
  link_card_title text,
  link_card_description text,
  prompt_id uuid references prompts(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table fake_posts enable row level security;

-- Mesmo padrão de fake_conversations (0001_init.sql): select liberado pra
-- autenticado, insert só editor/admin, update/delete só dono ou admin.
create policy "fake_posts_select_all" on fake_posts
  for select using (auth.role() = 'authenticated');
create policy "fake_posts_insert_editor_admin" on fake_posts
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "fake_posts_update_own_or_admin" on fake_posts
  for update using (created_by = auth.uid() or public.is_admin());
create policy "fake_posts_delete_own_or_admin" on fake_posts
  for delete using (created_by = auth.uid() or public.is_admin());

-- Prompt pré-definido pro corpo do post — mesmo padrão de
-- testimonial_prompt_templates (0048): [ITEM 1] é o detalhe/tema opcional.
-- A instrução de formatação (negrito/itálico/destaque) fica fixa no código
-- (post-generate-panel.tsx), não repetida em cada linha.
create table post_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table post_prompt_templates enable row level security;

create policy "post_prompt_templates_select_all" on post_prompt_templates
  for select using (auth.role() = 'authenticated');
create policy "post_prompt_templates_write_admin_only" on post_prompt_templates
  for all using (public.is_admin()) with check (public.is_admin());

insert into post_prompt_templates (name, body, position) values
(
  'Prova social / resultado do método',
  'SITUAÇÃO: Escreva um post curto em primeira pessoa (voz do Robson Guerreiro, fundador da PROFITX) contando um resultado real que o método/estratégia dele proporcionou — pra ele mesmo ou pra um aluno. Tom confiante, direto, sem enrolação. Pode mencionar um período operando tranquilo por causa do método.

DETALHE (se preenchido, incorpore naturalmente): [ITEM 1]',
  0
),
(
  'Provocação sobre corretora/mercado',
  'SITUAÇÃO: Escreva um post provocador dizendo que o método é TÃO simples e eficaz que parece golpe ou bom demais pra ser verdade — mas deixando claro que existe estratégia e gerenciamento por trás, sem tratar a plataforma como cassino. Pode citar uma corretora (ex: IQ Option) ou mercado (opções binárias, cripto). Tom confiante, frase de efeito curta e direta.

DETALHE (se preenchido, incorpore naturalmente): [ITEM 1]',
  1
),
(
  'Reação a notícia do dia (card de link)',
  'SITUAÇÃO: Escreva um comentário forte e opinativo reagindo a uma notícia atual de mercado financeiro, economia ou algo que viralizou — o card com a notícia em si vai ser anexado separadamente, então não descreva a notícia, só reaja/comente. Tom direto, sem papas na língua, pode usar CAIXA ALTA pra enfatizar uma palavra-chave.

DETALHE (do que se trata a notícia): [ITEM 1]',
  2
),
(
  'Motivacional / mindset',
  'SITUAÇÃO: Escreva um post motivacional sobre disciplina, paciência ou mentalidade no trading/investimentos — reflexão pessoal do Robson Guerreiro, tom inspirador mas sem ser piegas, direto ao ponto.

DETALHE (se preenchido, incorpore naturalmente): [ITEM 1]',
  3
),
(
  'Bastidor pessoal',
  'SITUAÇÃO: Escreva um post mais pessoal, contando um bastidor ou reflexão sobre a jornada de construir a PROFITX ou o dia a dia como trader/empreendedor — tom mais próximo e humano, sem perder a autoridade.

DETALHE (se preenchido, incorpore naturalmente): [ITEM 1]',
  4
),
(
  'Contraste antes vs depois',
  'SITUAÇÃO: Escreva um post no formato antes/depois — como era a vida ou os resultados antes de aplicar o método, e como ficou depois. Pode usar duas frases curtas contrastantes.

DETALHE (se preenchido, incorpore naturalmente): [ITEM 1]',
  5
);

-- Categoria "Post" na biblioteca genérica de prompts, pra aba "Prompt
-- livre" do gerador de posts (mesmo mecanismo de prompt_categories/
-- PromptPicker já usado em conversas/imagem/etc — nenhuma mudança de
-- schema necessária, só a linha nova).
insert into prompt_categories (slug, name, position) values ('post', 'Post', 4);

-- Novo contexto de geração de imagem pra aba "Criativos" (livre por
-- prompt, sem edição tipo simulador).
alter table generated_images drop constraint generated_images_context_type_check;
alter table generated_images add constraint generated_images_context_type_check
  check (context_type in ('dinamica_slot', 'livre_engagement', 'x1_message', 'email', 'criativo'));
