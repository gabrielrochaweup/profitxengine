-- Números > indica em qual conta do SendPulse o número está cadastrado.
--
-- Só o e-mail da conta — sem senha, sem token, sem nada que precise ser
-- protegido. É outro campo de organização, igual nome/cor/função: ajuda a
-- equipe a achar rápido em qual login do SendPulse mexer pra aquele número
-- específico, quando a operação usa mais de uma conta.

alter table numeros_de_atendimento
  add column if not exists sendpulse_email text;
