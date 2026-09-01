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

  function loadMetaPixel(ids) {
    if (window.fbq) {
      ids.forEach(function (id) { window.fbq("init", id); });
      return;
    }
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    ids.forEach(function (id) { window.fbq("init", id); });
    window.fbq("track", "PageView");
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
    ids.forEach(function (id) { window.gtag("config", id); });
  }

  var leadId = null;
  try { leadId = localStorage.getItem(storageKey); } catch (e) {}
  if (!leadId) leadId = getCookie(storageKey);
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
    // eventName é opcional — passar "checkout" dispara InitiateCheckout
    // (Meta) / begin_checkout (Google) antes de montar o link, se os pixels
    // já tiverem carregado (função best-effort, não bloqueia o clique se
    // ainda não carregaram), e também grava "Iniciou checkout" na nossa
    // própria aba Análises via sendBeacon — usa beacon (não fetch normal)
    // porque a página navega embora logo em seguida, e um fetch comum
    // pode ser cancelado antes de sair do navegador.
    appendRef: function (url, paramName, eventName) {
      try {
        if (eventName === "checkout") {
          if (window.fbq) window.fbq("track", "InitiateCheckout");
          if (window.gtag) window.gtag("event", "begin_checkout");
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
        return u.toString();
      } catch (e) {
        return url;
      }
    },
  };

  // Modo "sem código" — pra builders tipo Elementor/Wix, onde o botão só
  // aceita colar uma URL pura, sem jeito de colar HTML/onclick/classe. O
  // Gerador de link (aba UTMs) registra o link colado como "regra" no
  // banco; aqui a gente busca essa lista (junto com o pixel-config) e
  // reconhece sozinho qualquer clique num link cujo destino bata com uma
  // regra salva — sem precisar marcar o botão de jeito nenhum. Casa
  // ignorando a query string (origin+pathname) pra sobreviver a variações
  // de parâmetro da própria oferta.
  // "profitx-checkout"/"profitx-ref" como classe CSS continuam funcionando
  // como atalho manual, pra quem preferir marcar o botão explicitamente.
  var SCK_HOSTS = ["onprofit.com.br", "hotmart.com"];
  function guessParamName(url) {
    try {
      var host = new URL(url, window.location.href).hostname;
      for (var i = 0; i < SCK_HOSTS.length; i++) {
        if (host === SCK_HOSTS[i] || host.slice(-(SCK_HOSTS[i].length + 1)) === "." + SCK_HOSTS[i]) return "sck";
      }
      return "ref";
    } catch (e) {
      return "ref";
    }
  }
  function matchKey(url) {
    try {
      var u = new URL(url, window.location.href);
      return u.origin + u.pathname;
    } catch (e) {
      return null;
    }
  }
  var linkRules = [];
  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!el) return;
      var cssCheckout = el.classList.contains("profitx-checkout");
      var cssRef = el.classList.contains("profitx-ref");
      var rule = null;
      if (!cssCheckout && !cssRef) {
        var key = matchKey(el.href);
        if (key) {
          for (var i = 0; i < linkRules.length; i++) {
            if (linkRules[i].match_url === key) { rule = linkRules[i]; break; }
          }
        }
      }
      if (!rule && !cssCheckout && !cssRef) return;
      e.preventDefault();
      var paramName = cssCheckout || cssRef ? el.getAttribute("data-profitx-param") || guessParamName(el.href) : rule.param_name;
      var isCheckout = cssCheckout || (rule && rule.fire_checkout);
      window.location.href = window.ProfitXTracking[productSlug].appendRef(el.href, paramName, isCheckout ? "checkout" : undefined);
    },
    true
  );

  // Pixels de Meta/Google (Pixel ID cadastrado na aba "Contas Meta/Google")
  // — carrega o pixel de verdade e dispara PageView (sempre) + Lead (só no
  // primeiro toque). Purchase não dá pra disparar por aqui (a compra
  // acontece na página do checkout, fora desse domínio) — isso é feito do
  // lado do servidor, na API de Conversões, quando o webhook de compra chega.
  var pixelConfigUrl = new URL("/api/tracking/pixel-config", scriptTag.src).href + "?product=" + encodeURIComponent(productSlug);
  fetch(pixelConfigUrl)
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (cfg.meta && cfg.meta.length) {
        loadMetaPixel(cfg.meta);
        if (isFirstTouch && window.fbq) window.fbq("track", "Lead");
      }
      if (cfg.google && cfg.google.length) {
        loadGoogleGtag(cfg.google);
        if (isFirstTouch && window.gtag) window.gtag("event", "generate_lead");
      }
      if (cfg.link_rules) linkRules = cfg.link_rules;
    })
    .catch(function () {});

  if (!isFirstTouch) return;

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
      "Cache-Control": "public, max-age=300",
    },
  });
}
