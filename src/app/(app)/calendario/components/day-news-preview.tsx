"use client";

import { useEffect, useState } from "react";
import { Newspaper, Flame, TrendingUp, TrendingDown } from "@/components/ui/icones";
import { LoadingState } from "@/components/ui/loading-state";
import { toDateKey } from "../lib/date-utils";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  highPotential: boolean;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number | null;
  priceChangePercentage24h: number | null;
  isMemecoinRelated: boolean;
}

interface DayNewsPreviewProps {
  dateKey: string;
}

export function DayNewsPreview({ dateKey }: DayNewsPreviewProps) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [trending, setTrending] = useState<TrendingCoin[] | null>(null);
  const [label, setLabel] = useState<string>("");
  const isTodayOrFuture = dateKey >= toDateKey(new Date());

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setTrending(null);
    fetch(`/api/news?before=${dateKey}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        setItems(body.items ?? []);
        setTrending(body.trending ?? []);
        setLabel(body.label ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return (
    <div className="space-y-3">
      {isTodayOrFuture && trending !== null && trending.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <TrendingUp size={13} />
            Em alta agora (CoinGecko)
          </p>
          {!trending ? (
            <LoadingState size="sm" />
          ) : trending.length === 0 ? (
            <p className="text-xs text-text-muted">Sem dados de trending no momento.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {trending.slice(0, 8).map((coin) => (
                <span
                  key={coin.id}
                  className={`inline-flex items-center gap-1 rounded-button px-2 py-1 text-[11px] ${
                    coin.isMemecoinRelated
                      ? "bg-accent-soft text-text-secondary shadow-[0_0_0_1px_var(--accent)]"
                      : "bg-card-hover text-text-secondary shadow-card-sm"
                  }`}
                  title={coin.name}
                >
                  {coin.isMemecoinRelated && <Flame size={10} className="shrink-0 text-accent-text" />}
                  {coin.symbol.toUpperCase()}
                  {coin.priceChangePercentage24h !== null && (
                    <span
                      className={`flex items-center gap-0.5 ${
                        coin.priceChangePercentage24h >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {coin.priceChangePercentage24h >= 0 ? (
                        <TrendingUp size={10} />
                      ) : (
                        <TrendingDown size={10} />
                      )}
                      {Math.abs(coin.priceChangePercentage24h).toFixed(0)}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <Newspaper size={13} />
          Notícias{label ? ` — ${label}` : ""} até esse dia
        </p>
        {!items ? (
          <LoadingState size="sm" />
        ) : items.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhuma notícia disponível até essa data.</p>
        ) : (
          <div className="space-y-1.5">
            {items.slice(0, 5).map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className={`block rounded-lg p-2 text-xs shadow-card-sm transition-shadow hover:shadow-[0_0_0_1px_var(--accent)] hover:text-text-primary ${
                  item.highPotential ? "bg-accent-soft text-text-secondary" : "bg-card-hover text-text-secondary"
                }`}
              >
                <span className="flex items-center gap-1 line-clamp-1">
                  {item.highPotential && <Flame size={11} className="shrink-0 text-accent-text" />}
                  {item.title}
                </span>
                <span className="text-[10px] text-text-muted">{item.source}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
