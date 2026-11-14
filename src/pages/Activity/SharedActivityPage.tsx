import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, EmptyState, PageHeader, Skeleton, StatTile, Text } from '../../components/kit';
import { sharesApi } from '../../api/shares';
import { activityMeta, isActivityType, speedKmh } from '../../features/activity/activityTypes';
import { formatDuration, formatKm, formatPace } from '../../features/activity/runMath';
import { safeShareToken } from '../../features/share/shareModel';
import { RouteMap } from './activityUi';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** In-app viewer for a shared activity link (`/s/{token}` is the public page the backend serves). */
export default function SharedActivityPage() {
  const token = safeShareToken(useParams().token ?? '');
  const { data, isLoading, isError } = useQuery({ queryKey: ['share', token], queryFn: () => sharesApi.get(token), enabled: !!token, retry: false });

  if (isLoading) return <Skeleton className="h-[480px]" />;
  if (!token || isError || !data) {
    return <EmptyState title="This share isn't available" message="The link may be wrong, or the owner removed it." actionLabel="Go to Activity" actionTo="/app/activity" />;
  }

  const s = data.stats;
  const type = isActivityType(s.activity_type) ? s.activity_type : 'run';
  const meta = activityMeta(type);
  const meters = num(s.distance_meters);
  const seconds = num(s.duration_seconds);
  const pace = typeof s.avg_pace_sec_per_km === 'number' ? s.avg_pace_sec_per_km : null;
  const coordinates = (data.route ?? []).map(([lat, lng], i) => ({ latitude: lat, longitude: lng, timestamp: i, t: i, segment: 0 }));
  const who = data.owner.first_name || 'A Gymmigo member';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={data.kind === 'day' ? 'Shared day' : `Shared ${meta.noun}`}
        title={data.title}
        actions={<Button label="Your activities" size="md" variant="secondary" to="/app/activity" />}
      />
      <Card padding="md" className="flex items-center gap-3">
        <Avatar name={who} src={data.owner.avatar_url ?? undefined} size={40} />
        <Text variant="bodyStrong">{who}</Text>
      </Card>
      {coordinates.length >= 2 ? <RouteMap run={{ coordinates }} /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {meters > 0 ? <StatTile label="Distance" value={formatKm(meters)} unit="km" size="lg" emphasis /> : null}
        <StatTile label="Time" value={formatDuration(seconds)} size="lg" />
        {meters > 0 ? (
          meta.showsSpeed ? (
            <StatTile label="Speed" value={(speedKmh(meters, seconds) ?? 0).toFixed(1)} unit="km/h" size="lg" />
          ) : (
            <StatTile label="Pace" value={formatPace(pace)} unit="/km" size="lg" />
          )
        ) : null}
        {num(s.calories_kcal) > 0 ? <StatTile label="Calories" value={Math.round(num(s.calories_kcal))} unit="kcal" size="lg" /> : null}
      </div>
    </div>
  );
}
