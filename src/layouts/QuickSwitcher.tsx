import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, MapPin, PencilLine, Plus, Search, Sparkles, UserPlus, Watch, type LucideIcon } from 'lucide-react';
import { cn, useFocusTrap } from '../components/kit';
import type { NavItem } from './navConfig';

type Entry = { key: string; label: string; hint?: string; icon: LucideIcon; run: () => void; keywords?: string };

export const OPEN_LOCATION_EVENT = 'gm:open-location';
export const OPEN_SWITCHER_EVENT = 'gm:open-switcher';

/** ⌘K / Ctrl+K: jump to any page or action, or ask Migo when nothing matches. */
export function QuickSwitcher({ nav, isMember, onSocial }: { nav: NavItem[]; isMember: boolean; onSocial: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SWITCHER_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SWITCHER_EVENT, onOpen);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setQ('');
    setActive(0);
  };

  const entries = useMemo<Entry[]>(() => {
    const go = (to: string) => () => navigate(to);
    const pages: Entry[] = nav.map(n => ({
      key: `page-${n.key}`,
      label: n.label,
      hint: 'Page',
      icon: n.icon,
      run: n.social ? onSocial : go(n.to),
    }));
    const actions: Entry[] = [
      { key: 'act-ask', label: 'Ask Migo', hint: 'Coach', icon: Sparkles, run: go('/app/assistant'), keywords: 'ai coach chat' },
      { key: 'act-new-plan', label: 'New training or diet plan', hint: 'Action', icon: Plus, run: go('/app/plans/new'), keywords: 'program workout diet migo' },
      ...(isMember
        ? [
            { key: 'act-location', label: 'Change training location', hint: 'Action', icon: MapPin, run: () => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT)), keywords: 'city area address' },
            { key: 'act-people', label: 'Find people to follow', hint: 'Action', icon: UserPlus, run: go('/app/people'), keywords: 'friends search' },
            { key: 'act-watch', label: 'Connect your watch', hint: 'Action', icon: Watch, run: go('/app/devices'), keywords: 'garmin health connect device' },
          ]
        : []),
      { key: 'act-edit-profile', label: 'Edit profile', hint: 'Action', icon: PencilLine, run: go('/app/profile?open=edit'), keywords: 'name email photo account' },
      { key: 'act-goals', label: 'Fitness goals and diet preferences', hint: 'Action', icon: Sparkles, run: go('/app/profile?open=migo'), keywords: 'goal weight diet migo setup' },
    ];
    const seen = new Set<string>();
    return [...pages, ...actions].filter(e => (seen.has(e.label) ? false : (seen.add(e.label), true)));
  }, [nav, isMember, navigate, onSocial]);

  const query = q.trim().toLowerCase();
  const results = query ? entries.filter(e => `${e.label} ${e.keywords ?? ''}`.toLowerCase().includes(query)) : entries;
  const askMigo: Entry | null =
    query.length > 2
      ? { key: 'ask-q', label: `Ask Migo: “${q.trim()}”`, hint: 'Coach', icon: Sparkles, run: () => navigate(`/app/assistant?initialPrompt=${encodeURIComponent(q.trim())}`) }
      : null;
  const list = askMigo ? [...results, askMigo] : results;
  const current = Math.min(active, Math.max(0, list.length - 1));

  if (!open) return null;

  const choose = (e?: Entry) => {
    if (!e) return;
    close();
    e.run();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-overlay px-4 pt-[12vh]" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Go to" className="w-full max-w-[560px] animate-pop-in overflow-hidden rounded-gm-xl border border-border bg-surface shadow-float">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="shrink-0 text-ink-subtle" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={e => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(Math.min(current + 1, list.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(Math.max(current - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(list[current]);
              } else if (e.key === 'Escape') {
                close();
              }
            }}
            placeholder="Go to a page, or ask Migo…"
            aria-label="Search pages and actions"
            role="combobox"
            aria-expanded="true"
            aria-controls="gm-switcher-list"
            aria-activedescendant={list[current] ? `gm-sw-${list[current].key}` : undefined}
            className="t-body h-14 min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle"
          />
          <kbd className="t-caption hidden rounded border border-border px-1.5 py-0.5 text-ink-subtle sm:inline">Esc</kbd>
        </div>
        <ul id="gm-switcher-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {list.length === 0 ? <li className="t-callout px-3 py-6 text-center text-ink-muted">Nothing matches. Type a question to ask Migo.</li> : null}
          {list.map((e, i) => (
            <li
              key={e.key}
              id={`gm-sw-${e.key}`}
              role="option"
              aria-selected={i === current}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(e)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-gm-md px-3 py-2.5', i === current ? 'bg-surface-sunken' : '')}>
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-gm-md', (e.key === 'act-ask' || e.key === 'ask-q') ? 'bg-accent-soft text-accent-text' : 'bg-surface-sunken text-ink-muted')}>
                <e.icon size={16} aria-hidden />
              </span>
              <span className="t-callout min-w-0 flex-1 truncate text-ink">{e.label}</span>
              {i === current ? <CornerDownLeft size={14} className="text-ink-subtle" aria-hidden /> : <span className="t-caption text-ink-subtle">{e.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
