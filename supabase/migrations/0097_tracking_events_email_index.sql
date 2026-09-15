-- O caminho de disparo do WhatsApp busca tracking_events por
-- (product_id, email) em toda compra e toda assinatura, pra decidir se a
-- pessoa tem compra, acesso e contrato. Os índices existentes cobrem
-- product_id, lead_id e event_type isoladamente, então essa consulta lê
-- todas as linhas do produto e filtra na memória.
--
-- Com a tabela pequena isso é irrelevante, mas ela cresce a cada page_view
-- do site — e essa consulta roda dentro da mesma requisição que já espera
-- até 8s pelo SendPulse.
create index if not exists idx_tracking_events_product_email
  on public.tracking_events (product_id, email);
