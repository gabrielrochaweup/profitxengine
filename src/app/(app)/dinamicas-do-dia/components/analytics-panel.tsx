"use client";

import { useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown } from "@/components/ui/icones";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];

interface AnalyticsPanelProps {
  messages: EngagementMessage[];
}

const ACCENT = "#7c5cff";
const SUCCESS = "#34d399";
const DANGER = "#f87171";
const GRID = "#232327";

function formatDay(dateKey: string) {
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

function getWeekKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const week = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
  return `Sem. ${week}`;
}

export function AnalyticsPanel({ messages }: AnalyticsPanelProps) {
  const [temaFilter, setTemaFilter] = useState("todos");
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const temas = useMemo(() => {
    const set = new Set(messages.map((m) => m.tema).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [messages]);

  const filtered = useMemo(
    () => (temaFilter === "todos" ? messages : messages.filter((m) => m.tema === temaFilter)),
    [messages, temaFilter]
  );

  const byDay = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((m) => counts.set(m.scheduled_date, (counts.get(m.scheduled_date) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30);
  }, [filtered]);

  const byWeek = useMemo(() => {
    const map = new Map<string, { funcionou: number; naoFuncionou: number }>();
    filtered.forEach((m) => {
      if (!m.result) return;
      const key = getWeekKey(m.scheduled_date);
      const entry = map.get(key) ?? { funcionou: 0, naoFuncionou: 0 };
      if (m.result === "funcionou") entry.funcionou += 1;
      else entry.naoFuncionou += 1;
      map.set(key, entry);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const topMessages = useMemo(
    () =>
      filtered
        .filter((m) => m.result === "funcionou" && m.generated_text)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5),
    [filtered]
  );

  const maxDayCount = Math.max(1, ...byDay.map(([, count]) => count));
  const maxWeekCount = Math.max(1, ...byWeek.map(([, v]) => v.funcionou + v.naoFuncionou));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Analytics</h3>
        <Select value={temaFilter} onChange={(e) => setTemaFilter(e.target.value)} className="w-48">
          <option value="todos">Todos os temas</option>
          {temas.map((tema) => (
            <option key={tema} value={tema}>
              {tema}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-5">
        <p className="text-xs font-medium text-text-secondary">Mensagens geradas por dia</p>
        {byDay.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-text-muted">Sem dados ainda.</p>
        ) : (
          <div className="relative mt-4">
            <svg viewBox={`0 0 ${byDay.length * 28} 140`} className="w-full" style={{ height: 140 }}>
              <line x1={0} y1={120} x2={byDay.length * 28} y2={120} stroke={GRID} strokeWidth={1} />
              {byDay.map(([day, count], index) => {
                const height = (count / maxDayCount) * 100;
                const x = index * 28 + 6;
                return (
                  <g
                    key={day}
                    onMouseEnter={() => setHoveredBar(`${day}:${count}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <rect
                      x={x}
                      y={120 - height}
                      width={16}
                      height={height}
                      rx={4}
                      fill={ACCENT}
                      opacity={hoveredBar?.startsWith(day) ? 1 : 0.85}
                    />
                    <text x={x + 8} y={134} fontSize={9} textAnchor="middle" fill="#6b6b70">
                      {formatDay(day)}
                    </text>
                  </g>
                );
              })}
            </svg>
            {hoveredBar && (
              <div className="pointer-events-none absolute left-2 top-0 rounded-lg bg-card px-2 py-1 text-xs text-text-primary shadow-popover">
                {hoveredBar.split(":")[1]} mensagem(ns) — {formatDay(hoveredBar.split(":")[0])}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-secondary">Funcionou vs. não funcionou por semana</p>
          <div className="flex items-center gap-3 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} style={{ color: SUCCESS }} /> Funcionou
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown size={11} style={{ color: DANGER }} /> Não funcionou
            </span>
          </div>
        </div>

        {byWeek.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-text-muted">
            Nenhum resultado registrado ainda. Marque &quot;funcionou&quot;/&quot;não funcionou&quot; nas mensagens.
          </p>
        ) : (
          <svg viewBox={`0 0 ${byWeek.length * 60} 140`} className="mt-4 w-full" style={{ height: 140 }}>
            <line x1={0} y1={120} x2={byWeek.length * 60} y2={120} stroke={GRID} strokeWidth={1} />
            {byWeek.map(([week, v], index) => {
              const total = v.funcionou + v.naoFuncionou;
              const heightGood = (v.funcionou / maxWeekCount) * 100;
              const heightBad = (v.naoFuncionou / maxWeekCount) * 100;
              const x = index * 60 + 10;
              return (
                <g key={week}>
                  <rect x={x} y={120 - heightGood} width={18} height={heightGood} rx={3} fill={SUCCESS} />
                  <rect x={x + 22} y={120 - heightBad} width={18} height={heightBad} rx={3} fill={DANGER} />
                  <text x={x + 20} y={134} fontSize={9} textAnchor="middle" fill="#6b6b70">
                    {week}
                  </text>
                  <title>
                    {week}: {total} resultado(s) — {v.funcionou} funcionou, {v.naoFuncionou} não funcionou
                  </title>
                </g>
              );
            })}
          </svg>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-xs font-medium text-text-secondary">Mensagens mais bem avaliadas</p>
        {topMessages.length === 0 ? (
          <p className="mt-4 py-4 text-center text-sm text-text-muted">
            Nenhuma mensagem marcada como &quot;funcionou&quot; ainda.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {topMessages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{formatDay(m.scheduled_date)}</span>
                  {m.tema && (
                    <span className="rounded-button bg-card-hover px-2 py-0.5 text-[11px] text-text-muted">
                      {m.tema}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-text-primary">{m.generated_text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
