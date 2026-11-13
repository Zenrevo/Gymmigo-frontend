import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from './cn';
import { textToneClass, type TextTone } from './textStyles';

type Props = {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  caption?: ReactNode;
  captionTone?: TextTone;
  emphasis?: boolean;
  size?: 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
};

/** App `StatTile`: label, big Epilogue number (+unit), caption. */
export function StatTile({ label, value, unit, caption, captionTone = 'subtle', emphasis, size = 'md', icon: Icon, className }: Props) {
  return (
    <Card padding="md" className={cn('min-w-0 flex-1', className)}>
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-gm-sm bg-accent-soft text-accent-text">
            <Icon size={15} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <span className="t-label-sm text-ink-subtle">{label}</span>
      </div>
      <div className="mt-2 flex min-w-0 items-baseline gap-1">
        <span
          className={cn('min-w-0 truncate font-display font-extrabold tabular-nums', emphasis ? 'text-accent' : 'text-ink')}
          style={{ fontSize: size === 'lg' ? 52 : 32, lineHeight: 1.08, letterSpacing: size === 'lg' ? -1.6 : -0.8 }}>
          {value}
        </span>
        {unit ? <span className="t-footnote shrink-0 text-ink-muted">{unit}</span> : null}
      </div>
      {caption ? <p className={cn('t-caption mt-1', textToneClass[captionTone])}>{caption}</p> : null}
    </Card>
  );
}
