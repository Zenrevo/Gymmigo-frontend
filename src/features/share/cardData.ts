import { format } from 'date-fns';
import { activityOf, defaultActivityTitle, type ActivityType } from '../activity/activityTypes';
import type { RunRecord } from '../activity/types';
import { thinLatLngs, type LatLng, type ShareCardData } from './shareModel';

/** GPS points grouped by pause segment, so the card never draws a line across a pause. */
export function routeSegments(run: Pick<RunRecord, 'coordinates'>): LatLng[][] {
  const out: LatLng[][] = [];
  let seg = Number.NaN;
  for (const p of run.coordinates ?? []) {
    if (p.segment !== seg) {
      out.push([]);
      seg = p.segment;
    }
    out[out.length - 1].push([p.latitude, p.longitude]);
  }
  return out.filter(s => s.length >= 2);
}

const dateLabel = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'EEE d MMM · h:mm a');
};

export function cardFromRun(run: RunRecord, avgBpm: number | null = null): ShareCardData {
  const type = activityOf(run);
  return {
    kind: 'activity',
    title: run.title?.trim() || defaultActivityTitle(type, new Date(run.startedAt)),
    activityType: type,
    dateLabel: dateLabel(run.startedAt),
    startedAt: run.startedAt,
    distanceMeters: run.distanceMeters,
    durationSeconds: run.durationSeconds,
    avgPaceSecPerKm: run.avgPaceSecPerKm,
    caloriesKcal: run.caloriesKcal,
    elevationGainMeters: run.elevationGainMeters,
    avgBpm,
    segments: routeSegments(run),
    splits: run.splits ?? [],
    surface: run.surface,
    runClientId: run.clientId,
  };
}

/** Today's totals from the runs list, with a thinned route per GPS activity for the mini maps. */
export function cardFromDay(runs: RunRecord[], day: Date = new Date()): ShareCardData {
  const key = format(day, 'yyyy-MM-dd');
  const today = runs.filter(r => format(new Date(r.startedAt), 'yyyy-MM-dd') === key).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const sum = (f: (r: RunRecord) => number) => today.reduce((n, r) => n + (f(r) || 0), 0);
  const counts = new Map<ActivityType, number>();
  today.forEach(r => counts.set(activityOf(r), (counts.get(activityOf(r)) ?? 0) + 1));
  const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'run';
  return {
    kind: 'day',
    title: 'My day on Gymmigo',
    activityType: main,
    dateLabel: format(day, 'EEEE d MMMM'),
    startedAt: today[0]?.startedAt ?? null,
    distanceMeters: sum(r => r.distanceMeters),
    durationSeconds: sum(r => r.durationSeconds),
    avgPaceSecPerKm: null,
    caloriesKcal: sum(r => r.caloriesKcal),
    elevationGainMeters: sum(r => r.elevationGainMeters),
    avgBpm: null,
    segments: [],
    splits: [],
    shareDate: key,
    activities: today.map(r => ({
      activityType: activityOf(r),
      distanceMeters: r.distanceMeters,
      durationSeconds: r.durationSeconds,
      route: thinLatLngs(routeSegments(r).flat(), 64),
    })),
  };
}

/** Body for POST /shares, honouring the privacy trim. */
export function shareRequestBody(data: ShareCardData, route: LatLng[][], imageUrl: string | null, showHeartRate: boolean) {
  return {
    kind: data.kind,
    run_client_id: data.kind === 'activity' ? data.runClientId ?? null : null,
    share_date: data.kind === 'day' ? data.shareDate ?? null : null,
    title: data.title.slice(0, 80),
    image_url: imageUrl,
    stats: {
      activity_type: data.activityType,
      distance_meters: Math.round(data.distanceMeters),
      duration_seconds: Math.round(data.durationSeconds),
      avg_pace_sec_per_km: data.avgPaceSecPerKm != null ? Math.round(data.avgPaceSecPerKm) : null,
      calories_kcal: Math.round(data.caloriesKcal),
      elevation_gain_meters: Math.round(data.elevationGainMeters),
      started_at: data.startedAt,
      activities: data.activities?.length ?? 1,
      avg_bpm: showHeartRate && data.avgBpm ? Math.round(data.avgBpm) : null,
    },
    route: route.length ? thinLatLngs(route.flat()) : null,
  };
}
