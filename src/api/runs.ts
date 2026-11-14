import api from '../utils/api';
import { isActivityType, type ActivityType } from '../features/activity/activityTypes';
import type { RunPoint, RunRecord, RunSplit } from '../features/activity/types';

/* Runs, walks, rides and logged sports (backend /runs, contract: Gymmigo-app docs/revamp/07-RUN-TRACKING-API.md). */

/** Wire shape (snake_case). Coordinates travel as a GeoJSON LineString plus per-point extras. */
export type RunDto = {
  id: string;
  client_id: string;
  /** Absent on servers older than activity types: 'run'. */
  activity_type?: ActivityType;
  source: 'gps' | 'manual';
  surface: 'road' | 'treadmill' | 'trail' | 'track';
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  elapsed_seconds: number;
  distance_meters: number;
  avg_pace_sec_per_km: number | null;
  best_pace_sec_per_km: number | null;
  calories_kcal: number;
  elevation_gain_meters: number;
  perceived_effort: number | null;
  incline_percent: number | null;
  notes: string | null;
  title: string | null;
  route: { type: 'LineString'; coordinates: [number, number, number?][] } | null;
  route_meta?: { t: number[]; timestamps: number[]; segments: number[]; accuracy: (number | null)[] } | null;
  splits: { km: number; distance_meters: number; duration_seconds: number; pace_sec_per_km: number; elevation_gain_meters: number }[];
  created_at?: string;
};

export type RunListParams = { page?: number; page_size?: number; from?: string; to?: string; /** One type or a comma list. */ activity?: string };
export type RunPage = { items: RunDto[]; page: number; page_size: number; total: number };
export type ActivityTotalsDto = { count: number; distance_meters: number; duration_seconds: number; calories_kcal: number };
export type DailyRunSummaryDto = {
  date: string;
  runs: number;
  distance_meters: number;
  duration_seconds: number;
  calories_kcal: number;
  by_type?: Partial<Record<ActivityType, ActivityTotalsDto>>;
};
export type ActivityTypeSummaryDto = ActivityTotalsDto & { activity_type: ActivityType };

export function fromRunDto(dto: RunDto): RunRecord {
  const line = dto.route?.coordinates ?? [];
  const meta = dto.route_meta;
  const coordinates: RunPoint[] = line.map(([lng, lat, alt], i) => ({
    latitude: lat,
    longitude: lng,
    altitude: alt ?? null,
    accuracy: meta?.accuracy?.[i] ?? null,
    speed: null,
    timestamp: meta?.timestamps?.[i] ?? 0,
    t: meta?.t?.[i] ?? 0,
    segment: meta?.segments?.[i] ?? 0,
  }));
  const splits: RunSplit[] = (dto.splits ?? []).map(s => ({
    km: s.km,
    distanceMeters: s.distance_meters,
    durationSeconds: s.duration_seconds,
    paceSecPerKm: s.pace_sec_per_km,
    elevationGainMeters: s.elevation_gain_meters,
  }));
  return {
    id: dto.id,
    clientId: dto.client_id,
    activityType: isActivityType(dto.activity_type) ? dto.activity_type : 'run',
    source: dto.source,
    surface: dto.surface,
    startedAt: dto.started_at,
    endedAt: dto.ended_at,
    durationSeconds: dto.duration_seconds,
    elapsedSeconds: dto.elapsed_seconds,
    distanceMeters: dto.distance_meters,
    avgPaceSecPerKm: dto.avg_pace_sec_per_km,
    bestPaceSecPerKm: dto.best_pace_sec_per_km,
    caloriesKcal: dto.calories_kcal,
    elevationGainMeters: dto.elevation_gain_meters,
    perceivedEffort: dto.perceived_effort,
    inclinePercent: dto.incline_percent,
    notes: dto.notes,
    title: dto.title,
    coordinates,
    splits,
    syncedAt: dto.created_at ?? new Date().toISOString(),
  };
}

type Envelope<T> = { success: boolean; data: T };
const unwrap = <T,>(p: Promise<{ data: Envelope<T> }>) => p.then(r => r.data.data);
const id = (v: string) => encodeURIComponent(v);

export const runsApi = {
  list: (params: RunListParams = {}) => unwrap<RunPage>(api.get('/runs', { params })),
  get: (runId: string) => unwrap<RunDto>(api.get(`/runs/${id(runId)}`)),
  remove: (runId: string) => unwrap<{ id: string; deleted: boolean }>(api.delete(`/runs/${id(runId)}`)),
  dailySummary: (params: { from: string; to: string; activity?: string }) => unwrap<DailyRunSummaryDto[]>(api.get('/runs/summary/daily', { params })),
  typeSummary: (params: { from: string; to: string }) => unwrap<ActivityTypeSummaryDto[]>(api.get('/runs/summary/types', { params })),
};
