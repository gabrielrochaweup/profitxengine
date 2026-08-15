"use client";

import { Modal } from "@/components/ui/modal";
import type { Database } from "@/lib/supabase/types";

type DynamicSnapshot = Database["public"]["Tables"]["dynamic_snapshots"]["Row"];

interface DynamicSnapshotDetailModalProps {
  snapshot: DynamicSnapshot | null;
  onClose: () => void;
}

// Visualização 100% de leitura do estado salvo — mesmas seções do editor
// real (Metadados/Bancos/Variáveis/Mensagens), sem nenhum campo editável,
// já que é um registro histórico (dynamic_snapshots nunca é atualizado
// depois de criado).
export function DynamicSnapshotDetailModal({ snapshot, onClose }: DynamicSnapshotDetailModalProps) {
  return (
    <Modal
      open={snapshot !== null}
      onClose={onClose}
      title={snapshot ? `${snapshot.dynamic_icon ?? "✨"} ${snapshot.dynamic_name}` : ""}
      className="max-w-3xl"
    >
      {snapshot && (
        <div className="space-y-5">
          <p className="text-xs text-text-muted">
            {snapshot.label} · salvo em {new Date(snapshot.created_at).toLocaleString("pt-BR")}
          </p>

          {snapshot.rules.length > 0 && (
            <Section title="Regras universais">
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {snapshot.rules.map((rule, i) => (
                  <li key={i}>• {rule}</li>
                ))}
              </ul>
            </Section>
          )}

          {Object.keys(snapshot.rotating_banks ?? {}).length > 0 && (
            <Section title="Bancos rotativos de texto">
              <div className="space-y-3">
                {Object.entries(snapshot.rotating_banks).map(([name, items]) => (
                  <div key={name} className="rounded-xl border border-border p-3">
                    <p className="mb-1.5 text-xs font-medium text-text-primary">{name}</p>
                    <ul className="space-y-1 text-xs text-text-muted">
                      {(items as string[]).map((item, i) => (
                        <li key={i} className="whitespace-pre-wrap">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {Object.keys(snapshot.extra_vars ?? {}).length > 0 && (
            <Section title="Variáveis extras">
              <div className="space-y-1.5 text-xs">
                {Object.entries(snapshot.extra_vars).map(([key, value]) => (
                  <p key={key} className="text-text-secondary">
                    <span className="font-medium text-text-primary">{key}:</span>{" "}
                    <span className="whitespace-pre-wrap text-text-muted">{String(value)}</span>
                  </p>
                ))}
              </div>
            </Section>
          )}

          <Section title={`Mensagens (${snapshot.slots.length})`}>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {snapshot.slots
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((slot) => (
                  <div key={slot.msgKey} className="rounded-xl border border-border p-3">
                    <p className="mb-1.5 text-xs font-medium text-text-primary">
                      {slot.timeLabel ?? slot.msgKey}
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-text-muted">{slot.template}</pre>
                  </div>
                ))}
            </div>
          </Section>
        </div>
      )}
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-primary">{title}</h3>
      {children}
    </div>
  );
}
