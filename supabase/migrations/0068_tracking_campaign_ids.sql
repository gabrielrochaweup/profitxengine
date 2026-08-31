-- utm_campaign é texto livre digitado por quem monta o link do anúncio e
-- pode não bater com o nome real da campanha no Meta/Google Ads (ou mudar
-- se a campanha for renomeada). Essas duas colunas guardam o ID real da
-- campanha, capturado via parâmetro dinâmico no modelo de URL do anúncio
-- (Meta: {{campaign.id}} como "mcid"; Google Ads: ValueTrack {campaignid}
-- como "gcid") — é o que vai permitir cruzar com o gasto puxado das APIs
-- de anúncio mais pra frente, em vez de confiar só no nome digitado.
alter table tracking_leads add column meta_campaign_id text;
alter table tracking_leads add column google_campaign_id text;
