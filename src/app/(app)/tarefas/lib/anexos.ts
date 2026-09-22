"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "task-attachments";
/** Uma hora: tempo de sobra pra abrir, olhar e baixar; curto pra vazar. */
const VALIDADE_SEGUNDOS = 60 * 60;

interface AnexoAssinavel {
  id: string;
  file_path: string | null;
  file_url: string;
}

/**
 * A URL de cada anexo, assinada na hora.
 *
 * O bucket é privado (ver migration 0111): o arquivo não abre por URL fixa,
 * só por uma assinada que vale uma hora. Assinar é uma chamada só pro lote
 * inteiro — um pedido por miniatura transformaria abrir um cartão com dez
 * anexos em dez idas ao servidor.
 *
 * A reserva é a `file_url` antiga: linha gravada antes da migration não tem
 * caminho, e enquanto o bucket ainda estiver público aquela URL funciona.
 * É isso que permite subir este código antes de rodar o SQL, sem deixar
 * anexo quebrado no meio.
 */
export function useUrlsDeAnexo(anexos: AnexoAssinavel[]) {
  const [assinadas, setAssinadas] = useState<Record<string, string>>({});

  // Assinar de novo só quando o CONJUNTO muda. Sem essa chave estável, o
  // array novo de cada render disparava o efeito em loop.
  const chave = useMemo(() => anexos.map((a) => a.id).join("|"), [anexos]);

  useEffect(() => {
    const comCaminho = anexos.filter((a) => !!a.file_path);
    if (comCaminho.length === 0) return;

    let vivo = true;
    createClient()
      .storage.from(BUCKET)
      .createSignedUrls(
        comCaminho.map((a) => a.file_path as string),
        VALIDADE_SEGUNDOS
      )
      .then(({ data }) => {
        if (!vivo || !data) return;
        const mapa: Record<string, string> = {};
        data.forEach((assinada, i) => {
          const anexo = comCaminho[i];
          if (anexo && assinada.signedUrl) mapa[anexo.id] = assinada.signedUrl;
        });
        setAssinadas(mapa);
      });

    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return (anexo: AnexoAssinavel) => assinadas[anexo.id] ?? anexo.file_url;
}
