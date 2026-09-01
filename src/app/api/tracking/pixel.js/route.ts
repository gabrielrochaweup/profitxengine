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
    appendRef: function (url, paramName) {
      try {
        var u = new URL(url, window.location.href);
        u.searchParams.set(paramName || "ref", leadId);
        return u.toString();
      } catch (e) {
        return url;
      }
    },
  };

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
