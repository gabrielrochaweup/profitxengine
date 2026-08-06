-- Sistema de "prompt pré-definido" pro Simulador de Conversas, no mesmo
-- padrão do image_prompt_templates: um cenário (situação) combinado com
-- estilo de português, variação de interação e variante com/sem imagem —
-- o prompt final é montado automaticamente a partir dos 4 dropdowns.
-- Mesmo padrão de RLS: leitura liberada pra todo autenticado, escrita só
-- admin.
create table testimonial_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create table testimonial_prompt_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create table testimonial_prompt_variations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create table testimonial_prompt_image_variants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table testimonial_prompt_templates enable row level security;
alter table testimonial_prompt_styles enable row level security;
alter table testimonial_prompt_variations enable row level security;
alter table testimonial_prompt_image_variants enable row level security;

create policy "testimonial_prompt_templates_select_all" on testimonial_prompt_templates
  for select using (auth.role() = 'authenticated');
create policy "testimonial_prompt_templates_write_admin_only" on testimonial_prompt_templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "testimonial_prompt_styles_select_all" on testimonial_prompt_styles
  for select using (auth.role() = 'authenticated');
create policy "testimonial_prompt_styles_write_admin_only" on testimonial_prompt_styles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "testimonial_prompt_variations_select_all" on testimonial_prompt_variations
  for select using (auth.role() = 'authenticated');
create policy "testimonial_prompt_variations_write_admin_only" on testimonial_prompt_variations
  for all using (public.is_admin()) with check (public.is_admin());

create policy "testimonial_prompt_image_variants_select_all" on testimonial_prompt_image_variants
  for select using (auth.role() = 'authenticated');
create policy "testimonial_prompt_image_variants_write_admin_only" on testimonial_prompt_image_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- === Cenários ===

insert into testimonial_prompt_templates (name, body, position) values
(
  'Resultado positivo no Copy Trading',
  'SITUAÇÃO: o cliente operou no Copy Trading por um tempo, teve um resultado positivo e agora escreve pro atendimento pra agradecer à equipe pelo suporte durante esse processo.

ESTILO DE ESCRITA DO CLIENTE:
[ESTILO]

VARIAÇÃO DE INTERAÇÃO:
[VARIACAO]

IMAGEM:
[IMAGEM]

DETALHE ESPECÍFICO (se preenchido, incorpore naturalmente): [ITEM 1]',
  0
),
(
  'Depois de tirar uma dúvida com o suporte',
  'SITUAÇÃO: o cliente teve uma dúvida técnica (configuração da conta, como acompanhar as operações, etc.), foi bem atendido pelo suporte, e volta pra agradecer pela paciência e clareza no atendimento.

ESTILO DE ESCRITA DO CLIENTE:
[ESTILO]

VARIAÇÃO DE INTERAÇÃO:
[VARIACAO]

IMAGEM:
[IMAGEM]

DETALHE ESPECÍFICO (se preenchido, incorpore naturalmente): [ITEM 1]',
  1
),
(
  'Primeiro saque ou meta pessoal batida',
  'SITUAÇÃO: o cliente acabou de fazer o primeiro saque ou bateu uma meta pessoal e escreve pra agradecer à equipe da PROFITX por ter ajudado a chegar até ali.

ESTILO DE ESCRITA DO CLIENTE:
[ESTILO]

VARIAÇÃO DE INTERAÇÃO:
[VARIACAO]

IMAGEM:
[IMAGEM]

DETALHE ESPECÍFICO (se preenchido, incorpore naturalmente): [ITEM 1]',
  2
),
(
  'Depois da mentoria ou sala ao vivo',
  'SITUAÇÃO: o cliente participou de uma mentoria ou sala ao vivo, aprendeu algo que fez diferença, e escreve pra agradecer pelo conteúdo e acompanhamento da equipe.

ESTILO DE ESCRITA DO CLIENTE:
[ESTILO]

VARIAÇÃO DE INTERAÇÃO:
[VARIACAO]

IMAGEM:
[IMAGEM]

DETALHE ESPECÍFICO (se preenchido, incorpore naturalmente): [ITEM 1]',
  3
),
(
  'Depois de superar a desconfiança inicial',
  'SITUAÇÃO: o cliente estava receoso no começo — com o mercado, com a plataforma ou com o processo — decidiu seguir em frente mesmo assim, e agora, com um resultado positivo, escreve pra agradecer por ter tido suporte da equipe nesse meio tempo.

ESTILO DE ESCRITA DO CLIENTE:
[ESTILO]

VARIAÇÃO DE INTERAÇÃO:
[VARIACAO]

IMAGEM:
[IMAGEM]

DETALHE ESPECÍFICO (se preenchido, incorpore naturalmente): [ITEM 1]',
  4
);

-- === Estilo de português ===

insert into testimonial_prompt_styles (name, body, position) values
(
  'Português bem escrito',
  'O cliente escreve em português correto e bem construído: frases completas, pontuação adequada, sem erros de ortografia — mas ainda soa natural e humano, não robótico nem formal demais. Pode usar linguagem coloquial, mas sem gírias exageradas.',
  0
),
(
  'Português mediano',
  'O cliente escreve como uma pessoa comum digitando rápido pelo celular: sem se preocupar com acentuação, às vezes sem vírgula ou ponto final, frases meio corridas, pode faltar concordância em algum trecho — mas continua compreensível e natural, nunca exagerado a ponto de virar caricatura. Ex de tom: "consegui um resultado bom mesmo, ent quero agradecer a vcs".',
  1
);

-- === Variações de interação ===

insert into testimonial_prompt_variations (name, body, position) values
(
  'Pergunta inicial antes de agradecer',
  'A primeira mensagem do cliente é uma pergunta rápida e legítima relacionada à conta, ao próximo passo ou a uma dúvida simples. Só na mensagem seguinte o cliente agradece pelo suporte e pela equipe da PROFITX.',
  0
),
(
  'Estava com pé atrás no início',
  'O cliente menciona que estava desconfiado(a) ou com o pé atrás no início — com o mercado, com a proposta ou com a plataforma — mas o resultado positivo mudou sua opinião, e é isso que motiva o agradecimento.',
  1
),
(
  'Usa emojis com naturalidade',
  'O cliente usa emojis pontuais e naturais nas mensagens (ex: 🙏, 😄, 🚀, ❤️, 👏) — sem exagerar a ponto de virar spam de emoji, só como um cliente comum faria no WhatsApp.',
  2
),
(
  'Direto e objetivo, sem enrolação',
  'O cliente vai direto ao ponto: agradece em poucas palavras, sem contar história longa nem contexto — só uma ou duas frases curtas de agradecimento genuíno.',
  3
),
(
  'Quer indicar pra outras pessoas',
  'Além de agradecer, o cliente comenta que pensa em indicar ou chamar outras pessoas (amigos, familiares, conhecidos) pra participar também, como consequência natural da boa experiência.',
  4
),
(
  'Menciona um resultado ou marco específico',
  'O cliente cita algo concreto que viveu (ex: resultado de um mês, ter batido uma meta, ter aprendido algo específico) como motivo direto do agradecimento, em vez de agradecer de forma genérica.',
  5
),
(
  'Chegou a pensar em desistir',
  'O cliente conta que em algum momento chegou a pensar em desistir ou parar, mas o suporte/acompanhamento da equipe ajudou a continuar — e é isso que agradece agora, já com resultado positivo.',
  6
),
(
  'Comenta o resultado no fim do dia',
  'O cliente manda a mensagem no fim do dia, comentando de forma espontânea o resultado daquele dia especificamente, e aproveita pra agradecer pelo suporte.',
  7
),
(
  'Voltou depois de sumir um tempo',
  'O cliente comenta que ficou um tempo sem aparecer ou sem operar, retomou recentemente, e escreve pra agradecer por ter sido bem recebido de volta e pelo suporte que teve.',
  8
),
(
  'Agradecimento afetuoso, chamando de time/família',
  'O cliente agradece de um jeito mais caloroso e afetuoso, se referindo à equipe como "time" ou "família", num tom mais próximo e pessoal do que formal.',
  9
),
(
  'Já comentou com outras pessoas do grupo',
  'O cliente conta que já comentou ou elogiou a PROFITX pra outras pessoas de um grupo ou comunidade da qual participa, antes mesmo de escrever pro atendimento.',
  10
);

-- === Com ou sem imagem ===

insert into testimonial_prompt_image_variants (name, body, position) values
(
  'Sem imagem',
  'O cliente manda só texto, sem mencionar nem anexar nenhuma imagem ou print.',
  0
),
(
  'Com imagem',
  'O cliente menciona no texto que está mandando ou anexando um print/comprovante do resultado junto da mensagem (ex: "vou mandar o print aqui", "segue o comprovante 📸") — o texto deve referenciar essa imagem de forma natural, mesmo que o arquivo em si seja anexado depois, manualmente, fora dessa geração.',
  1
);
