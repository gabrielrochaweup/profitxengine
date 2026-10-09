import "server-only";

interface UsdBrlRate {
  rate: number;
  updatedAt: string | null;
}

// Cotação USD→BRL, usada pra converter o depósito de corretora (sempre em
// dólar) pra real na comparação de ROI/ROAS/Lucro com o curso. Cacheada
// pelo fetch do Next pra não bater nas APIs externas a cada carregamento.
//
// Fontes, nesta ordem:
//   1. PTAX do Banco Central (oficial, sem chave): a cotação de venda do
//      último dia útil. É a mesma fonte que converte o gasto de anúncio, então
//      gasto e depósito ficam na mesma régua.
//   2. AwesomeAPI (reserva). Ela responde de um computador, mas recusa pedido
//      vindo do servidor — foi por isso que o cartão "Cotação USD/BRL" ficava
//      em "Carregando…" e o ROI da corretora sumia.
export async function getUsdBrlRate(): Promise<UsdBrlRate | null> {
  return (await ptax()) ?? (await awesome());
}

async function ptax(): Promise<UsdBrlRate | null> {
  try {
    const fim = new Date();
    const inicio = new Date(fim.getTime() - 10 * 86_400_000);
    const mmddaaaa = (d: Date) => {
      const [a, m, dia] = d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).split("-");
      return `${m}-${dia}-${a}`;
    };
    const url =
      "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/" +
      "CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)" +
      `?@dataInicial='${mmddaaaa(inicio)}'&@dataFinalCotacao='${mmddaaaa(fim)}'` +
      "&$format=json&$select=cotacaoVenda,dataHoraCotacao&$orderby=dataHoraCotacao desc&$top=1";
    const res = await fetch(encodeURI(url), { next: { revalidate: 300 }, signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const linha = (await res.json())?.value?.[0];
    const rate = linha?.cotacaoVenda;
    if (typeof rate !== "number" || !(rate > 0)) return null;

    const quando = typeof linha.dataHoraCotacao === "string" ? linha.dataHoraCotacao.slice(0, 16) : null;
    return { rate, updatedAt: quando ? `${quando} (PTAX)` : null };
  } catch {
    return null;
  }
}

async function awesome(): Promise<UsdBrlRate | null> {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;

    const body = await res.json();
    const bid = body?.USDBRL?.bid;
    const rate = typeof bid === "string" ? Number(bid) : null;
    if (!rate || Number.isNaN(rate)) return null;

    const createDate = body?.USDBRL?.create_date;
    return { rate, updatedAt: typeof createDate === "string" ? createDate : null };
  } catch {
    return null;
  }
}
