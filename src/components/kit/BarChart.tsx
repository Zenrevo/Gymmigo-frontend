import { cn } from './cn';

export type Bar = { label: string; value: number; highlight?: boolean; caption?: string };

/** Simple SVG-free bar chart (app `BarChart`): rounded bars, last/highlighted in accent. */
export function BarChart({
  bars,
  height = 140,
  className,
  formatValue,
  ariaLabel = 'Bar chart',
}: {
  bars: Bar[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...bars.map(b => b.value));
  return (
    <figure className={cn('w-full', className)} aria-label={ariaLabel}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {bars.map((b, i) => {
          const h = b.value > 0 ? Math.max(4, (b.value / max) * height) : 3;
          return (
            <div key={`${b.label}-${i}`} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={cn('w-full rounded-t-gm-sm transition-[height] duration-500', b.highlight ? 'bg-accent' : 'bg-border-strong group-hover:bg-ink-subtle')}
                style={{ height: h }}
                title={`${b.label}: ${formatValue ? formatValue(b.value) : b.value}`}
              />
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex gap-1.5">
        {bars.map((b, i) => (
          <span key={`${b.label}-${i}`} className={cn('t-label-sm flex-1 truncate text-center', b.highlight ? 'text-ink' : 'text-ink-subtle')}>
            {b.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
