-- Criar sala falhava, e a sala nem aparecia no banco.
--
-- A política de leitura de community_rooms chamava pode_ver_sala(id), que
-- consulta a PRÓPRIA community_rooms. No insert com RETURNING (que é o que o
-- cliente faz pra já receber a sala criada), essa função roda dentro da mesma
-- instrução do INSERT e, por ser `stable`, enxerga o snapshot anterior a ela —
-- onde a linha recém-inserida ainda não existe. A leitura voltava vazia, o
-- PostgREST não conseguia montar a resposta e desfazia a transação inteira.
-- Daí o sintoma: erro na tela e nenhuma sala criada.
--
-- A correção é a política olhar as colunas da própria linha em vez de ir
-- buscá-la de novo na tabela. `privada` e `id` já estão ali, na linha sendo
-- avaliada.
--
-- As outras tabelas seguem usando pode_ver_sala(room_id) sem problema: lá a
-- função consulta community_rooms, que é OUTRA tabela e já está gravada.

drop policy if exists "sala_select" on community_rooms;

create policy "sala_select" on community_rooms
  for select using (
    public.eh_aprovado()
    and (
      not privada
      or public.is_admin()
      or exists (
        select 1 from community_room_members m
        where m.room_id = community_rooms.id and m.user_id = auth.uid()
      )
    )
  );
