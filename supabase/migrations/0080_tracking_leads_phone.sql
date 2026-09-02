-- Segunda camada de casamento de lead, além de e-mail — cobre o caso de
-- alguém usar um e-mail diferente na corretora do que usou na compra, mas
-- o mesmo telefone. Ver src/lib/tracking/match-lead.ts.
alter table tracking_leads add column phone text;
