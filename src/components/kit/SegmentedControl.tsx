import { useRef, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

type Option<T extends string> = { value: T; label: string; icon?: LucideIcon };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'md' | 'sm';
  'aria-label'?: string;
};

/** App `SegmentedControl`: pill track, sliding selection thumb, arrow-key navigation. */
export function SegmentedControl<T extends string>({ options, value, onChange, className, size = 'md', ...aria }: Props<T>) {
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  const h = size === 'sm' ? 'h-8' : 'h-10';
  return (
    <div role="tablist" aria-label={aria['aria-label']} onKeyDown={onKey} className={cn('relative flex rounded-full border border-border bg-surface p-1', className)}>
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-full bg-selection transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left: 4, width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o, i) => {
        const selected = i === index;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={el => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              't-callout relative z-10 flex flex-1 items-center justify-center gap-1.5 truncate rounded-full px-2 transition-colors duration-200',
              h,
              selected ? 'font-bold text-on-selection' : 'text-ink-muted hover:text-ink',
            )}>
            {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
