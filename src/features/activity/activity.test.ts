import { describe, expect, test } from 'vitest';
import { fromRunDto, type RunDto } from '../../api/runs';
import { paceTrend, thisWeek, typeBreakdown, weekStart, weeklyDistance, type ActivityLike } from './analytics';
import { activityMeta, activityOf, defaultActivityTitle, speedKmh } from './activityTypes';
import { formatDuration, formatKm, formatPace } from './runMath';

const NOW = new Date(2026, 9, 21, 18, 0); // Wed 21 Oct 2026, local
const at = (d: number, h = 7) => new Date(2026, 9, d, h, 0).toISOString();
const act = (d: number, type: ActivityLike['activityType'], km: number, min: number, pace: number | null = null): ActivityLike => ({
  startedAt: at(d),
  activityType: type,
  distanceMeters: km * 1000,
  durationSeconds: min * 60,
  caloriesKcal: 100,
  avgPaceSecPerKm: pace,
});

describe('formatting', () => {
  test('duration, pace and km', () => {
    expect(formatDuration(754)).toBe('12:34');
    expect(formatDuration(3754)).toBe('1:02:34');
    expect(formatPace(318)).toBe(`5'18"`);
    expect(formatPace(null)).toBe(`--'--"`);
    expect(formatKm(4823)).toBe('4.82');
  });
  test('rides show speed, other activities pace', () => {
    expect(activityMeta('cycle').showsSpeed).toBe(true);
    expect(activityMeta('run').showsSpeed).toBe(false);
    expect(speedKmh(20000, 3600)).toBe(20);
    expect(activityOf({ activityType: 'nonsense' })).toBe('run');
    expect(defaultActivityTitle('cycle', new Date(2026, 9, 21, 7))).toBe('Morning ride');
  });
});

describe('analytics', () => {
  const list = [act(21, 'run', 5, 30, 360), act(20, 'cycle', 20, 60), act(19, 'walk', 3, 35), act(14, 'run', 8, 50, 375), act(1, 'football', 0, 60)];
  test('this week starts Monday and sums only this week', () => {
    expect(weekStart(NOW).getDay()).toBe(1);
    const w = thisWeek(list, NOW);
    expect(w.count).toBe(3);
    expect(w.meters).toBe(28000);
  });
  test('weekly distance: 8 buckets, current week last', () => {
    const weeks = weeklyDistance(list, 8, NOW);
    expect(weeks).toHaveLength(8);
    expect(weeks[7].meters).toBe(28000);
    expect(weeks[6].meters).toBe(8000);
  });
  test('type breakdown sorted by time; pace trend oldest first, runs only', () => {
    const b = typeBreakdown(list, new Date(2026, 9, 1), new Date(2026, 10, 1));
    expect(b.map(x => x.type)).toEqual(['run', 'cycle', 'walk', 'football']);
    expect(paceTrend(list).map(p => p.pace)).toEqual([375, 360]);
  });
});

test('fromRunDto maps GeoJSON [lng,lat] and route_meta segments', () => {
  const dto = {
    id: 'u1', client_id: 'c1', activity_type: 'walk', source: 'gps', surface: 'road',
    started_at: at(21), ended_at: at(21, 8), duration_seconds: 1800, elapsed_seconds: 1900, distance_meters: 2500,
    avg_pace_sec_per_km: 720, best_pace_sec_per_km: null, calories_kcal: 90, elevation_gain_meters: 3,
    perceived_effort: null, incline_percent: null, notes: null, title: null,
    route: { type: 'LineString', coordinates: [[72.88, 19.11], [72.881, 19.112]] },
    route_meta: { t: [0, 1000], timestamps: [1, 2], segments: [0, 1], accuracy: [5, null] },
    splits: [{ km: 1, distance_meters: 1000, duration_seconds: 700, pace_sec_per_km: 700, elevation_gain_meters: 1 }],
  } as RunDto;
  const r = fromRunDto(dto);
  expect(r.activityType).toBe('walk');
  expect(r.coordinates[0]).toMatchObject({ latitude: 19.11, longitude: 72.88, segment: 0 });
  expect(r.coordinates[1].segment).toBe(1);
  expect(r.splits[0].paceSecPerKm).toBe(700);
});
