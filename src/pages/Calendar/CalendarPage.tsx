import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Dumbbell, RotateCcw, Sparkles, Trash2, Utensils } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, PageHeader, Sheet, Skeleton, Text, TextArea, confirmDialog, useToast } from '../../components/kit';
import { RecommendationSheet } from '../../components/migo/RecommendationSheet';
import { aiApi, programError } from '../../api/ai';
import { planMeta } from '../../lib/migo/planFields';
import { localDay, programLabel } from '../../lib/migo/programLogic';
import { useInvalidatePrograms, usePrograms, useRecommendations } from '../../hooks/usePrograms';
import type { Recommendation } from '../../types/ai';
import type { Program } from '../../types/programs';

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

/** Plan tab: month calendar of Migo day plans; program days carry the plan's name; build a week; remove days. */
export default function CalendarPage() {
  const toast = useToast();
  const invalidate = useInvalidatePrograms();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [open, setOpen] = useState<Recommendation | null>(null);
  const [weekOpen, setWeekOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [building, setBuilding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }), [month]);
  const recs = useRecommendations(dayKey(days[0]), dayKey(days[days.length - 1]));
  const programs = usePrograms();
  const programById = useMemo(() => {
    const all: Program[] = [...programs.lists.active, ...programs.lists.past, ...programs.lists.drafts];
    return new Map(all.map(p => [p.id, p]));
  }, [programs.lists]);

  const byDate = useMemo(() => {
    const map: Record<string, Recommendation[]> = {};
    for (const r of recs.data ?? []) {
      const k = r.date_for?.slice(0, 10);
      if (k) (map[k] ??= []).push(r);
    }
    return map;
  }, [recs.data]);

  const selectedPlans = byDate[dayKey(selected)] ?? [];
  const today = localDay(new Date());

  const labelFor = (r: Recommendation) => (r.program_id ? programLabel(programById.get(r.program_id), r.program_day) : null);

  const buildWeek = async () => {
    setBuilding(true);
    setWeekOpen(false);
    try {
      await aiApi.weeklySchedule({ start_date: dayKey(selected), days: 7, force: false, user_instructions: instructions.trim() || undefined });
      setInstructions('');
      await invalidate();
      toast({ tone: 'success', title: 'Your week is ready', message: 'Migo planned the next 7 days.' });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t build the week', message: programError(e) });
    } finally {
      setBuilding(false);
    }
  };

  const resetUpcoming = async () => {
    const ok = await confirmDialog({
      title: 'Reset upcoming plans?',
      message: 'All upcoming plans you haven’t completed are removed. This can’t be undone.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (!ok) return;
    setResetting(true);
    try {
      await aiApi.resetUpcoming();
      setOpen(null);
      await invalidate();
      toast({ tone: 'success', title: 'Upcoming plans cleared' });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t reset', message: programError(e) });
    } finally {
      setResetting(false);
    }
  };

  const removeDay = async (r: Recommendation) => {
    const ok = await confirmDialog({ title: 'Remove this day?', message: `${planMeta(r).title} leaves your calendar.`, confirmLabel: 'Remove', tone: 'danger' });
    if (!ok) return;
    try {
      await aiApi.deleteRecommendation(r.id);
      await invalidate();
      toast({ tone: 'success', title: 'Removed from your calendar' });
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t remove', message: programError(e) });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Plan"
        title="Your calendar"
        subtitle="Migo’s day plans and your multi-day programs."
        actions={
          <div className="flex gap-2">
            <Button label={building ? 'Building…' : 'Build week'} icon={Sparkles} loading={building} disabled={resetting} onClick={() => setWeekOpen(true)} />
            <Button label="Reset upcoming" variant="secondary" icon={RotateCcw} loading={resetting} disabled={building} onClick={resetUpcoming} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card padding="md">
          <div className="mb-3 flex items-center gap-2">
            <Text variant="h2" className="flex-1">
              {format(month, 'MMMM yyyy')}
            </Text>
            <IconButton icon={ChevronLeft} label="Previous month" variant="ghost" onClick={() => setMonth(subMonths(month, 1))} />
            <IconButton icon={ChevronRight} label="Next month" variant="ghost" onClick={() => setMonth(addMonths(month, 1))} />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Text key={d} variant="labelSm" tone="subtle" align="center" className="py-1">
                {d}
              </Text>
            ))}
            {days.map(d => {
              const k = dayKey(d);
              const plans = byDate[k] ?? [];
              const isSel = isSameDay(d, selected);
              const isToday = k === today;
              const inMonth = isSameMonth(d, month);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(d)}
                  aria-pressed={isSel}
                  aria-label={`${format(d, 'EEEE d MMMM')}${plans.length ? `, ${plans.length} plan${plans.length > 1 ? 's' : ''}` : ''}`}
                  className={`flex min-h-14 flex-col items-center gap-1 rounded-gm-md border p-1 transition sm:min-h-20 sm:items-start sm:p-1.5 ${
                    isSel ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-surface-sunken'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span className={`t-callout ${isToday ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent' : 'text-ink'}`}>{format(d, 'd')}</span>
                  <span className="flex gap-0.5 sm:hidden">
                    {plans.slice(0, 3).map(p => (
                      <span key={p.id} className={`h-1.5 w-1.5 rounded-full ${p.is_completed ? 'bg-success' : p.type === 'diet' ? 'bg-info' : 'bg-accent'}`} />
                    ))}
                  </span>
                  <span className="hidden w-full flex-col gap-0.5 sm:flex">
                    {plans.slice(0, 2).map(p => (
                      <span
                        key={p.id}
                        className={`t-caption truncate rounded px-1 text-left ${p.is_completed ? 'bg-success-soft text-success' : p.program_id ? 'bg-accent-soft text-accent-text' : 'bg-surface-sunken text-ink-muted'}`}
                      >
                        {p.structured_data?.calendar_tag || planMeta(p).title}
                      </span>
                    ))}
                    {plans.length > 2 ? <span className="t-caption text-ink-subtle">+{plans.length - 2}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          {recs.isError ? <ErrorState className="mt-4" message="We couldn’t load your plans." onRetry={() => recs.refetch()} /> : null}
        </Card>

        <section className="flex flex-col gap-3">
          <Text variant="h2">{format(selected, 'EEEE, d MMMM')}</Text>
          {recs.isLoading ? <Skeleton className="h-24" rounded="xl" /> : null}
          {!recs.isLoading && !selectedPlans.length ? (
            <EmptyState compact icon={Sparkles} title="Nothing planned" message="Build a week with Migo, or create a multi-day plan." actionLabel="New plan" actionTo="/app/plans/new" />
          ) : null}
          {selectedPlans.map(r => {
            const m = planMeta(r);
            const label = labelFor(r);
            const removable = !r.is_completed && r.date_for.slice(0, 10) >= today;
            return (
              <Card key={r.id} padding="md">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => setOpen(r)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${r.type === 'diet' ? 'bg-surface-sunken text-ink' : 'bg-accent-soft text-accent-text'}`}>
                      {r.type === 'diet' ? <Utensils size={18} /> : <Dumbbell size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="labelSm" tone="accent">
                        {(r.type || 'plan').replace(/_/g, ' ')}
                      </Text>
                      <Text variant="title" className="line-clamp-2">
                        {m.title}
                      </Text>
                      {label ? (
                        <Text variant="caption" tone="muted" truncate>
                          {label}
                        </Text>
                      ) : null}
                    </div>
                  </button>
                  {r.is_completed ? <Badge label="Done" tone="success" dot /> : null}
                  {removable ? <IconButton icon={Trash2} label="Remove from calendar" variant="ghost" onClick={() => removeDay(r)} /> : null}
                </div>
              </Card>
            );
          })}
        </section>
      </div>

      <Sheet
        open={weekOpen}
        onClose={() => setWeekOpen(false)}
        eyebrow="Migo"
        title="Build your week"
        size="sm"
        footer={<Button label="Plan 7 days" icon={Sparkles} onClick={buildWeek} fullWidth />}
      >
        <div className="flex flex-col gap-3">
          <Text tone="muted">Migo plans 7 days from {format(selected, 'EEE d MMM')}, around your profile and recent sessions. This can take a couple of minutes.</Text>
          <TextArea
            label="Anything to include?"
            optional
            placeholder="e.g. Rest on Sunday, focus on upper body, 45 min max"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
      </Sheet>

      <RecommendationSheet
        recommendation={open}
        label={open ? labelFor(open) : null}
        onClose={() => setOpen(null)}
        onChanged={next => {
          setOpen(next);
          void invalidate();
        }}
      />
    </div>
  );
}
