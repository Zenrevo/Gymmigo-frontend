import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../components/kit';
import { useUpdates } from './useUpdates';

const TONE = {
  accent: 'bg-accent-soft text-accent-text',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
};

/** Bell in the top bar: things to act on now (invites, live rooms, today's plan, drafts). The dot shows only for new items. */
export function UpdatesMenu({ enabled }: { enabled: boolean }) {
  const { items, unseen, markSeen } = useUpdates(enabled);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    markSeen();
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, markSeen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unseen ? `Updates, ${unseen} new` : 'Updates'}
        title="Updates"
        onClick={() => setOpen(o => !o)}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-sunken aria-expanded:bg-surface-sunken">
        <Bell size={18} aria-hidden />
        {unseen ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
            {unseen > 9 ? '9+' : unseen}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Updates"
          className="absolute right-0 z-[60] mt-2 w-[min(360px,calc(100vw-32px))] origin-top-right animate-pop-in overflow-hidden rounded-gm-xl border border-border bg-surface shadow-float">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="t-subtitle text-ink">Updates</p>
            {items.length ? <p className="t-caption text-ink-subtle">{items.length} to look at</p> : null}
          </div>
          {items.length ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1.5">
              {items.map(u => (
                <li key={u.key}>
                  <Link to={u.to} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken">
                    <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', TONE[u.tone])}>
                      <u.icon size={17} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="t-callout block font-semibold text-ink">{u.title}</span>
                      <span className="t-footnote mt-0.5 block text-ink-muted">{u.body}</span>
                    </span>
                    <ChevronRight size={16} className="mt-2.5 shrink-0 text-ink-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 size={20} aria-hidden />
              </span>
              <p className="t-subtitle text-ink">You're all caught up</p>
              <p className="t-footnote text-ink-muted">Run invites, today's plan and plans to approve show up here.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
