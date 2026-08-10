-- Segundo modelo de post no Gerador de Posts: identidade visual do site
-- lives.escolaprofitx.com (fundo preto, dourado de marca, cards com borda
-- sutil, título 2 linhas + card de estatística) — pra criar conteúdos
-- estáticos e padronizados com a logo da PROFITX sempre no mesmo lugar.
-- Campos novos ficam nullable e só são usados quando template = 'profitx';
-- os campos do modelo Twitter (já existentes) continuam intactos.
alter table fake_posts add column template text check (template in ('twitter', 'profitx')) not null default 'twitter';
alter table fake_posts add column profitx_badge_text text;
alter table fake_posts add column profitx_headline_1 text;
alter table fake_posts add column profitx_headline_2 text;
alter table fake_posts add column profitx_stat_label text;
alter table fake_posts add column profitx_stat_value text;
alter table fake_posts add column profitx_stat_caption text;
alter table fake_posts add column profitx_footer_line1 text;
alter table fake_posts add column profitx_footer_line2 text;
alter table fake_posts add column profitx_accent text check (profitx_accent in ('dourado', 'azul', 'verde')) not null default 'dourado';
