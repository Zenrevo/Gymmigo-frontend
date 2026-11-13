import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from './cn';

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Custom leading element (e.g. Avatar) instead of an icon tile. */
  leading?: ReactNode;
  value?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  to?: string;
  href?: string;
  destructive?: boolean;
  chevron?: boolean;
  className?: string;
};

/** Settings-style row: icon tile, title + subtitle, value/right slot, chevron when pressable. */
export function ListItem({ title, subtitle, icon: Icon, leading, value, right, onClick, to, href, destructive, chevron, className }: Props) {
  const pressable = !!(onClick || to || href);
  const showChevron = chevron ?? (pressable && !right);
  const body = (
    <>
      {leading ??
        (Icon ? (
          <span
            className={cn(
              'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-gm-md',
              destructive ? 'bg-danger-soft text-danger' : 'bg-surface-sunken text-ink',
            )}>
            <Icon size={18} strokeWidth={2} aria-hidden />
          </span>
        ) : null)}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className={cn('t-body-strong truncate', destructive ? 'text-danger' : 'text-ink')}>{title}</span>
        {subtitle ? <span className="t-footnote line-clamp-2 text-ink-muted">{subtitle}</span> : null}
      </span>
      {value != null ? <span className="t-callout shrink-0 text-ink-muted">{value}</span> : null}
      {right}
      {showChevron ? <ChevronRight size={18} className="shrink-0 text-ink-subtle" aria-hidden /> : null}
    </>
  );
  const rowClass = cn(
    'flex w-full items-center gap-3 py-3',
    pressable && 'cursor-pointer text-left transition-opacity duration-150 hover:opacity-80 active:opacity-70',
    className,
  );
  if (to) return <Link to={to} className={rowClass}>{body}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>{body}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={rowClass}>{body}</button>;
  return <div className={rowClass}>{body}</div>;
}

/** A Card of ListItems separated by hairlines (the app's Settings groups). */
export function ListGroup({ children, className, label }: { children: ReactNode; className?: string; label?: ReactNode }) {
  const items = Children.toArray(children).filter(c => isValidElement(c));
  return (
    <section className={className}>
      {label ? <h3 className="t-label mb-2 px-1 text-ink-subtle">{label}</h3> : null}
      <div className="rounded-gm-xl border border-border bg-surface px-4 py-1 shadow-card">
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <div className="h-px bg-border" /> : null}
            {child}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
