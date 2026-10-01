import { NextResponse } from "next/server";

// Script genérico de rastreamento — hospedado aqui pra poder ser colado em
// QUALQUER site (a landing de hoje é só o primeiro consumidor), em vez de
// duplicado inline em cada HTML. O produto vem do atributo data-product da
// própria tag <script>, então o mesmo arquivo serve qualquer produto/site
// sem precisar editar nada aqui.
//
// Uso: <script src=".../api/tracking/pixel.js" data-product="profitx" async></script>
//
// Convenção de parâmetro de campanha (opcional, além de utm_campaign):
// "mcid" = ID da campanha no Meta Ads (parâmetro dinâmico {{campaign.id}}
// no modelo de URL do anúncio), "gcid" = ID da campanha no Google Ads
// (ValueTrack {campaignid}).
const PIXEL_SCRIPT = `
(function () {
  var scriptTag = document.currentScript;
  if (!scriptTag) return;
  var productSlug = scriptTag.getAttribute("data-product");
  if (!productSlug) return;

  var collectUrl = new URL("/api/tracking/collect", scriptTag.src).href;
  var clientEventUrl = new URL("/api/tracking/client-event", scriptTag.src).href;
  var storageKey = "px_lead_id_" + productSlug;

  function getCookie(name) {
    var match = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/; SameSite=Lax";
  }

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Pixels da Meta que a PÁGINA já iniciou por conta própria (ex: integração
  // nativa do construtor). Olha o estado do fbevents.js já carregado e,
  // se ele ainda não terminou de carregar, a fila do snippet padrão.
  function pixelsMetaJaIniciados() {
    var ids = [];
    try {
      if (window.fbq && typeof window.fbq.getState === "function") {
        (window.fbq.getState().pixels || []).forEach(function (p) { ids.push(String(p.id)); });
      }
    } catch (e) {}
    try {
      ((window.fbq && window.fbq.queue) || []).forEach(function (args) {
        if (args && args[0] === "init") ids.push(String(args[1]));
      });
    } catch (e) {}
    return ids;
  }

  // PageView (se ligado na tela) — e só UMA vez por pixel. Se a página já
  // tem o mesmo pixel (instalado pelo construtor, por exemplo), ele já
  // mandou o PageView dele: iniciar de novo e disparar outro duplicaria o
  // evento. Por isso inicia só os pixels que a página ainda não iniciou e
  // usa trackSingle (não "track", que dispara pra TODOS os pixels da
  // página, inclusive os dela).
  function loadMetaPixel(ids, enviarPageView) {
    var jaIniciados = pixelsMetaJaIniciados();
    var novos = ids.filter(function (id) { return jaIniciados.indexOf(String(id)) === -1; });
    if (!novos.length) return;
    if (!window.fbq) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    }
    novos.forEach(function (id) {
      window.fbq("init", id);
      if (enviarPageView) window.fbq("trackSingle", id, "PageView");
    });
  }

  // Eventos ligados em Tracking > Rastreamento (vem do pixel-config). null
  // até a config chegar — evento que acontecer antes disso não é enviado
  // (best-effort, nunca segura a navegação).
  var eventosMeta = null;
  var metaIds = [];

  // Manda um evento só pros NOSSOS pixels (trackSingle), não pra qualquer
  // outro pixel que a página tenha.
  function dispararMeta(evento) {
    if (!window.fbq) return;
    metaIds.forEach(function (id) { window.fbq("trackSingle", id, evento); });
  }

  // Cada endereço cadastrado é "domínio/caminho" e, opcionalmente,
  // "?param=valor". O caminho tem que estar no endereço atual e cada
  // parâmetro tem que existir com o mesmo valor — em QUALQUER ordem. Comparar
  // o texto inteiro falharia quando o link chega com outros parâmetros antes
  // (ex: "?sck=...&off=..." em vez de "?off=...&sck=...").
  function ehPaginaDeCheckout(paginas) {
    var aqui = (window.location.host + window.location.pathname).toLowerCase();
    var params = new URLSearchParams(window.location.search.toLowerCase());
    return (paginas || []).some(function (p) {
      if (!p) return false;
      var partes = String(p).toLowerCase().split("?");
      if (aqui.indexOf(partes[0]) === -1) return false;
      if (!partes[1]) return true;
      var exigidos = new URLSearchParams(partes[1]);
      var ok = true;
      exigidos.forEach(function (valor, chave) {
        if (params.get(chave) !== valor) ok = false;
      });
      return ok;
    });
  }

  function loadGoogleGtag(ids) {
    if (!window.dataLayer) {
      window.dataLayer = [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + ids[0];
      document.head.appendChild(s);
    }
    // "config" já manda o page_view; se a página já configurou essa tag,
    // configurar de novo duplicaria o page_view.
    var jaConfigurados = [];
    try {
      (window.dataLayer || []).forEach(function (args) {
        if (args && args[0] === "config") jaConfigurados.push(String(args[1]));
      });
    } catch (e) {}
    ids.forEach(function (id) {
      if (jaConfigurados.indexOf(String(id)) === -1) window.gtag("config", id);
    });
  }

  var leadId = null;
  try { leadId = localStorage.getItem(storageKey); } catch (e) {}
  if (!leadId) leadId = getCookie(storageKey);
  // Em outro domínio (ex: o checkout), o navegador não tem o id salvo, mas
  // o link que trouxe a pessoa carrega ele no sck/ref. Adota esse id em vez
  // de inventar um novo: senão cada ida ao checkout viraria um "lead novo"
  // e inflaria o Leads do Tracking.
  if (!leadId) {
    try {
      var qs = new URLSearchParams(window.location.search);
      var idDaUrl = qs.get("sck") || qs.get("ref");
      if (idDaUrl && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idDaUrl)) {
        leadId = idDaUrl.toLowerCase();
      }
    } catch (e) {}
  }
  var isFirstTouch = !leadId;
  if (!leadId) leadId = uuidv4();

  try { localStorage.setItem(storageKey, leadId); } catch (e) {}
  setCookie(storageKey, leadId, 90);

  window.ProfitXTracking = window.ProfitXTracking || {};
  window.ProfitXTracking[productSlug] = {
    getLeadId: function () { return leadId; },
    // paramName é opcional (default "ref") — algumas plataformas de checkout
    // não aceitam um parâmetro de rastreio arbitrário, só um nome fixo que
    // elas já reconhecem (ex: a Onprofit só devolve "sck"/"src" no webhook,
    // então o link do checkout precisa usar appendRef(url, "sck")).
    // eventName é opcional — passar "checkout" grava "Iniciou checkout" na
    // nossa própria aba Análises via sendBeacon — usa beacon (não fetch
    // normal) porque a página navega embora logo em seguida, e um fetch
    // comum pode ser cancelado antes de sair do navegador. Pra Meta, o
    // InitiateCheckout só sai daqui se estiver ligado como "no clique" em
    // Tracking > Rastreamento.
    appendRef: function (url, paramName, eventName) {
      try {
        if (eventName === "checkout") {
          if (eventosMeta && eventosMeta.initiate_checkout === "clique") dispararMeta("InitiateCheckout");
          try {
            var beaconPayload = JSON.stringify({ lead_id: leadId, product_slug: productSlug, event_type: "initiate_checkout" });
            if (navigator.sendBeacon) {
              navigator.sendBeacon(clientEventUrl, new Blob([beaconPayload], { type: "application/json" }));
            } else {
              fetch(clientEventUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: beaconPayload, keepalive: true }).catch(function () {});
            }
          } catch (e) {}
        }
        var u = new URL(url, window.location.href);
        u.searchParams.set(paramName || "ref", leadId);
        u.searchParams.delete("pxevt");
        return u.toString();
      } catch (e) {
        return url;
      }
    },
  };

  // Modo "sem código" — pra builders tipo Elementor/Wix/Inlead, onde o botão
  // só aceita colar uma URL pura, sem jeito de colar HTML/onclick. Não
  // depende de nada salvo no banco nem de marcar o botão: o próprio Gerador
  // de link (aba UTMs) já entrega a URL com "ref=" ou "sck=" vazio (e
  // "pxevt=checkout" quando for link de checkout) grudado nela. Aqui a
  // gente só olha se a URL que vai navegar tem um desses parâmetros — se
  // tiver, é porque veio do Gerador, então preenche o valor vazio com o
  // lead_id (via appendRef, que também remove o "pxevt" antes de navegar).
  function rewriteTrackedUrl(url) {
    if (typeof url !== "string") return url;
    var u;
    try { u = new URL(url, window.location.href); } catch (err) { return url; }
    var paramName = u.searchParams.has("sck") ? "sck" : u.searchParams.has("ref") ? "ref" : null;
    if (!paramName) return url;
    var isCheckout = u.searchParams.get("pxevt") === "checkout";
    return window.ProfitXTracking[productSlug].appendRef(url, paramName, isCheckout ? "checkout" : undefined);
  }

  // Cobre botão renderizado como <a href> de verdade (Elementor, Wix, HTML
  // direto).
  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!el) return;
      var rewritten = rewriteTrackedUrl(el.href);
      if (rewritten === el.href) return;
      e.preventDefault();
      window.location.href = rewritten;
    },
    true
  );

  // Cobre construtores de quiz/funil (ex: Inlead) que não usam <a href> —
  // o botão dispara a navegação via JS chamando window.open(...) ou
  // location.assign()/replace() com a URL guardada internamente. Como esses
  // são funções globais normais (diferente de "location.href = ...", que o
  // navegador não deixa interceptar), dá pra embrulhar e reescrever a URL
  // antes de navegar de verdade, do mesmo jeito, só que sem depender de um
  // clique num <a>.
  var nativeOpen = window.open;
  window.open = function (url, target, features) {
    return nativeOpen.call(window, rewriteTrackedUrl(url), target, features);
  };
  try {
    var nativeAssign = window.location.assign.bind(window.location);
    window.location.assign = function (url) { return nativeAssign(rewriteTrackedUrl(url)); };
  } catch (e) {}
  try {
    var nativeReplace = window.location.replace.bind(window.location);
    window.location.replace = function (url) { return nativeReplace(rewriteTrackedUrl(url)); };
  } catch (e) {}

  // Cobre o padrão "cria um <a> fora da página só pra clicar nele via
  // código" (document.createElement('a') + a.click()) — muito comum em SPA
  // pra navegação externa. Como o elemento nunca chega a entrar na árvore
  // do documento, o clique nem passa pelo listener de cima (que depende do
  // evento borbulhar até o document). Aqui a gente intercepta direto o
  // método .click() de qualquer <a>, dentro ou fora da página.
  try {
    var nativeAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var rewritten = rewriteTrackedUrl(this.href);
      if (rewritten !== this.href) this.href = rewritten;
      return nativeAnchorClick.call(this);
    };
  } catch (e) {}

  // Cobre redirecionamento via <form method="get" action="...">.submit().
  try {
    var nativeFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      var rewritten = rewriteTrackedUrl(this.action);
      if (rewritten !== this.action) this.action = rewritten;
      return nativeFormSubmit.call(this);
    };
  } catch (e) {}

  // Pixels de Meta/Google (Pixel ID cadastrado na aba "Contas Meta/Google").
  // Quais eventos vão pra Meta pelo navegador é escolhido na tela (Tracking
  // > Ferramentas > Rastreamento) e chega aqui no pixel-config: PageView,
  // Lead (primeira visita) e InitiateCheckout (no clique do link de
  // checkout OU ao abrir a página de checkout — nunca os dois). Purchase e
  // Deposit saem do servidor, pela API de Conversões. Sem config salva, o
  // padrão é só PageView.
  var pixelConfigUrl = new URL("/api/tracking/pixel-config", scriptTag.src).href + "?product=" + encodeURIComponent(productSlug);
  fetch(pixelConfigUrl)
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (cfg.meta && cfg.meta.length) {
        eventosMeta = cfg.eventos || { pageview: true, lead: false, initiate_checkout: "desligado" };
        metaIds = cfg.meta;
        loadMetaPixel(cfg.meta, eventosMeta.pageview !== false);
        if (eventosMeta.lead && isFirstTouch) dispararMeta("Lead");
        if (eventosMeta.initiate_checkout === "pagina" && ehPaginaDeCheckout(cfg.paginas_checkout)) {
          dispararMeta("InitiateCheckout");
        }
      }
      if (cfg.google && cfg.google.length) {
        loadGoogleGtag(cfg.google);
      }
    })
    .catch(function () {});

  // Toda abertura avisa o collect: o lead só é criado na primeira (o
  // servidor ignora repetição), mas cada página precisa registrar a visita
  // — é o que alimenta Performance → Páginas.
  var params = new URLSearchParams(window.location.search);
  var payload = {
    lead_id: leadId,
    product_slug: productSlug,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    fbclid: params.get("fbclid"),
    gclid: params.get("gclid"),
    meta_campaign_id: params.get("mcid"),
    // Parâmetros dinâmicos da Meta (UTMs automáticas): ficam guardados no
    // registro da visita; o ID da campanha também vem em utm_id.
    utm_id: params.get("utm_id"),
    ad_id: params.get("ad_id"),
    adset_id: params.get("adset_id"),
    placement: params.get("placement"),
    site_source_name: params.get("site_source_name"),
    google_campaign_id: params.get("gcid"),
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
    landing_url: window.location.href,
    referrer: document.referrer || null,
  };

  fetch(collectUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(function () {});
})();
`.trim();

export async function GET() {
  return new NextResponse(PIXEL_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // "no-cache" (não "no-store"): ainda cacheia, mas obriga revalidar
      // (ETag) antes de servir do cache — com "public, max-age=300" o CDN
      // ficou servindo versão antiga por bem mais que 5min depois de um
      // deploy novo, atrasando qualquer correção nesse script em produção.
      "Cache-Control": "no-cache",
    },
  });
}
