/**
 * Endereço público OFICIAL do app — o único que deve aparecer em qualquer
 * URL que a equipe copia e cola em outra ferramenta (webhooks do
 * SendPulse/Onprofit/Vortex, tag do pixel nos sites, alvo do proxy do blog).
 *
 * Antes essas URLs eram montadas com window.location.origin, então quem abria
 * o app pelo domínio da Vercel copiava a URL da Vercel e registrava ela nas
 * ferramentas — e o tráfego de tracking passava a chegar por um segundo
 * endereço. Fixar aqui garante que a URL copiada é sempre a mesma, não
 * importa por onde a tela foi aberta.
 *
 * Não vem de variável de ambiente de propósito: um valor errado no ambiente
 * (ou esquecido num deploy) traria o problema de volta sem ninguém perceber.
 */
export const HOST_PUBLICO_DO_APP = "engine.escolaprofitx.com";
export const ORIGEM_PUBLICA_DO_APP = `https://${HOST_PUBLICO_DO_APP}`;
