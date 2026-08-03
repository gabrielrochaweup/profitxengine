-- Lista de CTAs prontos pro Item 4 do prompt pré-definido de imagem —
-- mesmo padrão de image_prompt_characters/image_prompt_tones (leitura
-- liberada, escrita só admin), gerenciável na mesma tela "Modelos de
-- prompt".
create table image_prompt_ctas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table image_prompt_ctas enable row level security;

create policy "image_prompt_ctas_select_all" on image_prompt_ctas
  for select using (auth.role() = 'authenticated');
create policy "image_prompt_ctas_write_admin_only" on image_prompt_ctas
  for all using (public.is_admin()) with check (public.is_admin());

insert into image_prompt_ctas (name, body, position) values
('Deposite agora', 'DEPOSITE AGORA', 0),
('Não perca tempo', 'NÃO PERCA TEMPO', 1),
('Última chance', 'ÚLTIMA CHANCE', 2),
('Deposite agora e garanta sua vaga', 'DEPOSITE AGORA E GARANTA SUA VAGA', 3),
('Participe agora', 'PARTICIPE AGORA', 4);
