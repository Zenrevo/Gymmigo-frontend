import type { ReactNode } from 'react';
import { cn } from './cn';

import { toneClass, type Tone } from './tone';

export type { Tone };

/** App `Badge`: 22px, 4px radius, uppercase label. */
export function Badge({ label, tone = 'neutral', dot, className }: { label: ReactNode; tone?: Tone; dot?: boolean; className?: string }) {
  return (
    <span className={cn('t-label-sm inline-flex h-[22px] shrink-0 items-center gap-1 self-start rounded-gm-xs border px-2', toneClass[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {label}
    </span>
  );
}

/** "Quads · Barbell" style meta line. */
export function Tag({ parts, className }: { parts: (ReactNode | null | undefined | false)[]; className?: string }) {
  const shown = parts.filter(Boolean);
  if (!shown.length) return null;
  return (
    <span className={cn('t-caption inline-flex flex-wrap items-center gap-1 text-ink-subtle', className)}>
      {shown.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 ? <span aria-hidden>·</span> : null}
          {p}
        </span>
      ))}
    </span>
  );
}

/** Selectable pill (filters, duration choices). */
export function Chip({
  label,
  selected,
  onClick,
  icon,
  disabled,
  className,
}: {
  label: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        't-callout inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 transition-colors duration-150 disabled:opacity-40',
        selected ? 'border-selection bg-selection text-on-selection font-semibold' : 'border-border bg-surface text-ink-muted hover:border-border-strong',
        className,
      )}>
      {icon}
      {label}
    </button>
  );
}
