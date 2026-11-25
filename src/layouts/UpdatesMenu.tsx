import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../components/kit';
import { inbox, timeAgo, webRouteFor, type InboxItem } from '../api/notifications';
import { useUpdates } from './useUpdates';

const TONE = {
  accent: 'bg-accent-soft text-accent-text',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
};

/**
 * Bell in the top bar. For everyone: the notification inbox (payments, bookings, reminders, gym alerts), polled
 * every minute. For members also: things to act on now (invites, live rooms, today's plan, drafts).
 */
export function UpdatesMenu({ enabled, role }: { enabled: boolean; role?: string | null }) {
  const { items, unseen: unseenTodo, markSeen } = useUpdates(enabled);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const feed = useQuery({ queryKey: ['notifications', 'menu'], queryFn: () => inbox.list({ limit: 15 }), refetchInterval: 60_000, retry: false });
  const notes = feed.data?.items ?? [];
  const unread = feed.data?.unread ?? 0;
  const unseen = unseenTodo + unread;
  const openNote = (n: InboxItem) => {
    setOpen(false);
    if (!n.read) inbox.read([n.id]).then(() => qc.invalidateQueries({ queryKey: ['notifications'] })).catch(() => undefined);
    const to = webRouteFor(n, role);
    if (!to) return navigate('/app/notifications');
    if (to.startsWith('http')) window.open(to, '_blank', 'noopener');
    else navigate(to);
  };
  const readAll = () => inbox.readAll().then(() => qc.invalidateQueries({ queryKey: ['notifications'] })).catch(() => undefined);

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
            <p className="t-subtitle text-ink">Notifications</p>
            {unread ? <button type="button" onClick={readAll} className="t-caption font-semibold text-accent-text hover:underline">Mark all read</button> : null}
          </div>
          {notes.length ? (
            <ul className="max-h-[45vh] overflow-y-auto border-b border-border py-1.5">
              {notes.map(n => (
                <li key={n.id}>
                  <button type="button" onClick={() => openNote(n)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-sunken">
                    <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-cta')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn('t-callout block text-ink', !n.read && 'font-semibold')}>{n.title}</span>
                      {n.body ? <span className="t-footnote mt-0.5 block text-ink-muted">{n.body}</span> : null}
                      <span className="t-caption mt-0.5 block text-ink-subtle">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <Link to="/app/notifications" onClick={() => setOpen(false)} className="t-footnote block px-4 py-2 font-semibold text-accent-text hover:underline">
                  See all and notification settings
                </Link>
              </li>
            </ul>
          ) : null}
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
          ) : notes.length ? null : (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 size={20} aria-hidden />
              </span>
              <p className="t-subtitle text-ink">You're all caught up</p>
              <p className="t-footnote text-ink-muted">Payments, bookings, reminders and gym news show up here.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
