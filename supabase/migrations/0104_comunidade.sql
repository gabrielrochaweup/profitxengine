-- Comunidade: salas permanentes com chat, presença e (depois) chamada.
--
-- O princípio que manda no schema: a SALA e o CHAT são permanentes e moram
-- no banco; a CHAMADA é efêmera e não mora aqui. Quem está na chamada agora
-- é estado de sessão — vive no canal de Realtime, some quando a aba fecha e
-- não deixa lixo de "fulano ficou preso na chamada" pra alguém limpar depois.
--
-- Nada aqui é por produto: a comunidade é da equipe, não do PROFITX. Por
-- isso não tem product_id — quem entra é quem já tem conta aprovada no app.

-- ---------------------------------------------------------------- helpers

-- Conta aprovada. As telas já barram quem está pendente, mas política de
-- banco não pode depender de tela: quem chama a API direto tem que bater
-- na mesma trava.
create or replace function public.eh_aprovado()
returns boolean
language sql security definer stable set search_path = public
as $$
  select coalesce((select status from profiles where id = auth.uid()) = 'approved', false);
$$;

-- ---------------------------------------------------------------- salas

create table community_rooms (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  -- Emoji. Opcional de propósito: "#" já identifica a sala, o ícone é
  -- tempero.
  icone text,
  privada boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membro explícito. Numa sala pública isto é só quem administra/modera; em
-- sala privada é também quem pode ver.
create table community_room_members (
  room_id uuid not null references community_rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  papel text not null default 'membro' check (papel in ('admin', 'moderador', 'membro')),
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index idx_community_members_user on community_room_members (user_id);

-- Quem enxerga a sala. Security definer porque a própria política de
-- community_room_members precisa perguntar isso — sem o definer, uma
-- política consultando a tabela que ela protege entra em recursão.
create or replace function public.pode_ver_sala(sala uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select public.eh_aprovado() and exists (
    select 1 from community_rooms r
    where r.id = sala
      and (
        not r.privada
        or public.is_admin()
        or exists (
          select 1 from community_room_members m
          where m.room_id = r.id and m.user_id = auth.uid()
        )
      )
  );
$$;

-- Quem manda na sala: criador, admin/moderador dela, ou admin do app.
create or replace function public.pode_administrar_sala(sala uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from community_rooms r
    where r.id = sala and r.created_by = auth.uid()
  ) or exists (
    select 1 from community_room_members m
    where m.room_id = sala and m.user_id = auth.uid() and m.papel in ('admin', 'moderador')
  );
$$;

-- ---------------------------------------------------------------- mensagens

create table community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references community_rooms(id) on delete cascade,
  autor_id uuid references profiles(id) on delete set null,
  conteudo text not null,
  -- Resposta aponta pra mensagem, não pra thread: é o "respondendo a" do
  -- WhatsApp, que é o que a equipe já usa.
  responde_a uuid references community_messages(id) on delete set null,
  editada_em timestamptz,
  -- Exclusão é marca, não DELETE. Quem respondeu a uma mensagem excluída
  -- continua com a resposta ancorada em algo, em vez de virar um balão
  -- solto sem contexto.
  excluida_em timestamptz,
  created_at timestamptz not null default now()
);

-- A leitura é sempre "as últimas N desta sala", e a paginação é pra trás.
create index idx_community_messages_sala on community_messages (room_id, created_at desc);

create table community_reactions (
  message_id uuid not null references community_messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- Não lidas: guarda até onde a pessoa leu, não quais mensagens ela leu.
-- Uma linha por sala/pessoa em vez de uma por mensagem.
create table community_read_states (
  room_id uuid not null references community_rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- ---------------------------------------------------------------- RLS

alter table community_rooms enable row level security;
alter table community_room_members enable row level security;
alter table community_messages enable row level security;
alter table community_reactions enable row level security;
alter table community_read_states enable row level security;

-- salas
create policy "sala_select" on community_rooms
  for select using (public.pode_ver_sala(id));

-- Viewer participa, mas não cria sala: sala é estrutura, e estrutura que
-- qualquer um cria vira uma lista de 40 salas mortas em duas semanas.
create policy "sala_insert" on community_rooms
  for insert with check (
    public.eh_aprovado()
    and created_by = auth.uid()
    and public.current_user_role() in ('admin', 'editor')
  );

create policy "sala_update" on community_rooms
  for update using (public.pode_administrar_sala(id))
  with check (public.pode_administrar_sala(id));

create policy "sala_delete" on community_rooms
  for delete using (
    public.is_admin() or created_by = auth.uid()
  );

-- membros
create policy "membro_select" on community_room_members
  for select using (public.pode_ver_sala(room_id));

create policy "membro_insert" on community_room_members
  for insert with check (public.pode_administrar_sala(room_id));

create policy "membro_update" on community_room_members
  for update using (public.pode_administrar_sala(room_id))
  with check (public.pode_administrar_sala(room_id));

-- Sair da própria sala não precisa de permissão de admin.
create policy "membro_delete" on community_room_members
  for delete using (public.pode_administrar_sala(room_id) or user_id = auth.uid());

-- mensagens
create policy "mensagem_select" on community_messages
  for select using (public.pode_ver_sala(room_id));

create policy "mensagem_insert" on community_messages
  for insert with check (public.pode_ver_sala(room_id) and autor_id = auth.uid());

-- Editar é só do autor. Excluir passa por aqui também (é update de
-- excluida_em), e aí moderação entra: autor OU quem administra a sala.
create policy "mensagem_update" on community_messages
  for update using (autor_id = auth.uid() or public.pode_administrar_sala(room_id))
  with check (autor_id = auth.uid() or public.pode_administrar_sala(room_id));

-- reações
create policy "reacao_select" on community_reactions
  for select using (
    exists (select 1 from community_messages m where m.id = message_id and public.pode_ver_sala(m.room_id))
  );

create policy "reacao_insert" on community_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from community_messages m where m.id = message_id and public.pode_ver_sala(m.room_id))
  );

create policy "reacao_delete" on community_reactions
  for delete using (user_id = auth.uid());

-- leitura
create policy "leitura_propria" on community_read_states
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- não lidas

-- Uma chamada só devolve o placar do menu inteiro. A alternativa era o
-- cliente contar sala por sala — dez salas, dez consultas, a cada carga.
create or replace function public.community_nao_lidas()
returns table (room_id uuid, nao_lidas bigint)
language sql security definer stable set search_path = public
as $$
  select r.id,
         count(m.id) filter (
           where m.autor_id is distinct from auth.uid()
             and m.excluida_em is null
             and m.created_at > coalesce(rs.last_read_at, 'epoch'::timestamptz)
         )
  from community_rooms r
  left join community_read_states rs on rs.room_id = r.id and rs.user_id = auth.uid()
  left join community_messages m on m.room_id = r.id
  where public.pode_ver_sala(r.id)
  group by r.id;
$$;

-- ---------------------------------------------------------------- realtime

-- Sem isto o Postgres não publica as alterações e o chat só atualizaria com
-- refresh. O Realtime respeita as políticas acima: cada assinante só recebe
-- linha de sala que ele já poderia ler.
alter publication supabase_realtime add table community_messages;
alter publication supabase_realtime add table community_reactions;
alter publication supabase_realtime add table community_rooms;

-- ---------------------------------------------------------------- semente

-- Uma sala pra conversa não morrer na porta: tela vazia com "crie a
-- primeira sala" é convite pra ninguém criar nenhuma.
insert into community_rooms (nome, descricao, icone, privada)
values ('Geral', 'Conversa aberta da equipe.', '💬', false);
