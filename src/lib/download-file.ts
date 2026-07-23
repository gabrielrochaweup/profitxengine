function isIOS() {
  if (typeof navigator === "undefined") return false;
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) return true;
  // iPadOS Safari se identifica como "Macintosh" desde o iOS 13 (modo
  // "site de desktop" por padrão), então também checamos touch. Mas
  // maxTouchPoints > 0 sozinho dá falso positivo em alguns Mac com
  // trackpad — por isso exige também um ponteiro "grosso" (touch), já
  // que um Mac de verdade com mouse/trackpad reporta pointer:fine.
  if (navigator.platform !== "MacIntel" || navigator.maxTouchPoints <= 1) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return !window.matchMedia("(pointer: fine)").matches;
}

/**
 * Baixa uma URL de imagem (tipicamente do Supabase Storage, origem diferente
 * da do app) como arquivo local. Um `<a href download>` cru não funciona de
 * forma confiável entre origens — a maioria dos navegadores ignora o atributo
 * `download` sem um header `Content-Disposition: attachment` e simplesmente
 * navega/abre a imagem numa aba nova. Buscamos o conteúdo e convertemos pra
 * blob: URL (que é same-origin e sempre respeita `download`) antes de
 * disparar o clique.
 */
export async function downloadImageUrl(url: string, filename: string): Promise<void> {
  // No iOS Safari, window.open() só funciona de forma confiável quando
  // chamado de forma síncrona dentro do gesto de clique — por isso abrimos a
  // aba em branco JÁ, antes de qualquer await, e só navegamos ela pra imagem
  // depois que o download termina.
  const iosTab = isIOS() ? window.open("", "_blank") : null;

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (iosTab) {
      // iOS não expõe "salvar arquivo" via JS — abrir a imagem numa aba
      // deixa o usuário segurar o dedo nela e usar "Adicionar à Galeria", o
      // fluxo nativo do iOS pra salvar imagens da web.
      iosTab.location.href = blobUrl;
    } else {
      const link = document.createElement("a");
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch {
    iosTab?.close();
  }
}
