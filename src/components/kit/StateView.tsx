import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from './cn';

type Props = {
  icon?: LucideIcon;
  title: ReactNode;
  message?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
};

/** App `EmptyState`: soft icon tile, title, message, one action. */
export function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, onAction, actionTo, secondary, className, compact }: Props) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-gm-xl bg-accent-soft text-accent-text">
        <Icon size={24} aria-hidden />
      </span>
      <h3 className="t-title mt-1 text-ink">{title}</h3>
      {message ? <p className="t-callout max-w-sm text-ink-muted">{message}</p> : null}
      {actionLabel ? <Button label={actionLabel} size="md" onClick={onAction} to={actionTo} className="mt-2" /> : null}
      {secondary}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
  className,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 text-center', className)} role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-gm-xl bg-danger-soft text-danger">
        <AlertTriangle size={24} aria-hidden />
      </span>
      <h3 className="t-title mt-1 text-ink">{title}</h3>
      {message ? <p className="t-callout max-w-sm text-ink-muted">{message}</p> : null}
      {onRetry ? <Button label="Try again" size="md" variant="secondary" onClick={onRetry} className="mt-2" /> : null}
    </div>
  );
}
