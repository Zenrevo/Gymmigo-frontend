import { useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button, Chip, EmptyState, ErrorState, ListGroup, PageHeader, SectionHeader, Skeleton } from '../../components/kit';
import { activityOf } from '../../features/activity/activityTypes';
import { useActivities } from '../../hooks/useActivities';
import { ActivityRow, TrackInAppCard } from './activityUi';
import { PaceTrendCard, SportBreakdownCard, WeekTiles, WeeklyDistanceCard } from './SportsStats';

type Filter = 'all' | 'run' | 'walk' | 'cycle' | 'other';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'run', label: 'Runs' },
  { value: 'walk', label: 'Walks' },
  { value: 'cycle', label: 'Rides' },
  { value: 'other', label: 'Other sports' },
];

/** The app's Activity hub on the web: totals, analytics and history. Tracking itself happens in the app. */
export default function ActivityHubPage() {
  const { data = [], isLoading, isError, refetch } = useActivities();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = useMemo(
    () =>
      data.filter(r => {
        const t = activityOf(r);
        if (filter === 'all') return true;
        if (filter === 'other') return !['run', 'walk', 'cycle'].includes(t);
        return t === filter;
      }),
    [data, filter],
  );
  const hasToday = data.some(r => new Date(r.startedAt).toDateString() === new Date().toDateString());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Sports"
        title="Activity"
        subtitle="Your runs, walks, rides and sports in one place."
        actions={hasToday ? <Button label="Share today" icon={Share2} variant="secondary" size="md" to="/app/activity/share?day=today" /> : null}
      />
      <TrackInAppCard />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Couldn't load your activities" message="Check your connection and try again." onRetry={() => refetch()} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <SectionHeader label="This week" />
            <WeekTiles list={data} />
          </section>
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
            <SectionHeader label="History" meta={`${shown.length} ${shown.length === 1 ? 'activity' : 'activities'}`} />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter activities">
              {FILTERS.map(f => (
                <Chip key={f.value} label={f.label} selected={filter === f.value} onClick={() => setFilter(f.value)} />
              ))}
            </div>
            {shown.length ? (
              <ListGroup>
                {shown.map(r => (
                  <ActivityRow key={r.id ?? r.clientId} run={r} />
                ))}
              </ListGroup>
            ) : (
              <EmptyState
                title={data.length ? 'Nothing in this filter' : 'No activities yet'}
                message={data.length ? 'Try another filter.' : 'Record a run, walk or ride with the Gymmigo app and it appears here.'}
                compact
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
