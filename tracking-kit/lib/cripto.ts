import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/*
  O segredo de cada endpoint, guardado cifrado.

  Vale pro token que o kit gera (plataformas comuns) e pro `whsec_…` do
  Stripe: os dois são credenciais que, vazadas, deixam qualquer um forjar
  evento no seu funil.

  AES-256-GCM com chave derivada de uma variável de ambiente. Duas coisas
  que não podem mudar depois que houver dado gravado: TRACKING_ENCRYPTION_KEY
  e o sal abaixo — trocar qualquer um dos dois torna ilegível todo segredo
  já cifrado, e a recuperação é recadastrar endpoint por endpoint.
*/

const ALGORITMO = "aes-256-gcm";
const SAL = "tracking-kit-salt";

function chave(): Buffer {
  const segredo = process.env.TRACKING_ENCRYPTION_KEY;
  if (!segredo) {
    throw new Error("TRACKING_ENCRYPTION_KEY não configurada no ambiente.");
  }
  return scryptSync(segredo, SAL, 32);
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);
  const cifrado = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return [iv.toString("hex"), cifra.getAuthTag().toString("hex"), cifrado.toString("hex")].join(":");
}

export function decifrar(payload: string): string {
  const [ivHex, tagHex, dadoHex] = payload.split(":");
  const decifra = createDecipheriv(ALGORITMO, chave(), Buffer.from(ivHex, "hex"));
  decifra.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decifra.update(Buffer.from(dadoHex, "hex")), decifra.final()]).toString("utf8");
}

/** Token novo pra um endpoint. 32 bytes em hex — nada de gerar isso à mão. */
export function novoToken(): string {
  return randomBytes(32).toString("hex");
}
