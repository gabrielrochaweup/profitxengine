-- Como o blog chega no site. Dois modos porque os domínios não são iguais:
-- em alguns a gente controla o servidor e dá pra pendurar o blog dentro do
-- domínio principal; em outros só dá pra apontar um subdomínio.
--
--   subdiretorio -> seudominio.com/blog      (proxy reverso no servidor)
--   subdominio   -> blog.seudominio.com      (CNAME apontando pra cá)
--
-- Não é só preferência: no subdiretório a autoridade do conteúdo soma no
-- domínio principal, e no subdomínio o Google trata como site vizinho. Vale
-- usar subdiretório onde der, e por isso o modo é do domínio, não global.
alter table blog_dominios
  add column modo text not null default 'subdiretorio'
  check (modo in ('subdiretorio', 'subdominio'));
