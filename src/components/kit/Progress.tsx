import type { ReactNode } from 'react';
import { cn } from './cn';

/** Onboarding step bar (app `ProgressSteps`). */
export function ProgressSteps({ total, current, className }: { total: number; current: number; className?: string }) {
  return (
    <div className={cn('flex gap-1.5', className)} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < current ? 'bg-accent' : 'bg-border-strong')} />
      ))}
    </div>
  );
}

/** Circular progress (plan day X of N, weekly goal). `value` 0..1. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  color = 'var(--gm-accent)',
  track = 'var(--gm-surface-sunken)',
  children,
  className,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.2,0.8,0.2,1)' }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div> : null}
    </div>
  );
}

/** Score bar like Migo's [METER:x/10:Label]. Colour follows the score. */
export function Meter({ value, max = 10, label, className }: { value: number; max?: number; label: ReactNode; className?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const color = pct >= 0.7 ? 'bg-success' : pct >= 0.4 ? 'bg-accent' : 'bg-warning';
  return (
    <div className={cn('rounded-gm-lg border border-border bg-surface-raised p-3', className)}>
      <div className="flex items-center gap-2">
        <span className="t-label min-w-0 flex-1 truncate text-ink-muted">{label}</span>
        <span className="t-title text-ink">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          <span className="t-caption text-ink-muted"> / {max}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className={cn('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
    </div>
  );
}
