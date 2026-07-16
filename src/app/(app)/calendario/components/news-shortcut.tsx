"use client";

import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  description: string | null;
}

interface NewsShortcutProps {
  onUseNews: (item: NewsItem) => void;
}

export function NewsShortcut({ onUseNews }: NewsShortcutProps) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news/crypto");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao buscar notícias.");
      setItems(body.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar notícias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <Newspaper size={14} />
          Notícias cripto do momento
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-text-primary disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {loading && !items ? (
        <p className="mt-2 text-xs text-text-muted">Carregando notícias...</p>
      ) : (
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
          {(items ?? []).slice(0, 10).map((item, index) => (
            <div key={index} className="rounded-lg border border-border p-2">
              <p className="line-clamp-2 text-xs text-text-primary">{item.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-text-muted">{item.source}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => onUseNews(item)} className="h-6 px-2 text-[11px]">
                  Usar como gancho
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
