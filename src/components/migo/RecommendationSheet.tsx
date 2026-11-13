import { useEffect, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Clock, Layers, MapPin, Play, RefreshCw, Sparkles, Timer, Trophy, type LucideIcon } from 'lucide-react';
import { Badge, Button, Sheet, SignatureCard, Text, TextArea, useToast } from '../kit';
import { aiApi, programError } from '../../api/ai';
import { exerciseExtras, planMeta, setsReps } from '../../lib/migo/planFields';
import { formatDay } from '../../lib/migo/dates';
import type { Recommendation, RecommendationExercise } from '../../types/ai';
import { Markdown } from './Markdown';
import { ExerciseImage, ExercisePreview } from './MediaStrips';
import { exerciseMeta, mediaUrl, youtubeUrl } from '../../lib/migo/media';

type Mode = 'view' | 'regen' | 'complete';
type Tile = { icon: LucideIcon; label: string; value: string; sub?: string | null };

/** A day plan: session header, movement sequence, coach notes, regenerate or log completion (app RecommendationSheet). */
export function RecommendationSheet({
  recommendation: rec,
  onClose,
  onChanged,
  label,
}: {
  recommendation: Recommendation | null;
  onClose: () => void;
  onChanged?: (rec: Recommendation | null) => void;
  /** e.g. "Day 5 of 30 · Strength block" for program days. */
  label?: string | null;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('view');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<RecommendationExercise | null>(null);

  useEffect(() => {
    setMode('view');
    setFeedback('');
  }, [rec?.id]);

  if (!rec) return null;
  const m = planMeta(rec);
  const date = rec.date_for?.slice(0, 10);
  const isToday = date === new Date().toISOString().slice(0, 10);

  const run = async (action: 'regen' | 'complete') => {
    setBusy(true);
    try {
      const next = action === 'regen' ? await aiApi.regenerate(rec.id, feedback.trim()) : await aiApi.complete(rec.id, feedback.trim());
      toast({ tone: 'success', title: action === 'regen' ? 'Plan rebuilt' : 'Crushed it!', message: action === 'regen' ? 'Migo rebuilt this plan with your feedback.' : 'Session logged to your plan.' });
      setMode('view');
      setFeedback('');
      onChanged?.(next ?? null);
    } catch (e) {
      toast({ tone: 'error', title: 'Something went wrong', message: programError(e) });
    } finally {
      setBusy(false);
    }
  };

  const tiles = [
    m.intensity || m.rpe ? { icon: Activity, label: 'Intensity', value: m.rpe ? `RPE ${m.rpe}` : String(m.intensity) } : null,
    m.duration ? { icon: Timer, label: 'Est. duration', value: m.duration } : null,
    m.exercises.length ? { icon: Layers, label: 'Total blocks', value: `${m.exercises.length} moves` } : null,
    m.score != null ? { icon: Trophy, label: 'Score', value: String(m.score), sub: m.scoreLabel } : null,
  ].filter(Boolean) as Tile[];

  const footer =
    mode !== 'view' ? (
      <div className="flex flex-col gap-2">
        <TextArea
          label={mode === 'regen' ? 'What should change?' : 'How did it go?'}
          optional
          placeholder={mode === 'regen' ? 'Shorter session, no jumping, more legs…' : 'Felt strong, last set was tough…'}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <Button label={mode === 'regen' ? 'Rebuild plan' : 'Log completion'} loading={busy} onClick={() => run(mode)} fullWidth />
        <Button label="Back" variant="ghost" onClick={() => setMode('view')} disabled={busy} fullWidth />
      </div>
    ) : rec.is_completed ? (
      <div className="flex items-center justify-center gap-2 rounded-gm-lg bg-success-soft p-4 text-success">
        <CheckCircle2 size={18} />
        <Text variant="bodyStrong" tone="success">
          Session completed
        </Text>
      </div>
    ) : (
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button label={m.isWorkout ? 'Start workout & log' : 'Log this plan'} iconRight={ArrowRight} onClick={() => setMode('complete')} fullWidth />
        <Button label="Swap / regenerate" variant="secondary" icon={RefreshCw} onClick={() => setMode('regen')} fullWidth />
      </div>
    );

  const tag = [(rec.type ?? 'plan').replace(/_/g, ' '), date ? formatDay(date) : null].filter(Boolean).join(' · ');

  return (
    <>
      <Sheet open={!!rec && !preview} onClose={onClose} eyebrow={isToday ? 'Today’s prescribed session' : 'Prescribed session'} footer={footer} size="lg">
        <div className="flex flex-col gap-5">
          <SignatureCard padding="lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Text variant="labelSm" tone="accent" truncate className="flex-1">
                  {tag}
                </Text>
                {rec.is_completed ? <Badge label="Completed" tone="success" dot /> : (rec.generation_count ?? 0) > 1 ? <Badge label="Regenerated" tone="info" /> : null}
              </div>
              <Text variant="h1">{m.title}</Text>
              {label ? (
                <Text variant="footnote" tone="muted">
                  {label}
                </Text>
              ) : null}
              {m.location ? (
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <MapPin size={14} />
                  <Text variant="footnote" tone="muted" truncate>
                    {m.location}
                  </Text>
                </span>
              ) : null}
              {tiles.length ? (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {tiles.map(t => (
                    <div key={t.label} className="flex items-center gap-2 rounded-gm-md bg-surface-raised p-2.5">
                      <t.icon size={18} className="shrink-0 text-accent" />
                      <div className="min-w-0">
                        <Text variant="labelSm" tone="subtle" truncate>
                          {t.label}
                        </Text>
                        <Text variant="subtitle" truncate>
                          {t.value}
                          {t.sub ? <span className="t-caption text-accent-text">{`  ${t.sub}`}</span> : null}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {m.description ? (
                <div className="mt-1 flex items-start gap-3 rounded-gm-md bg-surface p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Sparkles size={14} />
                  </span>
                  <Text variant="callout" tone="muted">
                    {m.description}
                  </Text>
                </div>
              ) : null}
            </div>
          </SignatureCard>

          {m.exercises.length ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Text variant="h2" className="flex-1">
                  Movement sequence
                </Text>
                <Badge label={`${m.exercises.length} ${m.exercises.length === 1 ? 'move' : 'moves'}`} tone="accent" />
              </div>
              {m.exercises.map((e, i) => (
                <ExerciseCard key={`${e.name}-${i}`} e={e} index={i} onOpen={() => setPreview(e)} />
              ))}
            </section>
          ) : null}

          {rec.content ? (
            <section className="flex flex-col gap-2">
              <Text variant="label" tone="subtle">
                Coach notes
              </Text>
              <Markdown content={rec.content} />
            </section>
          ) : null}
        </div>
      </Sheet>
      <ExercisePreview exercise={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function ExerciseCard({ e, index, onOpen }: { e: RecommendationExercise; index: number; onOpen: () => void }) {
  const meta = exerciseMeta(e);
  const x = exerciseExtras(e);
  const hasDemo = !!(mediaUrl(e) || youtubeUrl(e));
  return (
    <button type="button" onClick={onOpen} className="flex flex-col gap-3 rounded-gm-xl border border-border bg-surface p-3 text-left transition hover:bg-surface-sunken">
      <div className="flex items-center gap-3">
        <div className="relative">
          <ExerciseImage src={mediaUrl(e)} className="h-20 w-20 rounded-gm-md" />
          <span className="t-label-sm absolute bottom-1 right-1 rounded bg-surface-sunken px-1 text-ink">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="min-w-0 flex-1">
          {meta.target ? (
            <Text variant="labelSm" tone="accent" truncate>
              {meta.target}
            </Text>
          ) : null}
          <Text variant="title" className="line-clamp-2">
            {e.name}
          </Text>
          {meta.equipment ? (
            <Text variant="caption" tone="muted" truncate>
              {meta.equipment}
              {x.load ? ` · @ ${x.load}` : ''}
            </Text>
          ) : null}
          {setsReps(e) ? <p className="font-display mt-0.5 text-lg font-bold text-accent-text">{setsReps(e)}</p> : null}
        </div>
      </div>
      {x.rest || x.tempo || hasDemo ? (
        <div className="flex items-center gap-3">
          {x.rest ? (
            <span className="flex items-center gap-1 text-ink-muted">
              <Clock size={13} className="text-accent" />
              <Text variant="caption" tone="muted">
                {x.rest}
              </Text>
            </span>
          ) : null}
          <span className="flex-1" />
          {x.tempo ? (
            <Text variant="labelSm" tone="accent">
              Tempo {x.tempo}
            </Text>
          ) : hasDemo ? (
            <span className="flex items-center gap-1 text-accent-text">
              <Play size={12} />
              <Text variant="labelSm" tone="accent">
                Watch demo
              </Text>
            </span>
          ) : null}
        </div>
      ) : null}
      {x.notes ? (
        <div className="flex items-start gap-2 rounded-gm-md bg-surface-sunken p-2.5">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
          <Text variant="footnote" tone="muted">
            {x.notes}
          </Text>
        </div>
      ) : null}
    </button>
  );
}
