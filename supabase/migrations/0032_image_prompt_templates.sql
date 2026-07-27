-- Sistema de "prompt pré-definido" pra geração de imagem: um template com
-- placeholders ([ITEM 1]-[ITEM 4], [PERSONAGEM], [TOM]) combinado com listas
-- reutilizáveis de personagens e tons — o usuário só escreve os 4 itens de
-- texto e escolhe personagem/tom nos dropdowns, e o prompt final é montado
-- automaticamente. Mesmo padrão do prompt_categories/image_folders: leitura
-- liberada pra todo autenticado, escrita só admin.
create table image_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create table image_prompt_characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create table image_prompt_tones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table image_prompt_templates enable row level security;
alter table image_prompt_characters enable row level security;
alter table image_prompt_tones enable row level security;

create policy "image_prompt_templates_select_all" on image_prompt_templates
  for select using (auth.role() = 'authenticated');
create policy "image_prompt_templates_write_admin_only" on image_prompt_templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "image_prompt_characters_select_all" on image_prompt_characters
  for select using (auth.role() = 'authenticated');
create policy "image_prompt_characters_write_admin_only" on image_prompt_characters
  for all using (public.is_admin()) with check (public.is_admin());

create policy "image_prompt_tones_select_all" on image_prompt_tones
  for select using (auth.role() = 'authenticated');
create policy "image_prompt_tones_write_admin_only" on image_prompt_tones
  for all using (public.is_admin()) with check (public.is_admin());

insert into image_prompt_templates (name, body, position) values (
  'Banner urgência (4 itens de texto)',
  '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.


[PERSONAGEM]

Art direction and background:
[TOM]

Composition rules:
Horizontal landscape layout — wide format 16:9.
Character large and dominant — upper body visible.
Left side reserved for text overlay — clean with only background graphic elements.
Face as the absolute focal point — direct gaze into camera.
Upper body crop — head fully visible — cut at the waist.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.',
  0
);

insert into image_prompt_characters (name, body, position) values
(
  'Só o Robô',
  'Main character — Copy Trader Robot:
Same elevated premium robot from all previous banners — dark suit jacket fitted and structured —
gold circuit lines richly glowing beneath the fabric — confident authoritative pose.
Robot eyes: glowing gold — cold precision and total control.
Robot large and dominant — centered or slightly right in the frame.',
  0
),
(
  'Só o PEPE',
  'Main character — PEPE:
PEPE the famous green frog meme — bold detailed cartoon style — dark black zip-up hoodie —
confident knowing smirk — one eyebrow slightly raised — NOT sad NOT drooping —
neon green glowing eyes — winner energy. PEPE large and dominant on the left side.',
  1
),
(
  'PEPE + Robô',
  'Main characters — PEPE + robot side by side:
PEPE the famous green frog meme on the left — bold cartoon style — dark hoodie —
confident expression — neon green glowing eyes — same style as all previous banners.
Copy Trader robot on the right — premium style — dark suit jacket — gold circuit lines —
robot eyes glowing gold — fully operational.
Both characters equal visual weight — unified team.',
  2
);

insert into image_prompt_tones (name, body, position) values (
  'Urgente — fogo e contagem',
  'Ultra-realistic cinematic quality throughout.
Dark background — deep black transitioning into intense orange and red gradient on the left.
Dramatic key light from slightly above and front — high contrast and sharp.
Intense orange and red rim lighting from behind — heat and urgency building.
Large aggressive flame elements rising from the lower left.
Near empty hourglass glowing orange in the background — almost out of time.
Dense fire ember particles filling the background aggressively.
Green candlestick chart spiking sharply upward in the far background.',
  0
);
