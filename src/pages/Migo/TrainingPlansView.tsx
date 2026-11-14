import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ChevronRight, Dumbbell, History, Moon, Plus, Sparkles, Utensils } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, SectionHeader, Skeleton, Text } from '../../components/kit';
import { ProgramCard } from '../../components/programs/ProgramParts';
import { dayDateLabel } from '../../lib/migo/dates';
import { RecommendationSheet } from '../../components/migo/RecommendationSheet';
import { durationLabel, KIND_LABEL } from '../../lib/migo/programLogic';
import { isRestDay, planMeta } from '../../lib/migo/planFields';
import { formatDay } from '../../lib/migo/dates';
import { useInvalidatePrograms, usePrograms, useRecommendations } from '../../hooks/usePrograms';
import type { Recommendation } from '../../types/ai';

/** Migo → Training Plans: Your plans (programs) on top, then today's and past day plans. */
export default function TrainingPlansView() {
  const navigate = useNavigate();
  const programs = usePrograms();
  const recs = useRecommendations();
  const invalidate = useInvalidatePrograms();
  const [open, setOpen] = useState<Recommendation | null>(null);
  const { active, drafts, past } = programs.lists;

  const list = recs.data ?? [];
  const activeRecs = list.filter(r => r.is_active !== false && !r.is_completed);
  const pastRecs = list.filter(r => r.is_active === false || r.is_completed).slice(0, 12);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <section className="flex flex-col gap-3">
        <SectionHeader label={<span className="flex items-center gap-2"><Sparkles size={18} className="text-accent" />Your plans</span>} meta="New plan" onMeta={() => navigate('/app/plans/new')} />
        {programs.isLoading ? <Skeleton className="h-32" rounded="xl" /> : null}
        {programs.isError ? <ErrorState message="We couldn’t load your plans." onRetry={() => programs.refetch()} /> : null}
        {!programs.isLoading && !programs.isError && !active.length && !drafts.length ? (
          <Card padding="lg">
            <div className="flex flex-col gap-3">
              <Text variant="title">Plan 1 week to 90 days with Migo</Text>
              <Text variant="footnote" tone="muted">
                Pick a length and goal, review the plan, then add it to your calendar. Log each day and Migo adapts as you go.
              </Text>
              <Button label="Create a plan" icon={Plus} to="/app/plans/new" className="self-start" />
            </div>
          </Card>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {active.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onOpen={() => navigate(`/app/plans/${p.id}`)}
              onLogToday={p.today && !p.today.removed ? () => navigate(`/app/plans/${p.id}/days/${p.today!.day}/log`) : undefined}
            />
          ))}
        </div>
        {drafts.length ? (
          <>
            <Text variant="label" tone="muted" className="mt-1">
              Waiting for your approval
            </Text>
            <div className="grid gap-3 lg:grid-cols-2">
              {drafts.map(p => (
                <Card key={p.id} onClick={() => navigate(`/app/plans/${p.id}/review`)} aria-label={`Review ${p.title}`}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                      <CalendarClock size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="labelSm" tone="warning">
                        Draft · {KIND_LABEL[p.kind]} · {durationLabel(p.duration_days)}
                      </Text>
                      <Text variant="title" truncate>
                        {p.title}
                      </Text>
                      <Text variant="footnote" tone="muted">
                        Starts {dayDateLabel(p.start_date)} once you approve
                      </Text>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : null}
        {past.length ? (
          <>
            <Text variant="label" tone="muted" className="mt-1">
              Past plans
            </Text>
            <div className="grid gap-3 lg:grid-cols-2">
              {past.slice(0, 6).map(p => (
                <ProgramCard key={p.id} program={p} onOpen={() => navigate(`/app/plans/${p.id}`)} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader label="Day plans" meta="Calendar" onMeta={() => navigate('/app/calendar')} />
        {recs.isLoading ? <Skeleton className="h-24" rounded="xl" /> : null}
        {recs.isError ? <ErrorState message="We couldn’t load your day plans." onRetry={() => recs.refetch()} /> : null}
        {!recs.isLoading && !recs.isError && !activeRecs.length && !pastRecs.length ? (
          <EmptyState compact icon={Dumbbell} title="No day plans yet" message="Ask Migo for today’s workout or a meal plan, or build a week from the calendar." />
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {activeRecs.map(r => (
            <RecRow key={r.id} rec={r} onOpen={() => setOpen(r)} />
          ))}
        </div>
        {pastRecs.length ? (
          <>
            <Text variant="label" tone="muted" className="mt-1 flex items-center gap-2">
              <History size={14} /> Past day plans
            </Text>
            <div className="grid gap-3 lg:grid-cols-2">
              {pastRecs.map(r => (
                <RecRow key={r.id} rec={r} onOpen={() => setOpen(r)} />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <RecommendationSheet
        recommendation={open}
        onClose={() => setOpen(null)}
        onChanged={next => {
          setOpen(next);
          void invalidate();
        }}
      />
    </div>
  );
}

function RecRow({ rec, onOpen }: { rec: Recommendation; onOpen: () => void }) {
  const m = planMeta(rec);
  const diet = rec.type === 'diet';
  const rest = !diet && isRestDay(rec);
  return (
    <Card onClick={onOpen} aria-label={m.title}>
      <div className="flex items-center gap-4">
        <span className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full ${diet || rest ? 'bg-surface-sunken text-ink' : 'bg-accent-soft text-accent-text'}`}>
          {diet ? <Utensils size={20} /> : rest ? <Moon size={20} /> : <Dumbbell size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <Text variant="labelSm" tone={rec.is_completed ? 'subtle' : 'accent'}>
            {rest ? 'rest' : (rec.type || 'plan').replace(/_/g, ' ')} · {rec.date_for ? formatDay(rec.date_for) : ''}
          </Text>
          <Text variant="title" truncate>
            {m.title}
          </Text>
          {m.exercises.length ? (
            <Text variant="footnote" tone="muted">
              {m.exercises.length} moves
            </Text>
          ) : null}
        </div>
        {rec.is_completed ? <Badge label="Done" tone="success" dot /> : null}
        <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
      </div>
    </Card>
  );
}
