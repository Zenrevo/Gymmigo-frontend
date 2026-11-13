import { CalendarCheck, Check, ChevronRight, Dumbbell, Minus, Sparkles, Utensils, X, type LucideIcon } from 'lucide-react';
import { Badge, Button, Card, ProgressRing, Text, type Tone } from '../kit';
import { adherenceLabel, dayOfLabel, durationLabel, KIND_LABEL, ringFraction, TYPE_LABEL, type DayState } from '../../lib/migo/programLogic';
import { dayDateLabel } from '../../lib/migo/dates';
import type { Program, ProgramDay, ProgramPhase } from '../../types/programs';

/** Icon for a program kind (diet, both, workout). */
export function KindIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  if (kind === 'diet') return <Utensils size={size} />;
  if (kind === 'both') return <Sparkles size={size} />;
  return <Dumbbell size={size} />;
}

/** Card for an active or past program on the Programs page. */
export function ProgramCard({ program, onOpen, onLogToday }: { program: Program; onOpen: () => void; onLogToday?: () => void }) {
  const active = program.status === 'active';
  const today = program.today;
  return (
    <Card padding="md">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 text-left" aria-label={program.title}>
        {active ? (
          <ProgressRing value={ringFraction(program)} size={64} stroke={7} label={dayOfLabel(program)}>
            <span className="t-subtitle text-ink">{Math.max(0, Math.min(program.progress.day_index, program.duration_days))}</span>
            <span className="t-label-sm text-ink-subtle">of {program.duration_days}</span>
          </ProgressRing>
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
            <KindIcon kind={program.kind} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <Text variant="labelSm" tone={active ? 'accent' : 'subtle'}>
            {KIND_LABEL[program.kind]} · {durationLabel(program.duration_days)}
          </Text>
          <Text variant="title" className="line-clamp-2">
            {program.title}
          </Text>
          <Text variant="footnote" tone="muted" truncate>
            {active
              ? `${dayOfLabel(program)} · ${adherenceLabel(program.progress.adherence_pct)}`
              : program.status === 'completed'
                ? `Completed · ${Math.round(program.progress.adherence_pct)}% logged`
                : 'Removed from calendar'}
          </Text>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
      </button>
      {active && today && today.type !== 'rest' && !today.removed ? (
        <div className="mt-3 flex items-center gap-3 rounded-gm-lg bg-surface-sunken p-3">
          <div className="min-w-0 flex-1">
            <Text variant="labelSm" tone="subtle">
              Today · day {today.day}
            </Text>
            <Text variant="bodyStrong" truncate>
              {today.title}
            </Text>
          </div>
          {today.log ? <Badge label="Logged" tone="success" dot /> : onLogToday ? <Button label="Log today" size="sm" onClick={onLogToday} /> : null}
        </div>
      ) : null}
    </Card>
  );
}

/** Phases as a segmented bar plus a numbered list. */
export function PhaseTimeline({ phases }: { phases: ProgramPhase[] }) {
  if (!phases.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {phases.map((ph, i) => (
          <span key={`${ph.name}-${i}`} className={`h-1.5 flex-1 rounded-full ${i === 0 ? 'bg-accent' : 'bg-accent-soft'}`} />
        ))}
      </div>
      {phases.map((ph, i) => (
        <div key={`${ph.name}-t-${i}`} className="flex items-start gap-3">
          <span className={`t-label-sm mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-accent text-on-accent' : 'bg-surface-sunken text-ink-muted'}`}>
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Text variant="bodyStrong">
              {ph.name} <span className="t-caption text-ink-subtle">· Weeks {ph.weeks}</span>
            </Text>
            <Text variant="footnote" tone="muted">
              {ph.focus}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}

const STATE_LOOK: Record<DayState, { label: string; tone: Tone; icon?: LucideIcon }> = {
  done: { label: 'Done', tone: 'success', icon: Check },
  partial: { label: 'Partial', tone: 'warning', icon: Minus },
  skipped: { label: 'Skipped', tone: 'neutral', icon: X },
  removed: { label: 'Removed', tone: 'neutral' },
  today: { label: 'Today', tone: 'accent', icon: CalendarCheck },
  missed: { label: 'Not logged', tone: 'danger' },
  upcoming: { label: 'Upcoming', tone: 'info' },
};

export function DayStateBadge({ state }: { state: DayState }) {
  if (state === 'upcoming') return null;
  const look = STATE_LOOK[state];
  return <Badge label={look.label} tone={look.tone} dot={state === 'today'} />;
}

/** A planned day as a row (Review "first week"). */
export function DayRow({ d }: { d: ProgramDay }) {
  const rest = d.type === 'rest';
  return (
    <div className="flex items-center gap-3 rounded-gm-lg border border-border bg-surface p-3">
      <span className={`flex h-13 w-12 shrink-0 flex-col items-center justify-center rounded-gm-md py-1.5 ${rest ? 'bg-surface-sunken' : 'bg-accent-soft'}`}>
        <span className={`t-label-sm ${rest ? 'text-ink-subtle' : 'text-accent-text'}`}>Day</span>
        <span className="t-subtitle text-ink">{d.day}</span>
      </span>
      <div className="min-w-0 flex-1">
        <Text variant="labelSm" tone="subtle">
          {TYPE_LABEL[d.type]} · {dayDateLabel(d.date)}
        </Text>
        <Text variant="bodyStrong" truncate>
          {d.title}
        </Text>
        {d.focus ? (
          <Text variant="footnote" tone="muted" className="line-clamp-2">
            {d.focus}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

