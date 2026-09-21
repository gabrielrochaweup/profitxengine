import { createHmac, timingSafeEqual } from "crypto";

/*
  Verificação da assinatura do Stripe, sem o SDK.

  O header vem assim: `t=1614...,v1=5257a869...,v1=<outra>`. Mais de um v1
  acontece durante a rotação do segredo no painel do Stripe — basta um
  bater.

  A tolerância de tempo não é decoração: sem ela, alguém que capture um
  webhook válido pode reenviá-lo pra sempre, e cada reenvio seria aceito.
  Cinco minutos é o valor que o próprio Stripe recomenda.
*/
const TOLERANCIA_SEGUNDOS = 5 * 60;

export function assinaturaStripeConfere(corpoCru: string, header: string, segredo: string): boolean {
  const partes = header.split(",").map((p) => p.trim());
  const timestamp = partes.find((p) => p.startsWith("t="))?.slice(2);
  const assinaturas = partes.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));

  if (!timestamp || assinaturas.length === 0) return false;

  const emSegundos = Number(timestamp);
  if (!Number.isFinite(emSegundos)) return false;
  if (Math.abs(Date.now() / 1000 - emSegundos) > TOLERANCIA_SEGUNDOS) return false;

  const esperada = createHmac("sha256", segredo).update(`${timestamp}.${corpoCru}`, "utf8").digest("hex");

  return assinaturas.some((recebida) => iguaisEmTempoConstante(recebida, esperada));
}

/**
 * Comparação sem vazar tempo.
 *
 * `a === b` sai no primeiro caractere diferente, e a diferença de
 * microssegundos entre "errou no primeiro" e "errou no último" é suficiente
 * pra descobrir um segredo caractere por caractere. Raro de explorar pela
 * rede, barato de evitar.
 */
export function iguaisEmTempoConstante(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
