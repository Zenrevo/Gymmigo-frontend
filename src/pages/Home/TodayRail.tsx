import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, Building2, CalendarDays, ChevronRight, Dumbbell, Footprints, Moon, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { Button, Card, SectionHeader, Text } from '../../components/kit';
import { usePrograms } from '../../hooks/usePrograms';

const SUGGESTIONS = ['A 30-minute workout with no equipment', 'High-protein vegetarian dinner ideas', 'How do I start running 5 km?'];

function AskMigo() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const ask = (text: string) => text.trim() && navigate(`/app/assistant?initialPrompt=${encodeURIComponent(text.trim())}`);
  return (
    <Card padding="lg" className="hidden flex-col gap-3 lg:flex">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-on-accent">
          <Sparkles size={16} aria-hidden />
        </span>
        <Text variant="subtitle">Ask Migo</Text>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          ask(q);
        }}
        className="flex items-center gap-2 rounded-full border border-border bg-surface-sunken py-1 pl-4 pr-1 focus-within:border-accent">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Workout, food, form…" aria-label="Ask Migo" className="t-callout h-9 min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle" />
        <button type="submit" disabled={!q.trim()} aria-label="Ask" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cta text-white transition-opacity disabled:opacity-40">
          <ArrowUp size={16} aria-hidden />
        </button>
      </form>
      <div className="flex flex-col gap-1">
        {SUGGESTIONS.map(s => (
          <button key={s} type="button" onClick={() => ask(s)} className="t-footnote rounded-gm-md px-2 py-1.5 text-left text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink">
            {s}
          </button>
        ))}
      </div>
    </Card>
  );
}

function TodayPlan() {
  const { lists, isLoading } = usePrograms();
  const days = lists.active.filter(p => p.today && !p.today.removed).map(p => ({ program: p, day: p.today! }));
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <Text variant="subtitle">Today’s plan</Text>
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-gm-md bg-surface-sunken" />
      ) : days.length ? (
        days.map(({ program, day }) => {
          const rest = day.type === 'rest';
          return (
            <div key={program.id} className="flex flex-col gap-3 rounded-gm-lg border border-border p-3">
              <Link to={`/app/plans/${program.id}`} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">{rest ? <Moon size={17} aria-hidden /> : <Dumbbell size={17} aria-hidden />}</span>
                <span className="min-w-0">
                  <span className="t-caption block text-ink-subtle">
                    Day {day.day} · {program.title}
                  </span>
                  <span className="t-callout block font-semibold text-ink">{day.title}</span>
                </span>
              </Link>
              {day.log ? (
                <Text variant="footnote" tone="success">
                  Logged as {day.log.status === 'partial' ? 'partly done' : day.log.status}
                </Text>
              ) : rest ? (
                <Text variant="footnote" tone="muted">
                  Rest day. Walk, stretch, sleep well.
                </Text>
              ) : (
                <Button label="Log today" size="sm" to={`/app/plans/${program.id}/days/${day.day}/log`} />
              )}
            </div>
          );
        })
      ) : (
        <>
          <Text variant="footnote" tone="muted">
            Nothing planned. Migo can draft a week around your goal, and you approve it first.
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button label="Make a plan" size="sm" to="/app/plans/new" />
            <Button label="Calendar" size="sm" variant="secondary" icon={CalendarDays} to="/app/calendar" />
          </div>
        </>
      )}
    </Card>
  );
}

const SHORTCUTS: { label: string; body: string; to: string; icon: LucideIcon }[] = [
  { label: 'Find a gym', body: 'Passes and live occupancy', to: '/app/discovery', icon: Building2 },
  { label: 'Find a trainer', body: 'Book 1:1 sessions', to: '/app/discovery?tab=trainers', icon: UserRound },
  { label: 'Run together', body: 'Club map and group runs', to: '/app/run-together', icon: Footprints },
];

/** Right-hand column of the member Home (stacks under the main column on phones). */
export function TodayRail() {
  return (
    <aside className="flex flex-col gap-4" aria-label="Today">
      <TodayPlan />
      <AskMigo />
      <section className="flex flex-col gap-2">
        <SectionHeader label="Shortcuts" />
        <Card padding="none" className="divide-y divide-border overflow-hidden">
          {SHORTCUTS.map(s => (
            <Link key={s.label} to={s.to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-gm-md bg-surface-sunken text-ink-muted">
                <s.icon size={17} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="t-callout block font-semibold text-ink">{s.label}</span>
                <span className="t-footnote block text-ink-muted">{s.body}</span>
              </span>
              <ChevronRight size={16} className="text-ink-subtle" aria-hidden />
            </Link>
          ))}
        </Card>
      </section>
    </aside>
  );
}
