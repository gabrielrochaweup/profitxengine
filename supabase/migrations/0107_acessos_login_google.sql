-- Nem toda conta tem senha: várias entram pelo "Continuar com o Google".
--
-- Sem esse campo, essas contas ficavam sem senha guardada e a tela dizia a
-- mesma coisa que diz pra quem simplesmente esqueceu de anotar: "sem senha".
-- São situações opostas — numa falta informação, na outra não existe senha
-- pra faltar. Quem chega às 23h precisando entrar tem que saber qual das
-- duas é, e por qual conta do Google entrar (o campo `usuario`).

alter table acessos add column if not exists login_google boolean not null default false;
