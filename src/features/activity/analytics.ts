import { activityOf, type ActivityType } from './activityTypes';

/** The fields the sports dashboard needs from a saved activity (a RunSummary or RunRecord). */
export type ActivityLike = {
  startedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  caloriesKcal: number;
  avgPaceSecPerKm: number | null;
  activityType?: ActivityType;
  source?: 'gps' | 'manual';
};

export type Totals = { count: number; meters: number; seconds: number; kcal: number };
const zero = (): Totals => ({ count: 0, meters: 0, seconds: 0, kcal: 0 });
const add = (t: Totals, a: ActivityLike) => {
  t.count += 1;
  t.meters += Math.max(0, a.distanceMeters || 0);
  t.seconds += Math.max(0, a.durationSeconds || 0);
  t.kcal += Math.max(0, a.caloriesKcal || 0);
};

/** Local Monday 00:00 of the week containing `d`. */
export function weekStart(d: Date) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (s.getDay() + 6) % 7; // Monday = 0
  s.setDate(s.getDate() - dow);
  return s;
}

export function totalsBetween(list: ActivityLike[], from: Date, to: Date): Totals {
  const t = zero();
  const a = from.getTime();
  const b = to.getTime();
  for (const x of list) {
    const at = Date.parse(x.startedAt);
    if (at >= a && at < b) add(t, x);
  }
  return t;
}

/** Totals for the current week (Monday → now). */
export const thisWeek = (list: ActivityLike[], now = new Date()) => {
  const from = weekStart(now);
  const to = new Date(from.getTime() + 7 * 86400000);
  return totalsBetween(list, from, to);
};

/** Distance per week for the last `weeks` weeks, oldest first (the current week last). */
export function weeklyDistance(list: ActivityLike[], weeks = 8, now = new Date()) {
  const current = weekStart(now);
  const out: { start: Date; meters: number; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(current);
    start.setDate(start.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const t = totalsBetween(list, start, end);
    out.push({ start, meters: t.meters, count: t.count });
  }
  return out;
}

/** Time, distance and count per activity type in [from, to), largest time first. */
export function typeBreakdown(list: ActivityLike[], from: Date, to: Date) {
  const map = new Map<ActivityType, Totals>();
  const a = from.getTime();
  const b = to.getTime();
  for (const x of list) {
    const at = Date.parse(x.startedAt);
    if (at < a || at >= b) continue;
    const type = activityOf(x);
    const t = map.get(type) ?? zero();
    add(t, x);
    map.set(type, t);
  }
  return [...map.entries()].map(([type, t]) => ({ type, ...t })).sort((p, q) => q.seconds - p.seconds || q.count - p.count);
}

/** Pace of the last `n` runs that have one, oldest first. */
export function paceTrend(list: ActivityLike[], n = 10) {
  return list
    .filter(x => activityOf(x) === 'run' && x.avgPaceSecPerKm != null && x.avgPaceSecPerKm > 0 && x.distanceMeters >= 500)
    .sort((p, q) => Date.parse(q.startedAt) - Date.parse(p.startedAt))
    .slice(0, n)
    .reverse()
    .map(x => ({ at: x.startedAt, pace: x.avgPaceSecPerKm as number }));
}

/** First day of the month containing `d`, local. */
export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
