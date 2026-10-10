-- Preenche o ID do produto (item_id) das compras que já existiam.
--
-- A 0134 foi rodada em duas versões: a primeira sem item_id, a segunda com. O
-- preenchimento da segunda só mexe em linhas que ainda não têm item_tipo, e
-- as compras antigas já tinham ficado com ele da primeira rodada — então o
-- item_id delas ficou vazio. Sem ele, o mesmo produto renomeado (o 6105 já foi
-- "[TRIAD] COPY TRADER" e "SESSÃO COPY TRADER INDIVIDUAL") aparece em duas
-- linhas nas vendas por produto.
--
-- Só preenche o que está vazio, a partir do payload cru guardado em
-- raw_payload. Nada é apagado nem sobrescrito. Pode ser rodada mais de uma vez.

update tracking_events e
set item_id = nullif(e.raw_payload -> 'product' ->> 'id', '')
where e.source = 'onprofit'
  and e.event_type = 'purchase'
  and e.item_id is null
  and nullif(e.raw_payload -> 'product' ->> 'id', '') is not null;
