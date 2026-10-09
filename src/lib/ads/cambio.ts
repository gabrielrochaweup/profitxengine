import "server-only";

/*
  Conversão do gasto de anúncio pra real.

  As plataformas devolvem o gasto na moeda da CONTA de anúncio (as da Meta
  são em dólar). Venda, depósito convertido e todo o resto do app estão em
  real, então o gasto precisa chegar em real pra ROAS, CPA e lucro fazerem
  sentido.

  A cotação é a do DIA do gasto, não a de hoje: o gasto de 25/09 custou o
  dólar de 25/09. Dia sem cotação (fim de semana, feriado) usa a do último
  dia útil antes dele.

  Fontes, nesta ordem:
    1. PTAX do Banco Central (oficial, sem chave, histórico por período);
    2. AwesomeAPI (reserva). Ela responde normal de um computador, mas
       recusa pedido vindo do servidor — foi o que derrubou a primeira
       versão deste sync, que só usava ela.

  É a cotação de venda do dia — não inclui IOF nem o spread do cartão. Serve
  pra comparar campanhas entre si e com a venda; o valor exato da fatura é
  outro.
*/

export interface Conversor {
  moeda: string;
  /** De onde veio a cotação (pra mensagem e diagnóstico). */
  fonte: string;
  /** Converte centavos na moeda da conta pra centavos de real, pela cotação do dia. */
  converter: (centavos: number, data: string) => { reaisCents: number; cambio: number };
}

type CotacoesPorDia = Map<string, number>;

/** AAAA-MM-DD → MM-DD-AAAA, o formato que a API do Banco Central pede. */
function formatoBcb(data: string): string {
  const [a, m, d] = data.split("-");
  return `${m}-${d}-${a}`;
}

function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function diasAntes(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

async function buscarJson(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** PTAX (cotação de venda) do Banco Central, um valor por dia útil. */
async function cotacoesBcb(moeda: string, desde: string, ate: string): Promise<CotacoesPorDia> {
  const base = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
  const periodo = `@dataInicial='${formatoBcb(desde)}'&@dataFinalCotacao='${formatoBcb(ate)}'`;
  const url =
    moeda === "USD"
      ? `${base}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${periodo}&$format=json&$select=cotacaoVenda,dataHoraCotacao`
      : `${base}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${moeda}'&${periodo}&$format=json&$filter=tipoBoletim eq 'Fechamento'&$select=cotacaoVenda,dataHoraCotacao`;

  const json = (await buscarJson(encodeURI(url))) as { value?: { cotacaoVenda?: number; dataHoraCotacao?: string }[] };
  const porDia: CotacoesPorDia = new Map();
  for (const v of json.value ?? []) {
    const dia = v.dataHoraCotacao?.slice(0, 10);
    if (dia && typeof v.cotacaoVenda === "number" && v.cotacaoVenda > 0) porDia.set(dia, v.cotacaoVenda);
  }
  return porDia;
}

/** Histórico diário da AwesomeAPI (reserva). */
async function cotacoesAwesome(moeda: string, desde: string): Promise<CotacoesPorDia> {
  const dias = Math.ceil((Date.now() - new Date(`${desde}T00:00:00Z`).getTime()) / 86_400_000) + 5;
  const lista = await buscarJson(
    `https://economia.awesomeapi.com.br/json/daily/${moeda}-BRL/${Math.min(Math.max(dias, 15), 360)}`
  );
  const porDia: CotacoesPorDia = new Map();
  if (!Array.isArray(lista)) return porDia;
  // A lista vem do mais novo pro mais velho: o primeiro de cada dia é o fechamento.
  for (const h of lista as { bid?: string; timestamp?: string }[]) {
    const bid = Number(h.bid);
    const ts = Number(h.timestamp);
    if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(ts)) continue;
    const dia = new Date(ts * 1000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (!porDia.has(dia)) porDia.set(dia, bid);
  }
  return porDia;
}

/**
 * Monta o conversor da moeda pra real cobrindo o intervalo pedido. Devolve
 * o motivo da falha em vez do conversor se nenhuma fonte responder — quem
 * chama não deve salvar gasto em moeda estrangeira como se fosse real.
 */
export async function criarConversor(moeda: string, desde: string): Promise<Conversor | { erro: string }> {
  const m = moeda.trim().toUpperCase();
  if (m === "BRL") {
    return { moeda: "BRL", fonte: "sem conversão", converter: (centavos) => ({ reaisCents: centavos, cambio: 1 }) };
  }

  // Folga antes do início: o primeiro dia do intervalo pode cair num fim de
  // semana e precisar da cotação da sexta.
  const inicio = diasAntes(desde, 10);
  const fontes: [string, () => Promise<CotacoesPorDia>][] = [
    ["PTAX Banco Central", () => cotacoesBcb(m, inicio, hojeSaoPaulo())],
    ["AwesomeAPI", () => cotacoesAwesome(m, inicio)],
  ];

  const falhas: string[] = [];
  for (const [fonte, buscar] of fontes) {
    try {
      const porDia = await buscar();
      if (porDia.size > 0) return montar(m, fonte, porDia);
      falhas.push(`${fonte}: sem cotações`);
    } catch (err) {
      falhas.push(`${fonte}: ${err instanceof Error ? err.message : "falhou"}`);
    }
  }
  return { erro: falhas.join(" · ") };
}

function montar(moeda: string, fonte: string, porDia: CotacoesPorDia): Conversor {
  const diasOrdenados = Array.from(porDia.keys()).sort();

  function cotacaoDo(data: string): number {
    const exata = porDia.get(data);
    if (exata) return exata;
    // Último dia útil antes; se o gasto for anterior a todo o histórico, o
    // dia mais antigo que tiver.
    let escolhido = diasOrdenados[0];
    for (const d of diasOrdenados) {
      if (d <= data) escolhido = d;
      else break;
    }
    return porDia.get(escolhido)!;
  }

  return {
    moeda,
    fonte,
    converter: (centavos, data) => {
      const cambio = cotacaoDo(data);
      return { reaisCents: Math.round(centavos * cambio), cambio };
    },
  };
}
