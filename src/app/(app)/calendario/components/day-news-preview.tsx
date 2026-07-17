"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

export function DayNewsPreview() {
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news/crypto")
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setItems(body.items ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        <Newspaper size={13} />
        Notícias cripto do momento
      </p>
      {!items ? (
        <p className="text-xs text-text-muted">Carregando...</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border p-2 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
            >
              <span className="line-clamp-1">{item.title}</span>
              <span className="text-[10px] text-text-muted">{item.source}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
