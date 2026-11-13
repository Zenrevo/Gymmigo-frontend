import type { Program, ProgramDay, ProgramDayType } from '../../types/programs';

/** Plan programs: display rules shared by the web pages (ported from the app's programLogic.ts). */

const pad = (n: number) => String(n).padStart(2, '0');

/** Local `YYYY-MM-DD` for a Date. */
export const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** `YYYY-MM-DD` + n days (local calendar arithmetic, DST-safe). */
export function addDaysIso(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + n));
}

/** Local wall-clock moment for a date and `HH:MM` (device timezone). */
export function atLocalTime(iso: string, hhmm: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0, 0);
}

export const clamp01 = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);

/** Share of the program elapsed, for the progress ring. */
export const ringFraction = (p: Pick<Program, 'progress' | 'duration_days'>) => clamp01(p.progress.day_index / Math.max(1, p.duration_days));

export function dayOfLabel(p: Pick<Program, 'progress' | 'duration_days' | 'status'>) {
  if (p.status === 'completed') return `${p.duration_days} of ${p.duration_days} days`;
  if (p.progress.day_index <= 0) return `Starts soon · ${p.duration_days} days`;
  return `Day ${Math.min(p.progress.day_index, p.duration_days)} of ${p.duration_days}`;
}

export function adherenceLabel(pct: number) {
  const v = Math.round(Math.max(0, Math.min(100, pct)));
  if (v >= 85) return `${v}% on track · great consistency`;
  if (v >= 60) return `${v}% on track`;
  if (v > 0) return `${v}% on track · let’s pick it back up`;
  return 'No days logged yet';
}

export const durationLabel = (days: number) => (days === 7 ? '1 week' : `${days} days`);

export const KIND_LABEL: Record<string, string> = { workout: 'Workout', diet: 'Diet', both: 'Workout + diet' };
export const TYPE_LABEL: Record<ProgramDayType, string> = { workout: 'Workout', diet: 'Nutrition', rest: 'Rest' };

export type DayState = 'done' | 'partial' | 'skipped' | 'removed' | 'today' | 'missed' | 'upcoming';

export function dayState(d: Pick<ProgramDay, 'date' | 'removed' | 'log'>, today: string): DayState {
  if (d.log) return d.log.status;
  if (d.removed) return 'removed';
  if (d.date === today) return 'today';
  return d.date < today ? 'missed' : 'upcoming';
}

/** Days a user may still log: today and the 7 days before it (contract). */
export const canLog = (d: Pick<ProgramDay, 'date' | 'removed'>, today: string) => !d.removed && d.date <= today && d.date >= addDaysIso(today, -7);

/** Removable from the calendar: not logged, not removed, today or later. */
export const canRemove = (d: Pick<ProgramDay, 'date' | 'removed' | 'log'>, today: string) => !d.removed && !d.log && d.date >= today;

/** Days grouped into program weeks (days 1–7 = week 1, …). */
export function weeksOf(days: ProgramDay[]) {
  const weeks: { week: number; days: ProgramDay[] }[] = [];
  for (const d of [...days].sort((a, b) => a.day - b.day)) {
    const w = Math.floor((d.day - 1) / 7) + 1;
    const bucket = weeks[weeks.length - 1];
    if (bucket && bucket.week === w) bucket.days.push(d);
    else weeks.push({ week: w, days: [d] });
  }
  return weeks;
}

/** Program days on a calendar date → label shown under the day's plan card. */
export function programLabel(p: Pick<Program, 'title' | 'duration_days'> | undefined, day: number | null | undefined) {
  if (!p) return day ? `Plan day ${day}` : null;
  return day ? `Day ${day} of ${p.duration_days} · ${p.title}` : p.title;
}

/** Friendly text for the programs API's error codes (null → use the server message). */
export const PROGRAM_ERRORS: Record<string, string> = {
  ACTIVE_PROGRAM_EXISTS: 'You already have an active plan of this kind. Remove it from your calendar first, or pick a different kind.',
  NOT_A_DRAFT: 'This plan was already approved. Open it from Your plans.',
  DAY_IN_FUTURE: 'You can log this day once it arrives.',
  DAY_TOO_OLD: 'Only today and the last 7 days can be logged.',
  DAY_REMOVED: 'This day was removed from your calendar.',
  RECOMMENDATION_COMPLETED: 'This day is already completed, so it can’t be removed.',
  PROGRAM_ENDED: 'This plan has already ended.',
  RATE_LIMITED: 'You’ve rebuilt this plan a lot in the last hour. Try again a bit later.',
  AI_UNAVAILABLE: 'Migo is busy right now. Please try again in a minute.',
};

export function programErrorText(code: string | null | undefined, status?: number) {
  if (code && PROGRAM_ERRORS[code]) return PROGRAM_ERRORS[code];
  if (status === 429) return PROGRAM_ERRORS.RATE_LIMITED;
  if (status === 503) return PROGRAM_ERRORS.AI_UNAVAILABLE;
  return null;
}

/** Logging is allowed on active and completed programs (contract + backend). */
export const isLoggable = (p: Pick<Program, 'status'>) => p.status === 'active' || p.status === 'completed';

/**
 * Detailed day plans are prepared in the background after reads, so upcoming days in the next week
 * can briefly have no recommendation yet: the detail screen re-fetches until they arrive.
 */
export function awaitingTopUp(p: Pick<Program, 'status' | 'days'> | undefined, today: string) {
  if (!p || p.status !== 'active' || !p.days) return false;
  const until = addDaysIso(today, 3);
  return p.days.some(d => !d.removed && d.type !== 'rest' && !d.recommendation_id && d.date >= today && d.date <= until);
}

/** "3 workouts · 1 rest" for a week of program days. */
export function weekSummary(days: ProgramDay[]) {
  const count = (t: string) => days.filter(d => d.type === t).length;
  return [
    count('workout') ? `${count('workout')} workout${count('workout') > 1 ? 's' : ''}` : null,
    count('diet') ? `${count('diet')} meal plan${count('diet') > 1 ? 's' : ''}` : null,
    count('rest') ? `${count('rest')} rest` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
