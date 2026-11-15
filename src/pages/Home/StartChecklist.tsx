import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronRight, ClipboardList, MapPin, Target, UserPlus, X, type LucideIcon } from 'lucide-react';
import { Card, cn, ProgressRing, Text } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import { useGeoLocation } from '../../context/LocationContext';
import { usePrograms } from '../../hooks/usePrograms';
import { useFitnessProfile, useMyMemberships, useSocialCounts } from '../../hooks/useProfileQueries';
import { OPEN_LOCATION_EVENT } from '../../layouts/QuickSwitcher';

const HIDE_KEY = 'gymmigo_checklist_hidden';

type Step = { key: string; icon: LucideIcon; title: string; body: string; done: boolean; to?: string; onClick?: () => void };

/** First-week guide on the member Home: five steps that make the app useful. Hides itself once done or dismissed. */
export function StartChecklist() {
  const { user } = useAuth();
  const { selectedLocation } = useGeoLocation();
  const fitness = useFitnessProfile();
  const memberships = useMyMemberships();
  const { lists, isLoading: programsLoading } = usePrograms();
  const social = useSocialCounts(user?.id);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const loading = fitness.isLoading || memberships.isLoading || programsLoading || social.isLoading;
  if (hidden || loading) return null;

  const steps: Step[] = [
    { key: 'location', icon: MapPin, title: 'Set where you train', body: 'Gyms and distances are worked out from here.', done: !!selectedLocation, onClick: () => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT)) },
    { key: 'goal', icon: Target, title: 'Tell Migo your goal', body: 'Goal, level and food preferences, so advice fits you.', done: !!fitness.data?.primary_goal, to: '/app/profile?open=migo' },
    { key: 'gym', icon: Building2, title: 'Join a gym', body: 'Pick a pass nearby and check in with QR.', done: (memberships.data ?? []).some(m => m.status === 'active'), to: '/app/discovery' },
    { key: 'plan', icon: ClipboardList, title: 'Get a plan you approve', body: 'A 7 to 90-day workout or diet plan in your calendar.', done: lists.active.length + lists.drafts.length + lists.past.length > 0, to: '/app/plans/new' },
    { key: 'people', icon: UserPlus, title: 'Follow a friend', body: 'See their runs and invite them to run together.', done: (social.data?.following ?? 0) > 0, to: '/app/people' },
  ];
  const done = steps.filter(s => s.done).length;
  if (done === steps.length) return null;
  const next = steps.find(s => !s.done);
  const todo = steps.filter(s => !s.done);
  const shown = expanded ? steps : todo.slice(0, 3);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_KEY, '1');
    } catch {
      // private mode: hidden for this visit only
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-5 py-4">
        <ProgressRing value={done / steps.length} size={48} stroke={5} label={`${done} of ${steps.length} steps done`}>
          <span className="t-footnote font-bold text-ink">
            {done}/{steps.length}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <Text variant="subtitle">Get set up</Text>
          <Text variant="footnote" tone="muted">
            {next ? `Next: ${next.title.toLowerCase()}.` : 'All done.'} About two minutes in total.
          </Text>
        </div>
        <button type="button" onClick={dismiss} aria-label="Hide setup steps" title="Hide" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink">
          <X size={16} aria-hidden />
        </button>
      </div>
      <ol className="divide-y divide-border">
        {shown.map(s => {
          const inner = (
            <>
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  s.done ? 'bg-success-soft text-success' : s === next ? 'bg-accent-soft text-accent-text' : 'bg-surface-sunken text-ink-muted',
                )}>
                {s.done ? <Check size={17} strokeWidth={2.6} aria-hidden /> : <s.icon size={17} aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('t-callout block font-semibold', s.done ? 'text-ink-subtle line-through decoration-border-strong' : 'text-ink')}>{s.title}</span>
                {s.done ? null : <span className="t-footnote block text-ink-muted">{s.body}</span>}
              </span>
              {s.done ? <span className="sr-only">Done</span> : <ChevronRight size={16} className="shrink-0 text-ink-subtle" aria-hidden />}
            </>
          );
          const cls = cn('flex w-full items-center gap-3 px-5 py-3 text-left', !s.done && 'transition-colors hover:bg-surface-sunken');
          return (
            <li key={s.key}>
              {s.done ? (
                <div className={cls}>{inner}</div>
              ) : s.to ? (
                <Link to={s.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={s.onClick} className={cls}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {expanded || todo.length > 3 || done > 0 ? (
        <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded} className="t-footnote w-full border-t border-border px-5 py-2.5 text-left font-semibold text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink">
          {expanded ? 'Show what’s left' : `Show all ${steps.length} steps`}
        </button>
      ) : null}
    </Card>
  );
}
