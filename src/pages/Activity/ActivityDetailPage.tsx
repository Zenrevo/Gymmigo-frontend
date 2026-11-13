import { format } from 'date-fns';
import { Share2, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, ErrorState, PageHeader, SectionHeader, Skeleton, StatTile, Text, confirmDialog, useToast } from '../../components/kit';
import { activityMeta, activityOf, defaultActivityTitle, speedKmh } from '../../features/activity/activityTypes';
import { formatDuration, formatKm, formatPace } from '../../features/activity/runMath';
import { useActivity, useDeleteActivity } from '../../hooks/useActivities';
import { getApiErrorMessage } from '../../utils/api';
import { ACTIVITY_ICON } from './activityFormat';
import { RouteMap } from './activityUi';

/** One activity: route on the map, headline stats, km splits, laps-free (laps stay on the phone), share and delete. */
export default function ActivityDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: run, isLoading, isError, refetch } = useActivity(id);
  const remove = useDeleteActivity();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-80" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (isError || !run) return <ErrorState title="Activity not found" message="It may have been deleted." onRetry={() => refetch()} />;

  const type = activityOf(run);
  const meta = activityMeta(type);
  const Icon = ACTIVITY_ICON[type];
  const title = run.title?.trim() || defaultActivityTitle(type, new Date(run.startedAt));
  const hasDistance = meta.distance && run.distanceMeters > 0;
  const fastest = run.splits.filter(s => s.distanceMeters >= 1000).reduce((m, s) => Math.min(m, s.paceSecPerKm), Infinity);

  const onDelete = async () => {
    const ok = await confirmDialog({ title: 'Delete this activity?', message: 'It is removed from your history on every device.', confirmLabel: 'Delete', tone: 'danger' });
    if (!ok) return;
    try {
      await remove.mutateAsync(run.id ?? run.clientId);
      toast({ tone: 'success', title: 'Activity deleted' });
      navigate('/app/activity', { replace: true });
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not delete', message: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Icon size={14} /> {meta.label}
          </span>
        }
        title={title}
        subtitle={`${format(new Date(run.startedAt), 'EEEE d MMMM yyyy · h:mm a')}${run.surface && type === 'run' && run.surface !== 'road' ? ` · ${run.surface}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button label="Share" icon={Share2} size="md" to={`/app/activity/${encodeURIComponent(id)}/share`} />
            <Button label="Delete" icon={Trash2} size="md" variant="ghost" onClick={onDelete} loading={remove.isPending} />
          </div>
        }
      />

      <RouteMap run={run} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {hasDistance ? <StatTile label="Distance" value={formatKm(run.distanceMeters)} unit="km" size="lg" emphasis /> : null}
        <StatTile label="Moving time" value={formatDuration(run.durationSeconds)} caption={run.elapsedSeconds > run.durationSeconds + 30 ? `Total ${formatDuration(run.elapsedSeconds)}` : undefined} size="lg" />
        {hasDistance ? (
          meta.showsSpeed ? (
            <StatTile label="Avg speed" value={(speedKmh(run.distanceMeters, run.durationSeconds) ?? 0).toFixed(1)} unit="km/h" size="lg" />
          ) : (
            <StatTile
              label="Avg pace"
              value={formatPace(run.avgPaceSecPerKm)}
              unit="/km"
              caption={Number.isFinite(fastest) ? `Best km ${formatPace(fastest)}` : undefined}
              captionTone="success"
              size="lg"
            />
          )
        ) : null}
        <StatTile
          label="Energy"
          value={Math.round(run.caloriesKcal)}
          unit="kcal"
          caption={run.elevationGainMeters > 0 ? `Est. · +${Math.round(run.elevationGainMeters)} m climb` : 'Estimated'}
          size="lg"
        />
      </div>

      {run.splits.length ? (
        <section className="flex flex-col gap-3">
          <SectionHeader label="Kilometre splits" meta={run.elevationGainMeters > 0 ? `Elevation gain +${Math.round(run.elevationGainMeters)} m` : undefined} />
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="t-label-sm text-ink-subtle">
                  <th className="px-4 py-3 font-semibold">Split</th>
                  <th className="px-4 py-3 font-semibold">Pace</th>
                  <th className="w-1/2 px-4 py-3 font-semibold">Rhythm</th>
                  <th className="px-4 py-3 text-right font-semibold">Elev</th>
                </tr>
              </thead>
              <tbody>
                {run.splits.map(s => {
                  const full = s.distanceMeters >= 1000;
                  const best = full && s.paceSecPerKm === fastest;
                  const slowest = Math.max(...run.splits.map(x => x.paceSecPerKm));
                  const w = 30 + 70 * (1 - (s.paceSecPerKm - (Number.isFinite(fastest) ? fastest : s.paceSecPerKm)) / Math.max(1, slowest - fastest));
                  return (
                    <tr key={s.km} className="border-t border-border">
                      <td className="t-body-strong px-4 py-3">{full ? s.km : (s.distanceMeters / 1000).toFixed(2)}</td>
                      <td className={`t-body-strong px-4 py-3 ${best ? 'text-accent-text' : ''}`}>{formatPace(s.paceSecPerKm)}</td>
                      <td className="px-4 py-3">
                        <div className="h-2 rounded-full bg-surface-sunken">
                          <div className={`h-full rounded-full ${best ? 'bg-accent' : full ? 'bg-ink-subtle' : 'bg-success'}`} style={{ width: `${Math.min(100, Math.max(8, w))}%` }} />
                        </div>
                      </td>
                      <td className="t-callout px-4 py-3 text-right text-ink-muted">+{Math.round(s.elevationGainMeters)} m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      ) : null}

      {run.notes || run.perceivedEffort ? (
        <Card padding="lg" className="flex flex-col gap-2">
          {run.perceivedEffort ? <Badge label={`Effort ${run.perceivedEffort}/10`} tone="accent" /> : null}
          {run.notes ? <Text>{run.notes}</Text> : null}
        </Card>
      ) : null}

      <Text variant="caption" tone="subtle">
        Heart rate and laps from your watch are shown in the Gymmigo app.
      </Text>
    </div>
  );
}
