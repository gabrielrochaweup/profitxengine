/**
 * Deixa o nome do arquivo seguro pra usar como chave no Storage do
 * Supabase — espaço, acento (ex: "à", "ã") e outros caracteres especiais
 * (ex: nome de print do macOS: "Captura de Tela ... às HH.MM.SS.png")
 * fazem o upload falhar com "Invalid key". O nome original (com acento e
 * espaço) continua sendo salvo à parte pra exibição, só a chave de
 * armazenamento passa por aqui.
 */
export function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < name.length - 1;
  const base = hasExt ? name.slice(0, lastDot) : name;
  const ext = hasExt ? name.slice(lastDot) : "";

  const cleanBase = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (á, ã, ç -> a, a, c)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const cleanExt = ext
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.]/g, "");

  return `${cleanBase || "arquivo"}${cleanExt}`;
}
