import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Sparkles } from 'lucide-react';
import { AppBar, Button, Card, Chip, DateField, SegmentedControl, Spinner, Text, TextArea, TimeField, Toggle } from '../../components/kit';
import { aiApi, programError } from '../../api/ai';
import { addDaysIso, durationLabel, localDay } from '../../lib/migo/programLogic';
import { invalidatePrograms, programKeys } from '../../hooks/usePrograms';
import { PROGRAM_DURATIONS, type ProgramDuration, type ProgramKind } from '../../types/programs';

const DAYS_PER_WEEK = [2, 3, 4, 5, 6, 7];
const MINUTES = [20, 30, 45, 60, 90];
const STEPS = ['Reading your profile and history', 'Laying out the phases', 'Planning every day', 'Balancing training and recovery'];

/** New multi-day plan: choices, then Migo drafts an outline to review before anything lands in the calendar. */
export default function ProgramCreatePage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const today = useMemo(() => localDay(new Date()), []);
  const [duration, setDuration] = useState<ProgramDuration>(30);
  const [kind, setKind] = useState<ProgramKind>('workout');
  const [startDate, setStartDate] = useState(() => addDaysIso(today, 1));
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [minutes, setMinutes] = useState(45);
  const [remind, setRemind] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const p = await aiApi.createProgram({
        kind,
        duration_days: duration,
        start_date: startDate,
        goal_note: note.trim() || undefined,
        days_per_week: kind === 'diet' ? undefined : daysPerWeek,
        minutes_per_session: kind === 'diet' ? undefined : minutes,
        reminder_time: remind ? reminderTime : undefined,
      });
      client.setQueryData(programKeys.detail(p.id), p);
      await invalidatePrograms(client);
      navigate(`/app/plans/${p.id}/review`, { replace: true });
    } catch (e) {
      setError(programError(e) || 'Migo couldn’t draft the plan. Please try again.');
      setBusy(false);
    }
  };

  if (busy) return <Generating duration={duration} />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <AppBar caption="Migo plans" title="New plan" backTo="/app/assistant?tab=plans" />

      <Field label="How long">
        <div className="flex flex-wrap gap-2">
          {PROGRAM_DURATIONS.map(d => (
            <Chip key={d} label={durationLabel(d)} selected={duration === d} onClick={() => setDuration(d)} />
          ))}
        </div>
      </Field>

      <Field label="What to plan">
        <SegmentedControl<ProgramKind>
          aria-label="What to plan"
          options={[
            { value: 'workout', label: 'Workout' },
            { value: 'diet', label: 'Diet' },
            { value: 'both', label: 'Both' },
          ]}
          value={kind}
          onChange={setKind}
        />
      </Field>

      <DateField label="Start date" value={startDate} onChange={setStartDate} min={today} />

      {kind !== 'diet' ? (
        <>
          <Field label="Training days per week">
            <div className="flex flex-wrap gap-2">
              {DAYS_PER_WEEK.map(d => (
                <Chip key={d} label={String(d)} selected={daysPerWeek === d} onClick={() => setDaysPerWeek(d)} />
              ))}
            </div>
          </Field>
          <Field label="Minutes per session">
            <div className="flex flex-wrap gap-2">
              {MINUTES.map(m => (
                <Chip key={m} label={`${m} min`} selected={minutes === m} onClick={() => setMinutes(m)} />
              ))}
            </div>
          </Field>
        </>
      ) : null}

      <Card padding="lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <Text variant="subtitle">Daily reminder</Text>
              <Text variant="footnote" tone="muted">
                The Gymmigo app nudges you to log the day, so Migo knows where you are.
              </Text>
            </div>
            <Toggle checked={remind} onChange={setRemind} label="Daily reminder" />
          </div>
          {remind ? <TimeField label="Remind me at" value={reminderTime} onChange={setReminderTime} /> : null}
        </div>
      </Card>

      <TextArea
        label="Anything Migo should know?"
        optional
        placeholder="e.g. Half marathon in 10 weeks, sore left knee, vegetarian"
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={500}
        rows={3}
      />

      <div className="flex flex-col gap-2 pb-4">
        {error ? (
          <Text variant="footnote" tone="danger" align="center" role="alert">
            {error}
          </Text>
        ) : null}
        <Button label={`Draft my ${duration === 7 ? '1-week' : `${duration}-day`} plan`} icon={Sparkles} onClick={create} fullWidth size="lg" />
        <Text variant="caption" tone="subtle" align="center">
          You’ll review it before anything is added to your calendar.
        </Text>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {children}
    </div>
  );
}

/** Progress while the outline is generated (up to a minute for 90 days). */
export function Generating({ duration, verb = 'Drafting' }: { duration: number; verb?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(STEPS.length - 1, s + 1)), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" role="status">
      <Spinner size={32} />
      <Text variant="h2" align="center">
        {verb} your {durationLabel(duration)} plan
      </Text>
      <Text tone="muted" align="center">
        {STEPS[step]}… This can take up to a minute.
      </Text>
    </div>
  );
}
