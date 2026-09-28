-- Número da Alavancagem, configurável em Configurações > Performance de
-- Trading — no mesmo lugar onde já se edita o resultado ao vivo de
-- Pepe/Copy/Live.
--
-- O número de hoje (da migration 0118, embutido no link de 6 dinâmicas)
-- CONTINUA fazendo o trabalho normalmente — esta coluna é uma SOBRESCRITA
-- opcional, não uma substituição. Vazia (o padrão), nada muda. Preenchida,
-- o número novo passa a valer em toda dinâmica que tiver um link de
-- WhatsApp em extra_vars, sem precisar editar uma por uma nem pedir uma
-- migration nova a cada troca.
--
-- A aplicação é em CÓDIGO, no momento de montar a mensagem
-- (src/lib/dynamics/render-message.ts), não aqui no banco: o link de cada
-- dinâmica continua com o número antigo gravado em extra_vars, só o TEXTO
-- FINAL mostrado pra equipe é que sai com o número trocado.
alter table trading_config
  add column if not exists numero_alavancagem_override text;
