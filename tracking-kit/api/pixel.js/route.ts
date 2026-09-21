import { NextResponse } from "next/server";
import { trackingConfig } from "@/tracking-kit/tracking.config";

/*
  O script que se cola no site.

  Uma tag, em qualquer site — a landing de hoje, a de amanhã, a página de um
  parceiro:

    <script src="https://SEU-APP/api/tracking/pixel.js" async></script>

  Atributos opcionais na própria tag:
    data-workspace="<uuid>"      → só em projeto multi-produto
    data-meta-pixel="123,456"    → carrega o pixel da Meta e dispara PageView/Lead
    data-google-tag="AW-123"     → idem pro Google

  O grosso deste arquivo não é o envio do lead: é INTERCEPTAR A NAVEGAÇÃO
  pro checkout pra carimbar o lead_id no link. Cada bloco marcado abaixo
  cobre um jeito diferente de um construtor de página navegar, e todos eles
  apareceram em site real:

    <a href>            Elementor, Wix, HTML direto
    window.open()       Inlead e outros construtores de quiz
    location.assign()   idem
    a.click() fora do DOM   SPAs
    form.submit()       formulário com method=get

  Sem isso, a compra chega no webhook sem "ref" e o casamento cai pro
  e-mail — que funciona na maioria das vezes e falha justamente em quem
  compra com um e-mail diferente do que usou na landing.
*/

const SCRIPT = `
(function () {
  var tag = document.currentScript;
  if (!tag) return;

  var workspace = tag.getAttribute("data-workspace") || "__WORKSPACE_PADRAO__";
  var collectUrl = new URL("/api/tracking/collect", tag.src).href;
  var eventUrl = new URL("/api/tracking/client-event", tag.src).href;
  var etapaDeCheckout = "__ETAPA_CHECKOUT__";
  var chave = "tk_lead_" + workspace;

  function cookie(nome) {
    var m = document.cookie.match("(?:^|; )" + nome + "=([^;]*)");
    return m ? decodeURIComponent(m[1]) : null;
  }
  function gravarCookie(nome, valor, dias) {
    var ate = new Date(Date.now() + dias * 864e5).toUTCString();
    document.cookie = nome + "=" + encodeURIComponent(valor) + "; expires=" + ate + "; path=/; SameSite=Lax";
  }
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // localStorage primeiro, cookie como reserva: em navegação anônima e em
  // alguns iOS o localStorage some, e perder o lead_id entre a landing e o
  // checkout quebra a atribuição inteira.
  var leadId = null;
  try { leadId = localStorage.getItem(chave); } catch (e) {}
  if (!leadId) leadId = cookie(chave);
  var primeiraVisita = !leadId;
  if (!leadId) leadId = uuid();
  try { localStorage.setItem(chave, leadId); } catch (e) {}
  gravarCookie(chave, leadId, 90);

  function avisarEtapa(etapa) {
    try {
      var corpo = JSON.stringify({ lead_id: leadId, workspace_id: workspace, event_type: etapa });
      // sendBeacon e não fetch: a página navega embora logo em seguida, e
      // um fetch comum é cancelado antes de sair do navegador.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(eventUrl, new Blob([corpo], { type: "application/json" }));
      } else {
        fetch(eventUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }

  window.TrackingKit = {
    leadId: function () { return leadId; },
    // paramName tem padrão "ref", mas várias plataformas só devolvem um
    // nome fixo que elas já conhecem (Hotmart e Onprofit: "sck").
    comRef: function (url, paramName, etapa) {
      try {
        if (etapa) {
          if (window.fbq) window.fbq("track", "InitiateCheckout");
          if (window.gtag) window.gtag("event", "begin_checkout");
          avisarEtapa(etapa);
        }
        var u = new URL(url, window.location.href);
        u.searchParams.set(paramName || "ref", leadId);
        u.searchParams.delete("tkevt");
        return u.toString();
      } catch (e) {
        return url;
      }
    },
  };

  /*
    Modo sem código.

    Em construtor onde o botão só aceita uma URL pura (sem onclick), o link
    já é montado com "ref=" ou "sck=" VAZIO — e "tkevt=checkout" quando for
    link de pagamento. Aqui a gente só preenche o valor antes de navegar.
  */
  function reescrever(url) {
    if (typeof url !== "string") return url;
    var u;
    try { u = new URL(url, window.location.href); } catch (e) { return url; }
    var param = u.searchParams.has("sck") ? "sck" : u.searchParams.has("ref") ? "ref" : null;
    if (!param) return url;
    var ehCheckout = u.searchParams.get("tkevt") === "checkout";
    return window.TrackingKit.comRef(url, param, ehCheckout ? etapaDeCheckout : undefined);
  }

  // <a href> de verdade.
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!el) return;
    var novo = reescrever(el.href);
    if (novo === el.href) return;
    e.preventDefault();
    window.location.href = novo;
  }, true);

  // window.open() e location.assign()/replace() — o caminho dos quizzes.
  // ("location.href = ..." não dá pra interceptar; por isso o modo sem
  // código depende do parâmetro já estar na URL.)
  var abrirNativo = window.open;
  window.open = function (url, alvo, opcoes) { return abrirNativo.call(window, reescrever(url), alvo, opcoes); };
  try {
    var assignNativo = window.location.assign.bind(window.location);
    window.location.assign = function (url) { return assignNativo(reescrever(url)); };
  } catch (e) {}
  try {
    var replaceNativo = window.location.replace.bind(window.location);
    window.location.replace = function (url) { return replaceNativo(reescrever(url)); };
  } catch (e) {}

  // <a> criado por código e clicado sem entrar na página: o clique não
  // borbulha até o document, então o listener acima nunca o vê.
  try {
    var cliqueNativo = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var novo = reescrever(this.href);
      if (novo !== this.href) this.href = novo;
      return cliqueNativo.call(this);
    };
  } catch (e) {}

  // <form method="get">.submit()
  try {
    var submitNativo = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      var novo = reescrever(this.action);
      if (novo !== this.action) this.action = novo;
      return submitNativo.call(this);
    };
  } catch (e) {}

  // Pixels de anúncio, quando a tag pedir. Purchase NÃO sai daqui: a compra
  // acontece no domínio do checkout. Isso é trabalho da API de Conversões,
  // do lado do servidor, quando o webhook chega.
  var metaIds = (tag.getAttribute("data-meta-pixel") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var googleIds = (tag.getAttribute("data-google-tag") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);

  if (metaIds.length) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    metaIds.forEach(function (id) { window.fbq("init", id); });
    window.fbq("track", "PageView");
    if (primeiraVisita) window.fbq("track", "Lead");
  }

  if (googleIds.length) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + googleIds[0];
    document.head.appendChild(g);
    googleIds.forEach(function (id) { window.gtag("config", id); });
    if (primeiraVisita) window.gtag("event", "generate_lead");
  }

  // Só a primeira visita grava o lead: é o primeiro toque que define a
  // origem, e reenviar a cada página sobrescreveria a campanha original.
  if (!primeiraVisita) return;

  var p = new URLSearchParams(window.location.search);
  fetch(collectUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: leadId,
      workspace_id: workspace,
      utm_source: p.get("utm_source"),
      utm_medium: p.get("utm_medium"),
      utm_campaign: p.get("utm_campaign"),
      utm_content: p.get("utm_content"),
      utm_term: p.get("utm_term"),
      fbclid: p.get("fbclid"),
      gclid: p.get("gclid"),
      // Id da campanha: {{campaign.id}} no modelo de URL do Meta Ads,
      // {campaignid} no ValueTrack do Google. É o que cruza gasto com
      // resultado sem depender do NOME da campanha, que muda no meio do mês.
      meta_campaign_id: p.get("mcid"),
      google_campaign_id: p.get("gcid"),
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc"),
      landing_url: window.location.href,
      referrer: document.referrer || null,
    }),
  }).catch(function () {});
})();
`.trim();

export async function GET() {
  const script = SCRIPT.replace("__WORKSPACE_PADRAO__", trackingConfig.workspaceIdPadrao).replace(
    "__ETAPA_CHECKOUT__",
    trackingConfig.eventosDoPixel[0] ?? ""
  );

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // "no-cache" e não "no-store": continua cacheando, mas revalida antes
      // de servir. Com "public, max-age=300" o CDN serviu versão antiga por
      // muito mais que 5 minutos depois de um deploy, atrasando correção
      // neste script em produção.
      "Cache-Control": "no-cache",
    },
  });
}
