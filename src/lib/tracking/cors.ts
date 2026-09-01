// Algumas plataformas de terceiro (checkout, área de membros, corretora)
// testam o próprio webhook chamando direto do navegador do painel admin
// delas, em vez de servidor pra servidor — sem CORS liberado, o preflight
// OPTIONS falha antes mesmo de chegar na nossa rota (o típico "NetworkError
// when attempting to fetch resource" do lado deles). Mesmo modelo já usado
// em /api/tracking/collect: a validação de negócio é o token/slug, não a
// origem da chamada.
export function webhookCorsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-profitx-test",
  };
}
