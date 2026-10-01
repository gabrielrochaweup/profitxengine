"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  Peças de layout de painel de dados — três níveis de superfície:

    nível 0  fundo do app (o mais escuro)
    nível 1  Panel / SideNav: um degrau acima, com borda fina
    nível 2  Inset / StatTile: volta à cor do fundo DENTRO do painel

  O contraste entre os níveis é o que separa um bloco do outro; não é
  preciso desenhar mais caixas nem barrinhas de cor ao lado do título.
*/

export function IconTile({
  icon: Icon,
  active,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "h-8 w-8 rounded-lg", md: "h-9 w-9 rounded-xl", lg: "h-12 w-12 rounded-2xl" }[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        box,
        active ? "bg-accent text-accent-contrast" : "bg-accent-soft text-accent-text",
        className
      )}
    >
      <Icon size={size === "lg" ? 22 : size === "sm" ? 15 : 17} />
    </span>
  );
}

export function Panel({
  title,
  description,
  icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon && <IconTile icon={icon} />}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>}
              {description && (
                <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-text-tertiary">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Nível 2: bloco interno, na cor do fundo do app. */
export function Inset({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-app p-4", className)}>{children}</div>;
}

export type SideNavTone = "neutral" | "success" | "warning";

export type SideNavItem<T extends string> = {
  key: T;
  label: string;
  hint?: string;
  icon: LucideIcon;
  badge?: ReactNode;
  tone?: SideNavTone;
  /** Texto do selo pra leitor de tela (ex: "precisa de atenção"). */
  badgeLabel?: string;
};

/**
 * Nível 1 de navegação. Vertical a partir do xl; abaixo disso vira uma faixa
 * de abas com rolagem horizontal.
 */
export function SideNav<T extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: SideNavItem<T>[];
  active: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="z-10 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-card xl:sticky xl:top-4 xl:flex-col xl:self-start"
    >
      {items.map(({ key, label: itemLabel, hint, icon: Icon, badge, tone = "neutral", badgeLabel }) => {
        const current = active === key;
        const temSelo = badge !== undefined && badge !== null && badge !== "";
        return (
          <button
            key={key}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => onChange(key)}
            className={cn(
              "flex min-w-max flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors xl:min-w-0 xl:flex-none",
              current ? "bg-accent-soft" : "hover:bg-card-hover"
            )}
          >
            <span
              className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                current ? "bg-accent text-accent-contrast" : "bg-input text-text-secondary"
              )}
            >
              <Icon size={15} />
              {/* Abaixo do xl o selo não cabe: vira um ponto no ícone, só
                  quando pede atenção. */}
              {temSelo && tone === "warning" && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning xl:hidden" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-[13px] font-medium",
                  current ? "text-text-primary" : "text-text-secondary"
                )}
              >
                {itemLabel}
              </span>
              {hint && <span className="hidden truncate text-[11px] text-text-muted xl:block">{hint}</span>}
            </span>
            {temSelo && (
              <span
                aria-label={badgeLabel}
                title={badgeLabel}
                className={cn(
                  "hidden shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums xl:inline-flex",
                  tone === "warning"
                    ? "bg-warning-soft text-warning"
                    : tone === "success"
                      ? "bg-ok-soft text-ok"
                      : "bg-input text-text-tertiary"
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function SplitLayout({ nav, children, className }: { nav: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-5 xl:grid-cols-[232px_minmax(0,1fr)]", className)}>
      {nav}
      <div className="min-w-0 space-y-5">{children}</div>
    </div>
  );
}

/** Nível 2 de navegação, períodos e filtros de visão. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
  className,
}: {
  options: readonly { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full overflow-x-auto rounded-xl bg-input p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={value === option.key}
          disabled={disabled}
          onClick={() => onChange(option.key)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            value === option.key
              ? "bg-card text-text-primary shadow-card"
              : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          {option.label}
          {option.count !== undefined && <span className="text-[10px] text-text-muted">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** KPI: rótulo pequeno, valor grande, apoio discreto. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  onClick?: () => void;
  className?: string;
}) {
  const corpo = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary">
        {Icon && <Icon size={13} className="shrink-0" />}
        <span className="truncate">{label}</span>
      </p>
      <p
        className={cn(
          "mt-1.5 text-[22px] font-semibold leading-none tabular-nums",
          tone === "success"
            ? "text-ok"
            : tone === "warning"
              ? "text-warning"
              : tone === "danger"
                ? "text-danger"
                : tone === "accent"
                  ? "text-accent-text"
                  : "text-text-primary"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 truncate text-[11px] text-text-muted">{hint}</p>}
    </>
  );
  const base = "min-w-0 rounded-xl border border-border bg-app p-3.5 text-left";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, "transition-colors hover:border-border-strong hover:bg-card-hover", className)}
      >
        {corpo}
      </button>
    );
  }
  return <div className={cn(base, className)}>{corpo}</div>;
}

/** Estado vazio: ícone, frase curta e (quando houver) o próximo passo. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-8 text-center", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-input text-text-tertiary">
        <Icon size={18} />
      </span>
      <p className="text-[13px] font-medium text-text-secondary">{title}</p>
      {description && <p className="max-w-[46ch] text-[12px] text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
