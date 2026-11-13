import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from './cn';

/** Section title row with an optional meta action ("See all"). */
export function SectionHeader({
  label,
  meta,
  onMeta,
  className,
  as = 'h2',
}: {
  label: ReactNode;
  meta?: ReactNode;
  onMeta?: () => void;
  className?: string;
  as?: 'h2' | 'h3';
}) {
  const Tag = as;
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Tag className="t-h2 text-ink">{label}</Tag>
      {meta ? (
        onMeta ? (
          <button type="button" onClick={onMeta} className="t-callout font-semibold text-accent-text hover:underline">
            {meta}
          </button>
        ) : (
          <span className="t-label text-ink-subtle">{meta}</span>
        )
      ) : null}
    </div>
  );
}

/** App `AppBar`: back button, centred caption (or title), right slot. */
export function AppBar({
  caption,
  title,
  onBack,
  backTo,
  right,
  className,
}: {
  caption?: ReactNode;
  title?: ReactNode;
  onBack?: () => void;
  backTo?: string;
  right?: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const showBack = !!(onBack || backTo);
  return (
    <div className={cn('relative flex h-14 items-center gap-3', className)}>
      {showBack ? (
        <button
          type="button"
          aria-label="Back"
          onClick={() => (onBack ? onBack() : navigate(backTo!))}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-gm-md border border-border bg-surface text-ink transition-colors hover:bg-surface-sunken">
          <ArrowLeft size={18} aria-hidden />
        </button>
      ) : null}
      {title ? <h1 className="t-h2 min-w-0 flex-1 truncate text-ink">{title}</h1> : <div className="flex-1" />}
      {caption ? <span className="t-label pointer-events-none absolute left-1/2 -translate-x-1/2 text-ink-subtle">{caption}</span> : null}
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

/** Page title block: eyebrow, title, subtitle, actions on the right (desktop) / below (mobile). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="t-label mb-1 text-accent-text">{eyebrow}</p> : null}
        <h1 className="t-display text-ink">{title}</h1>
        {subtitle ? <p className="t-body mt-1 text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-border', className)} />;
}
