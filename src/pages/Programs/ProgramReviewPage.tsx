import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react';
import { AppBar, Button, Card, ErrorState, Skeleton, Text, TextArea, confirmDialog, useToast } from '../../components/kit';
import { aiApi, programError } from '../../api/ai';
import { DayRow, KindIcon, PhaseTimeline } from '../../components/programs/ProgramParts';
import { dayDateLabel } from '../../lib/migo/dates';
import { durationLabel, KIND_LABEL, TYPE_LABEL, weekSummary, weeksOf } from '../../lib/migo/programLogic';
import { invalidatePrograms, programKeys, useProgram } from '../../hooks/usePrograms';
import { Generating } from './ProgramCreatePage';

/** A drafted program: read the outline, then approve it into the calendar, ask for changes, or discard it. */
export default function ProgramReviewPage() {
  const { programId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const q = useProgram(programId);
  const p = q.data;
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const [regen, setRegen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState<'approve' | 'regen' | 'discard' | null>(null);

  useEffect(() => {
    if (p && p.status !== 'draft') navigate(`/app/plans/${programId}`, { replace: true });
  }, [p, navigate, programId]);

  if (busy === 'regen' && p) return <Generating duration={p.duration_days} verb="Rebuilding" />;

  const approve = async () => {
    if (!p) return;
    setBusy('approve');
    try {
      const next = await aiApi.approveProgram(p.id, { start_date: p.start_date, reminder_time: p.reminder_time });
      client.setQueryData(programKeys.detail(p.id), next);
      await invalidatePrograms(client);
      toast({ tone: 'success', title: 'Added to your calendar', message: `${p.title} starts ${dayDateLabel(p.start_date)}.` });
      navigate(`/app/plans/${p.id}`, { replace: true });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t add the plan', message: programError(e) });
      setBusy(null);
    }
  };

  const regenerate = async () => {
    if (!p) return;
    setBusy('regen');
    try {
      const next = await aiApi.regenerateProgram(p.id, feedback.trim());
      client.setQueryData(programKeys.detail(p.id), next);
      await invalidatePrograms(client);
      setRegen(false);
      setFeedback('');
      setOpenWeek(1);
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t rebuild the plan', message: programError(e) });
    } finally {
      setBusy(null);
    }
  };

  const discard = async () => {
    if (!p) return;
    const ok = await confirmDialog({
      title: 'Discard this draft?',
      message: 'Nothing was added to your calendar. You can draft a new plan any time.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy('discard');
    try {
      await aiApi.deleteProgram(p.id);
      await invalidatePrograms(client);
      navigate('/app/assistant?tab=plans', { replace: true });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t discard', message: programError(e) });
      setBusy(null);
    }
  };

  const header = <AppBar caption="Review your plan" title={p?.title ?? 'Draft plan'} backTo="/app/assistant?tab=plans" />;

  if (q.isError)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {header}
        <ErrorState onRetry={() => q.refetch()} />
      </div>
    );

  const weeks = weeksOf(p?.days ?? []);
  const firstWeek = (p?.days ?? []).slice(0, 7);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {header}
      {!p ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-36" rounded="xl" />
          <Skeleton className="h-56" rounded="xl" />
        </div>
      ) : (
        <>
          {regen ? (
            <Card padding="lg">
              <div className="flex flex-col gap-3">
                <Text variant="subtitle">What should change?</Text>
                <TextArea
                  label="Your feedback"
                  placeholder="e.g. Fewer leg days, add a long run on Sundays, no dairy"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  maxLength={500}
                  rows={3}
                  autoFocus
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button label="Rebuild plan" icon={RefreshCw} onClick={regenerate} fullWidth />
                  <Button label="Cancel" variant="ghost" onClick={() => setRegen(false)} fullWidth />
                </div>
              </div>
            </Card>
          ) : null}

          <Card padding="lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">
                  <KindIcon kind={p.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <Text variant="labelSm" tone="accent">
                    {KIND_LABEL[p.kind]} · {durationLabel(p.duration_days)}
                  </Text>
                  <Text variant="footnote" tone="muted">
                    {dayDateLabel(p.start_date)} → {dayDateLabel(p.end_date)}
                    {p.reminder_time ? ` · reminder ${p.reminder_time.slice(0, 5)}` : ''}
                  </Text>
                </div>
              </div>
              {p.outline.summary ? <Text>{p.outline.summary}</Text> : null}
            </div>
          </Card>

          {p.outline.phases.length ? (
            <section className="flex flex-col gap-3">
              <Text variant="h2">Phases</Text>
              <Card padding="lg">
                <PhaseTimeline phases={p.outline.phases} />
              </Card>
            </section>
          ) : null}

          {firstWeek.length ? (
            <section className="flex flex-col gap-3">
              <Text variant="h2">Your first week</Text>
              <div className="grid gap-2 md:grid-cols-2">
                {firstWeek.map(d => (
                  <DayRow key={d.day} d={d} />
                ))}
              </div>
            </section>
          ) : null}

          {weeks.length > 1 ? (
            <section className="flex flex-col gap-3">
              <Text variant="h2">Week by week</Text>
              {weeks.map(w => {
                const open = openWeek === w.week;
                return (
                  <Card key={w.week} padding="md">
                    <button type="button" onClick={() => setOpenWeek(open ? null : w.week)} aria-expanded={open} className="flex w-full items-center gap-3 text-left">
                      <Text variant="subtitle" className="flex-1">
                        Week {w.week}
                      </Text>
                      <Text variant="caption" tone="subtle">
                        {weekSummary(w.days)}
                      </Text>
                      {open ? <ChevronUp size={18} className="text-ink-muted" /> : <ChevronDown size={18} className="text-ink-muted" />}
                    </button>
                    {open ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {w.days.map(d => (
                          <div key={d.day} className="flex items-center gap-3">
                            <Text variant="caption" tone="subtle" className="w-12 shrink-0">
                              Day {d.day}
                            </Text>
                            <Text variant="callout" truncate className="flex-1">
                              {d.title}
                            </Text>
                            <Text variant="labelSm" tone={d.type === 'rest' ? 'subtle' : 'accent'}>
                              {TYPE_LABEL[d.type]}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </section>
          ) : null}

          {!regen ? (
            <div className="sticky bottom-[calc(88px+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-gm-xl md:border md:px-4">
              <Button label="Approve & add to calendar" icon={CalendarCheck} onClick={approve} loading={busy === 'approve'} disabled={!!busy} fullWidth size="lg" />
              <div className="flex gap-2">
                <Button label="Change it" variant="secondary" icon={RefreshCw} onClick={() => setRegen(true)} disabled={!!busy} fullWidth />
                <Button label="Discard" variant="ghost" icon={Trash2} onClick={discard} loading={busy === 'discard'} disabled={!!busy} fullWidth />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
