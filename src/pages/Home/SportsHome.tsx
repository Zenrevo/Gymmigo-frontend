import { useQuery } from '@tanstack/react-query';
import { Activity, Bike, Footprints, ShieldCheck, Share2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ListGroup, SectionHeader, Skeleton, Text } from '../../components/kit';
import { useActivities } from '../../hooks/useActivities';
import api from '../../utils/api';
import { ActivityRow, TrackInAppCard } from '../Activity/activityUi';
import { PaceTrendCard, SportBreakdownCard, WeekTiles, WeeklyDistanceCard } from '../Activity/SportsStats';

type ClubToday = { runners: number; sessions: number; distance_meters: number } | null;
type ClubRoom = { id: string; title: string; today: ClubToday };

/** Gymmigo Run Club: today's runners and distance, linking to the live club map. */
export function RunClubCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['run-club', 'summary'],
    queryFn: async () => (await api.get('/run-rooms/club')).data?.data as ClubRoom,
    staleTime: 60_000,
    retry: false,
  });
  const today = data?.today;
  return (
    <Card padding="lg" className="flex flex-col gap-4 border-accent-border">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-gm-md bg-accent-soft text-accent-text">
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Text variant="title">Gymmigo Run Club</Text>
            <Badge label="Official" tone="accent" />
          </div>
          <Text variant="footnote" tone="muted">
            Open to everyone. Run any time; a fresh map every day.
          </Text>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-16" />
      ) : isError ? null : (
        <div className="grid grid-cols-2 gap-2 rounded-gm-md bg-surface-sunken p-3">
          <div className="text-center">
            <p className="t-title">{today?.runners ?? 0}</p>
            <p className="t-caption text-ink-muted">runners today</p>
          </div>
          <div className="text-center">
            <p className="t-title">{((today?.distance_meters ?? 0) / 1000).toFixed(2)}</p>
            <p className="t-caption text-ink-muted">km today</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button label="Open today's map" size="md" to="/app/run-club" />
        <Button label="Run together" size="md" variant="secondary" to="/app/run-together" />
      </div>
    </Card>
  );
}

/** Sports mode of the member Home, mirroring the app's sports dashboard. */
export default function SportsHome() {
  const { data = [], isLoading } = useActivities();
  const hasToday = data.some(r => new Date(r.startedAt).toDateString() === new Date().toDateString());
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <SectionHeader label="This week" meta={<Button label="Activity hub" size="sm" variant="ghost" to="/app/activity" />} />
        {isLoading ? <Skeleton className="h-24" /> : <WeekTiles list={data} />}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader label="Start" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Activity, label: 'Run' },
            { icon: Footprints, label: 'Walk' },
            { icon: Bike, label: 'Ride' },
          ].map(a => (
            <a key={a.label} href="#track-in-app" className="flex flex-col items-center gap-2 rounded-gm-lg border border-border bg-surface px-3 py-4 transition-colors hover:border-border-strong">
              <a.icon size={22} className="text-accent-text" />
              <span className="t-label">{a.label}</span>
            </a>
          ))}
        </div>
        <div id="track-in-app">
          <TrackInAppCard />
        </div>
      </section>

      <RunClubCard />

      {data.length ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <WeeklyDistanceCard list={data} />
          <SportBreakdownCard list={data} />
          <div className="lg:col-span-2">
            <PaceTrendCard list={data} />
          </div>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <SectionHeader
          label="Recent activities"
          meta={
            <span className="flex gap-1">
              {hasToday ? <Button label="Share today" icon={Share2} size="sm" variant="ghost" to="/app/activity/share?day=today" /> : null}
              <Button label="See all" size="sm" variant="ghost" to="/app/activity" />
            </span>
          }
        />
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : data.length ? (
          <ListGroup>
            {data.slice(0, 5).map(r => (
              <ActivityRow key={r.id ?? r.clientId} run={r} />
            ))}
          </ListGroup>
        ) : (
          <EmptyState title="No activities yet" message="Runs, walks and rides you record in the app show up here." compact />
        )}
      </section>
    </div>
  );
}
