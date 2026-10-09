import "server-only";

/*
  Conversão do gasto de anúncio pra real.

  As plataformas devolvem o gasto na moeda da CONTA de anúncio (as da Meta
  são em dólar). Venda, depósito convertido e todo o resto do app estão em
  real, então o gasto precisa chegar em real pra ROAS, CPA e lucro fazerem
  sentido.

  A cotação é a do DIA do gasto (fechamento comercial, AwesomeAPI), não a de
  hoje: o gasto de 25/09 custou o dólar de 25/09. Dia sem cotação (fim de
  semana, feriado) usa a do último dia útil antes dele.

  É a cotação comercial — não inclui IOF nem o spread do cartão. Serve pra
  comparar campanhas entre si e com a venda; o valor exato da fatura é outro.
*/

export interface Conversor {
  moeda: string;
  /** Converte centavos na moeda da conta pra centavos de real, pela cotação do dia. */
  converter: (centavos: number, data: string) => { reaisCents: number; cambio: number };
}

/** Dia (AAAA-MM-DD) no fuso de São Paulo — o mesmo fuso das contas de anúncio. */
function diaSaoPaulo(epochSegundos: number): string {
  return new Date(epochSegundos * 1000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/**
 * Monta o conversor da moeda pra real cobrindo o intervalo pedido. Devolve
 * null se a cotação não carregar — quem chama não deve salvar gasto em moeda
 * estrangeira como se fosse real.
 */
export async function criarConversor(moeda: string, desde: string): Promise<Conversor | null> {
  const m = moeda.trim().toUpperCase();
  if (m === "BRL") return { moeda: "BRL", converter: (centavos) => ({ reaisCents: centavos, cambio: 1 }) };

  // Dias corridos desde o começo do intervalo, com folga pro último dia útil
  // antes dele (o primeiro dia pode cair num domingo).
  const dias = Math.ceil((Date.now() - new Date(`${desde}T00:00:00Z`).getTime()) / 86_400_000) + 10;

  let historico: { bid?: string; timestamp?: string }[];
  try {
    const res = await fetch(`https://economia.awesomeapi.com.br/json/daily/${m}-BRL/${Math.min(Math.max(dias, 15), 360)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    historico = await res.json();
    if (!Array.isArray(historico)) return null;
  } catch {
    return null;
  }

  // Um valor por dia; a lista vem do mais novo pro mais velho, então o
  // primeiro que aparece de cada dia é o fechamento dele.
  const porDia = new Map<string, number>();
  for (const h of historico) {
    const bid = Number(h.bid);
    const ts = Number(h.timestamp);
    if (!Number.isFinite(bid) || bid <= 0 || !Number.isFinite(ts)) continue;
    const dia = diaSaoPaulo(ts);
    if (!porDia.has(dia)) porDia.set(dia, bid);
  }
  if (porDia.size === 0) return null;

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
    moeda: m,
    converter: (centavos, data) => {
      const cambio = cotacaoDo(data);
      return { reaisCents: Math.round(centavos * cambio), cambio };
    },
  };
}
