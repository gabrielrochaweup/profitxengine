-- Troca o número de WhatsApp "chamar pra participar da Alavancagem", que
-- aparece embutido no link de 6 das 7 dinâmicas.
--
-- O link mora em message_dynamics.extra_vars->>'link' (o mesmo campo que a
-- tela Gerenciar > [dinâmica] edita à mão, um por um). Aqui é uma troca só,
-- pros 6 de uma vez, sem reescrever nada além do número.
--
-- Da https://wa.me/554796988463  pra  https://wa.me/15554745809
--
-- O replace() troca só a sequência de dígitos antiga — o "?text=..." de
-- cada dinâmica continua exatamente como estava (5 delas mandam
-- "PARTICIPAR DA ALAVANCAGEM", a Upgrade Direto manda "QUERO FAZER
-- UPGRADE"), e nenhum outro campo é tocado: linkL (Google Meet) e linkU
-- (grupo em lives.escolaprofitx.com) ficam como estão.
--
-- A Sessão Kamikaze FICA DE FORA de propósito: o link dela hoje não é um
-- número de WhatsApp, é https://lives.escolaprofitx.com/grupo. Se essa
-- dinâmica também devia chamar pelo número novo, isso é uma decisão
-- separada — avise que eu ajusto.
--
-- Não mexe em dynamic_snapshots: aquilo é o retrato do que já rodou em dias
-- passados, e trocar o número ali reescreveria histórico.
update message_dynamics
set extra_vars = jsonb_set(
  extra_vars,
  '{link}',
  to_jsonb(replace(extra_vars->>'link', '554796988463', '15554745809'))
)
where extra_vars->>'link' like 'https://wa.me/554796988463?%';
