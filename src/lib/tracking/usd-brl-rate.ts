import "server-only";

interface UsdBrlRate {
  rate: number;
  updatedAt: string | null;
}

// Cotação USD→BRL via AwesomeAPI (gratuita, sem chave, atualizada ao longo
// do dia) — usada só pra converter depósito de corretora (sempre em dólar)
// pra real na comparação de ROI/ROAS/Lucro com o curso. Cacheada por 5min
// pelo fetch do Next pra não bater na API externa a cada carregamento.
export async function getUsdBrlRate(): Promise<UsdBrlRate | null> {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      next: { revalidate: 300 },
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
