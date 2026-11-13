import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Minus, X, type LucideIcon } from 'lucide-react';
import { AppBar, Button, Card, ErrorState, Skeleton, Text, TextArea, useToast } from '../../components/kit';
import { aiApi, programError } from '../../api/ai';
import { dayDateLabel } from '../../lib/migo/dates';
import { TYPE_LABEL } from '../../lib/migo/programLogic';
import { invalidatePrograms, programKeys, useProgram } from '../../hooks/usePrograms';
import type { ProgramDay, ProgramLogStatus } from '../../types/programs';

const STATUSES: { value: ProgramLogStatus; label: string; hint: string; icon: LucideIcon }[] = [
  { value: 'done', label: 'Done', hint: 'Did it all', icon: Check },
  { value: 'partial', label: 'Partly', hint: 'Some of it', icon: Minus },
  { value: 'skipped', label: 'Skipped', hint: 'Didn’t happen', icon: X },
];

const RPE_HINT = (n: number) => (n <= 3 ? 'Easy' : n <= 6 ? 'Moderate' : n <= 8 ? 'Hard' : 'Max effort');

/** Log one program day (full page, so the keyboard never hides anything). */
export default function ProgramLogDayPage() {
  const { programId = '', day: dayParam = '1' } = useParams();
  const dayNo = Number(dayParam) || 1;
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const q = useProgram(programId);
  const p = q.data;
  const day = p?.days?.find(d => d.day === dayNo) ?? (p?.today?.day === dayNo ? p.today : null);
  const header = <AppBar caption={p ? p.title : 'Plan'} title={`Log day ${dayNo}`} backTo={`/app/plans/${programId}`} />;

  if (q.isError)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {header}
        <ErrorState onRetry={() => q.refetch()} />
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {header}
      {!p ? (
        <Skeleton className="h-64" rounded="xl" />
      ) : (
        <LogForm
          key={`${dayNo}-${day?.log ? 'logged' : 'new'}`}
          day={day}
          onSave={async body => {
            try {
              await aiApi.logProgramDay(programId, dayNo, body);
              await invalidatePrograms(client);
              await client.invalidateQueries({ queryKey: programKeys.detail(programId) });
              toast({ tone: 'success', title: body.status === 'skipped' ? 'Logged as skipped' : 'Day logged', message: 'Migo will adapt the next days.' });
              navigate(`/app/plans/${programId}`, { replace: true });
              return true;
            } catch (e) {
              toast({ tone: 'error', title: 'Couldn’t log the day', message: programError(e) });
              return false;
            }
          }}
        />
      )}
    </div>
  );
}

function LogForm({ day, onSave }: { day: ProgramDay | null; onSave: (body: { status: ProgramLogStatus; rpe?: number; feedback?: string }) => Promise<boolean> }) {
  const [status, setStatus] = useState<ProgramLogStatus>(day?.log?.status ?? 'done');
  const [rpe, setRpe] = useState<number | null>(day?.log?.rpe ?? null);
  const [notes, setNotes] = useState(day?.log?.feedback ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ status, rpe: status === 'skipped' ? undefined : rpe ?? undefined, feedback: notes.trim() || undefined });
    if (!ok) setSaving(false);
  };

  return (
        <>
          {day ? (
            <Card padding="lg" variant="raised">
              <Text variant="labelSm" tone="accent">
                {TYPE_LABEL[day.type]} · {dayDateLabel(day.date)}
              </Text>
              <Text variant="title">{day.title}</Text>
              {day.focus ? (
                <Text variant="footnote" tone="muted">
                  {day.focus}
                </Text>
              ) : null}
            </Card>
          ) : null}

          <section className="flex flex-col gap-3">
            <Text variant="label" tone="muted">
              How did it go?
            </Text>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How did it go?">
              {STATUSES.map(s => {
                const on = status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setStatus(s.value)}
                    className={`flex flex-col items-center gap-1 rounded-gm-lg border p-3 transition ${on ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-sunken'}`}
                  >
                    <s.icon size={20} className={on ? 'text-accent' : 'text-ink-muted'} />
                    <Text variant="subtitle">{s.label}</Text>
                    <Text variant="caption" tone="subtle">
                      {s.hint}
                    </Text>
                  </button>
                );
              })}
            </div>
          </section>

          {status !== 'skipped' ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <Text variant="label" tone="muted">
                  Effort (RPE)
                </Text>
                <Text variant="caption" tone="accent">
                  {rpe ? `${rpe}/10 · ${RPE_HINT(rpe)}` : 'Optional'}
                </Text>
              </div>
              <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Effort from 1 to 10">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rpe === n}
                    onClick={() => setRpe(rpe === n ? null : n)}
                    className={`t-subtitle h-11 rounded-gm-md border transition ${rpe === n ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface text-ink hover:bg-surface-sunken'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <TextArea
            label="Notes for Migo"
            optional
            placeholder={status === 'skipped' ? 'What got in the way?' : 'Felt strong, knee was sore on lunges…'}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            rows={4}
          />

          <Button label={day?.log ? 'Update log' : 'Save log'} onClick={save} loading={saving} fullWidth size="lg" />
        </>
  );
}
