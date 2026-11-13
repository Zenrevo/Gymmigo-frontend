import type { ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from './cn';

/** Role picker card (app `SelectableCard`): icon tile, title, description, selected check. */
export function SelectableCard({
  icon: Icon,
  title,
  description,
  badge,
  selected,
  disabled,
  onSelect,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  badge?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-4 rounded-gm-xl border p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99]',
        selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface shadow-card hover:border-border-strong',
        disabled && 'cursor-not-allowed opacity-55 active:scale-100',
      )}>
      {Icon ? (
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-gm-md', selected ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink')}>
          <Icon size={22} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="t-title text-ink">{title}</span>
          {badge ? <Badge label={badge} tone="accent" /> : null}
        </span>
        {description ? <span className="t-callout mt-1 block text-ink-muted">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn('mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-accent bg-accent text-on-accent' : 'border-border-strong')}>
        {selected ? <Check size={14} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
