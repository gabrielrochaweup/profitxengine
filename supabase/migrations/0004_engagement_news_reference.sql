-- Registra qual notícia/manchete cripto foi usada como gancho para gerar a
-- mensagem do dia no Calendário de Engajamento (mesma ideia já usada em
-- email_campaigns.news_reference).

alter table engagement_messages
  add column if not exists news_reference text;
