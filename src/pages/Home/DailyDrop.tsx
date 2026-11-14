import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Dumbbell, Target, Utensils, Zap } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, SectionHeader, Sheet, Skeleton, Text, TextField, useToast } from '../../components/kit';
import api, { getApiErrorMessage } from '../../utils/api';

type Plan = {
  id: string;
  type: 'workout' | 'diet' | string;
  title?: string;
  date_for: string;
  duration?: number | string;
  intensity?: string;
  is_completed?: boolean;
  structured_data?: { focus?: string; description?: string; duration?: number | string; intensity?: string };
};

const todayStr = () => new Date().toISOString().split('T')[0];
const MOTIVATION = [
  { v: 1, label: 'Low' },
  { v: 2, label: 'Meh' },
  { v: 3, label: 'Okay' },
  { v: 4, label: 'Good' },
  { v: 5, label: 'Fired up' },
];

/** Migo AI "Daily Drop" on the member Home: today's saved AI plans, or a quick check-in that builds one. */
export default function DailyDrop() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState('45');
  const [motivation, setMotivation] = useState(3);

  const profile = useQuery({
    queryKey: ['profile', 'fitness'],
    queryFn: async () => {
      try {
        const res = await api.get('/profile/fitness');
        return Boolean(res.data?.success && res.data?.data?.primary_goal);
      } catch {
        return false;
      }
    },
    staleTime: 5 * 60_000,
  });
  const plans = useQuery({
    queryKey: ['ai', 'recommendations', todayStr()],
    queryFn: async () => {
      const d = todayStr();
      const res = await api.get('/ai/recommendations', { params: { start_date: d, end_date: d } });
      return ((res.data?.data ?? []) as Plan[]).filter(p => p.date_for === d);
    },
    enabled: profile.data === true,
  });
  const generate = useMutation({
    mutationFn: () => api.post('/ai/generate-workout', { time_available: parseInt(minutes) || 45, motivation_level: motivation }, { timeout: 60_000 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'recommendations'] });
      setOpen(false);
      toast({ tone: 'success', title: "Today's drop is ready" });
    },
    onError: e => toast({ tone: 'danger', title: 'Could not build the drop', message: getApiErrorMessage(e) }),
  });

  const loading = profile.isLoading || (profile.data && plans.isLoading);

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader label="Daily drop" meta={<Badge label="Migo AI" tone="accent" />} />
      {loading ? (
        <Skeleton className="h-36" />
      ) : !profile.data ? (
        <Card padding="lg">
          <EmptyState icon={Target} title="Set up your fitness profile" message="Migo AI uses your goal and level to build a personal drop every day." actionLabel="Set up profile" actionTo="/app/profile" compact />
        </Card>
      ) : plans.data?.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plans.data.map(p => {
            const workout = p.type === 'workout';
            const dur = p.structured_data?.duration ?? p.duration;
            const intensity = p.structured_data?.intensity ?? p.intensity;
            return (
              <Card key={p.id} padding="lg" className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md ${workout ? 'bg-accent-soft text-accent-text' : 'bg-success-soft text-success'}`}>
                    {workout ? <Dumbbell size={20} /> : <Utensils size={20} />}
                  </span>
                  <div className="min-w-0">
                    <Text variant="label" tone={workout ? 'accent' : 'success'}>
                      {workout ? 'Workout' : 'Fuel check'}
                    </Text>
                    <Text variant="title" className="truncate">
                      {p.structured_data?.focus || p.title}
                    </Text>
                  </div>
                </div>
                <Text variant="footnote" tone="muted" className="line-clamp-2">
                  {p.structured_data?.description || 'Open Migo for the full plan.'}
                </Text>
                <div className="flex flex-wrap gap-2">
                  {dur ? <Badge label={`${dur} min`} /> : null}
                  {intensity ? <Badge label={String(intensity)} tone="accent" /> : null}
                  {p.is_completed ? <Badge label="Done" tone="success" /> : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg" className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">
            <Zap size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <Text variant="title">No drop yet today</Text>
            <Text variant="footnote" tone="muted">
              Tell Migo how much time and energy you have and it builds today's workout.
            </Text>
          </div>
          <Button label="Build drop" icon={Zap} size="md" onClick={() => setOpen(true)} />
        </Card>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Migo AI"
        title="Quick check-in"
        size="sm"
        footer={<Button label={generate.isPending ? 'Building…' : 'Build my drop'} icon={CheckCircle2} onClick={() => generate.mutate()} loading={generate.isPending} className="w-full" />}
      >
        <div className="flex flex-col gap-5">
          <TextField label="Time available (minutes)" type="number" inputMode="numeric" min={10} max={180} value={minutes} onChange={e => setMinutes(e.target.value)} />
          <div className="flex flex-col gap-2">
            <Text variant="label" tone="muted">
              Energy level
            </Text>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Energy level">
              {MOTIVATION.map(m => (
                <Chip key={m.v} label={m.label} selected={motivation === m.v} onClick={() => setMotivation(m.v)} />
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </section>
  );
}
