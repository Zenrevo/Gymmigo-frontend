import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarCheck, Eye, Flame, SlidersHorizontal, Trash2 } from 'lucide-react';
import { AppBar, Button, Card, ErrorState, IconButton, ListGroup, ListItem, ProgressRing, Sheet, Skeleton, Text, TimeField, confirmDialog, useToast } from '../../components/kit';
import { aiApi, programError } from '../../api/ai';
import { DayStateBadge, PhaseTimeline } from '../../components/programs/ProgramParts';
import { dayDateLabel } from '../../lib/migo/dates';
import { RecommendationSheet } from '../../components/migo/RecommendationSheet';
import { canLog, canRemove, clamp01, dayOfLabel, dayState, durationLabel, isLoggable, KIND_LABEL, localDay, programLabel, TYPE_LABEL, weeksOf } from '../../lib/migo/programLogic';
import { invalidatePrograms, programKeys, useProgram } from '../../hooks/usePrograms';
import type { Recommendation } from '../../types/ai';
import type { Program, ProgramDay } from '../../types/programs';

/** An approved program: progress, every day by week, logging, removing days and removing the whole plan. */
export default function ProgramDetailPage() {
  const { programId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const q = useProgram(programId);
  const p = q.data;
  const today = localDay(new Date());
  const [menu, setMenu] = useState(false);
  const [editReminder, setEditReminder] = useState(false);
  const [reminder, setReminder] = useState('19:00');
  const [saving, setSaving] = useState(false);
  const [day, setDay] = useState<ProgramDay | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const active = p?.status === 'active';

  const refresh = () => invalidatePrograms(client).then(() => client.invalidateQueries({ queryKey: programKeys.detail(programId) }));

  const removePlan = async () => {
    setMenu(false);
    const ok = await confirmDialog({
      title: 'Remove this plan from your calendar?',
      message: 'Upcoming days are removed. Days you already logged stay in your history.',
      confirmLabel: 'Remove plan',
      cancelLabel: 'Keep plan',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await aiApi.deleteProgram(programId);
      await invalidatePrograms(client);
      toast({ tone: 'success', title: 'Plan removed from your calendar' });
      navigate('/app/assistant?tab=plans', { replace: true });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t remove the plan', message: programError(e) });
    }
  };

  const saveReminder = async (value: string | null) => {
    setSaving(true);
    try {
      const res = await aiApi.updateProgram(programId, { reminder_time: value });
      client.setQueryData(programKeys.detail(programId), (old: Program | undefined) => (old ? { ...old, ...res, days: res.days ?? old.days } : res));
      await client.invalidateQueries({ queryKey: programKeys.list });
      setEditReminder(false);
      toast({ tone: 'success', title: value ? `Reminder set for ${value}` : 'Reminders turned off' });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t save the reminder', message: programError(e) });
    } finally {
      setSaving(false);
    }
  };

  const viewPlan = async (d: ProgramDay) => {
    try {
      const r = await aiApi.recommendation(d.recommendation_id as string);
      setDay(null);
      if (r) setRec(r);
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t open this day', message: programError(e) });
    }
  };

  const removeDay = async (d: ProgramDay) => {
    const ok = await confirmDialog({ title: `Remove day ${d.day}?`, message: `${d.title} leaves your calendar. You can’t undo this.`, confirmLabel: 'Remove day', tone: 'danger' });
    if (!ok) return;
    try {
      await aiApi.deleteRecommendation(d.recommendation_id as string);
      setDay(null);
      await refresh();
      toast({ tone: 'success', title: `Day ${d.day} removed` });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t remove the day', message: programError(e) });
    }
  };

  const header = (
    <AppBar
      caption={p ? `${KIND_LABEL[p.kind]} · ${durationLabel(p.duration_days)}` : 'Plan'}
      title={p?.title ?? 'Plan'}
      backTo="/app/assistant?tab=plans"
      right={active ? <IconButton icon={SlidersHorizontal} label="Plan options" onClick={() => setMenu(true)} /> : undefined}
    />
  );

  if (q.isError)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {header}
        <ErrorState onRetry={() => q.refetch()} />
      </div>
    );

  const todayDay = p?.days?.find(d => d.date === today) ?? p?.today ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {header}
      {!p ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40" rounded="xl" />
          <Skeleton className="h-72" rounded="xl" />
        </div>
      ) : (
        <>
          <Card padding="lg">
            <div className="flex items-center gap-5">
              <ProgressRing value={clamp01(p.progress.adherence_pct / 100)} size={88} stroke={9} label={`${Math.round(p.progress.adherence_pct)}% on track`}>
                <span className="t-subtitle text-ink">{Math.round(p.progress.adherence_pct)}%</span>
                <span className="t-label-sm text-ink-subtle">on track</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <Text variant="title">{dayOfLabel(p)}</Text>
                <Text variant="footnote" tone="muted">
                  {dayDateLabel(p.start_date)} → {dayDateLabel(p.end_date)}
                  {p.reminder_time ? ` · reminder ${p.reminder_time.slice(0, 5)}` : ''}
                </Text>
                <div className="mt-2 flex gap-5">
                  <Stat label="Done" value={p.progress.days_done} />
                  <Stat label="Partial" value={p.progress.days_partial} />
                  <Stat label="Skipped" value={p.progress.days_skipped} />
                </div>
              </div>
            </div>
            {p.progress.streak > 1 ? (
              <div className="mt-3 flex items-center gap-1.5 text-accent-text">
                <Flame size={16} className="text-accent" />
                <Text variant="footnote" tone="accent">
                  {p.progress.streak}-day logging streak
                </Text>
              </div>
            ) : null}
            {isLoggable(p) && todayDay && !todayDay.removed ? (
              <Button
                className="mt-4"
                label={todayDay.log ? 'Update today’s log' : `Log day ${todayDay.day}`}
                icon={CalendarCheck}
                variant={todayDay.log ? 'secondary' : 'primary'}
                to={`/app/plans/${programId}/days/${todayDay.day}/log`}
                fullWidth
              />
            ) : null}
          </Card>

          {editReminder ? (
            <Card padding="lg">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-accent" />
                  <Text variant="subtitle">Daily reminder</Text>
                </div>
                <TimeField label="Remind me at" value={reminder} onChange={setReminder} />
                <Text variant="caption" tone="subtle">
                  Reminders arrive on your phone through the Gymmigo app.
                </Text>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button label="Save" onClick={() => saveReminder(reminder)} loading={saving} fullWidth />
                  {p.reminder_time ? <Button label="Turn off reminders" variant="secondary" onClick={() => saveReminder(null)} disabled={saving} fullWidth /> : null}
                  <Button label="Cancel" variant="ghost" onClick={() => setEditReminder(false)} disabled={saving} fullWidth />
                </div>
              </div>
            </Card>
          ) : null}

          {p.outline.phases.length ? (
            <Card padding="lg">
              <PhaseTimeline phases={p.outline.phases} />
            </Card>
          ) : null}

          {weeksOf(p.days ?? []).map(w => (
            <section key={w.week} className="flex flex-col gap-2">
              <Text variant="label" tone="muted">
                Week {w.week}
              </Text>
              <Card padding="none" className="overflow-hidden">
                {w.days.map((d, i) => {
                  const state = dayState(d, today);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => setDay(d)}
                      aria-label={`Day ${d.day}, ${d.title}, ${state}`}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-sunken ${i ? 'border-t border-border' : ''} ${d.removed ? 'opacity-50' : ''}`}
                    >
                      <Text variant="caption" tone="subtle" className="w-20 shrink-0">
                        {dayDateLabel(d.date)}
                      </Text>
                      <div className="min-w-0 flex-1">
                        <Text variant="callout" truncate className={d.removed ? 'line-through' : ''}>
                          {d.title}
                        </Text>
                        <Text variant="caption" tone="subtle">
                          Day {d.day} · {TYPE_LABEL[d.type]}
                        </Text>
                      </div>
                      <DayStateBadge state={state} />
                    </button>
                  );
                })}
              </Card>
            </section>
          ))}
        </>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={p?.title ?? 'Plan'} eyebrow="Plan options" size="sm">
        <ListGroup>
          <ListItem
            icon={Bell}
            title="Change reminder time"
            subtitle={p?.reminder_time ? `Now ${p.reminder_time.slice(0, 5)}` : 'Off'}
            chevron
            onClick={() => {
              setReminder(p?.reminder_time?.slice(0, 5) ?? '19:00');
              setEditReminder(true);
              setMenu(false);
            }}
          />
          <ListItem icon={Trash2} title="Remove plan from calendar" destructive onClick={removePlan} />
        </ListGroup>
      </Sheet>

      <Sheet open={!!day} onClose={() => setDay(null)} eyebrow={day ? `Day ${day.day} · ${TYPE_LABEL[day.type]}` : undefined} title={day?.title} size="sm">
        {day && p ? (
          <div className="flex flex-col gap-4">
            <Text tone="muted">
              {dayDateLabel(day.date)}
              {day.focus ? ` · ${day.focus}` : ''}
            </Text>
            {!day.recommendation_id && !day.removed && day.type !== 'rest' ? (
              <Text variant="footnote" tone="subtle">
                The full plan for this day is prepared a few days ahead.
              </Text>
            ) : null}
            <ListGroup>
              {day.recommendation_id ? <ListItem icon={Eye} title="View plan" chevron onClick={() => viewPlan(day)} /> : null}
              {isLoggable(p) && canLog(day, today) ? (
                <ListItem icon={CalendarCheck} title={day.log ? 'Update log' : 'Log this day'} chevron to={`/app/plans/${programId}/days/${day.day}/log`} />
              ) : null}
              {active && canRemove(day, today) && day.recommendation_id ? <ListItem icon={Trash2} title="Remove from calendar" destructive onClick={() => removeDay(day)} /> : null}
            </ListGroup>
          </div>
        ) : null}
      </Sheet>

      <RecommendationSheet
        recommendation={rec}
        label={p && rec ? programLabel(p, rec.program_day) : null}
        onClose={() => setRec(null)}
        onChanged={next => {
          setRec(next);
          void refresh();
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <Text variant="subtitle">{value}</Text>
      <Text variant="labelSm" tone="subtle">
        {label}
      </Text>
    </div>
  );
}
