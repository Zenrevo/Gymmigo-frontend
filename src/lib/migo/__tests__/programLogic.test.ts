import { describe, expect, test } from 'vitest';
import type { Program, ProgramDay } from '../../../types/programs';
import {
  addDaysIso,
  adherenceLabel,
  awaitingTopUp,
  canLog,
  canRemove,
  dayOfLabel,
  dayState,
  programErrorText,
  programLabel,
  ringFraction,
  weeksOf,
} from '../programLogic';
import { planMeta } from '../planFields';

const day = (n: number, date: string, extra: Partial<ProgramDay> = {}): ProgramDay => ({
  day: n,
  date,
  type: 'workout',
  title: `Day ${n}`,
  focus: '',
  recommendation_id: null,
  removed: false,
  log: null,
  ...extra,
});

const program = (extra: Partial<Program> = {}): Program => ({
  id: 'p1',
  title: '30-day strength',
  kind: 'workout',
  duration_days: 30,
  status: 'active',
  start_date: '2026-11-01',
  end_date: '2026-11-30',
  reminder_time: '19:00',
  outline: { summary: '', phases: [] },
  progress: { day_index: 12, days_done: 8, days_partial: 1, days_skipped: 1, adherence_pct: 77, streak: 3 },
  today: null,
  created_at: '2026-10-31T10:00:00Z',
  approved_at: '2026-10-31T10:05:00Z',
  ...extra,
});

describe('program display', () => {
  test('day-of label, ring and adherence copy', () => {
    expect(dayOfLabel(program())).toBe('Day 12 of 30');
    expect(dayOfLabel(program({ progress: { ...program().progress, day_index: 0 } }))).toBe('Starts soon · 30 days');
    expect(dayOfLabel(program({ status: 'completed' }))).toBe('30 of 30 days');
    expect(ringFraction(program())).toBeCloseTo(0.4);
    expect(adherenceLabel(92)).toMatch(/great consistency/);
    expect(adherenceLabel(0)).toBe('No days logged yet');
  });

  test('day state, logging window and removal rules', () => {
    const today = '2026-11-12';
    expect(dayState(day(12, today), today)).toBe('today');
    expect(dayState(day(11, '2026-11-11'), today)).toBe('missed');
    expect(dayState(day(13, '2026-11-13'), today)).toBe('upcoming');
    expect(dayState(day(10, '2026-11-10', { log: { status: 'partial', rpe: 6, feedback: null } }), today)).toBe('partial');
    expect(dayState(day(14, '2026-11-14', { removed: true }), today)).toBe('removed');
    expect(canLog(day(5, '2026-11-05'), today)).toBe(true);
    expect(canLog(day(4, '2026-11-04'), today)).toBe(false);
    expect(canLog(day(13, '2026-11-13'), today)).toBe(false);
    expect(canRemove(day(13, '2026-11-13'), today)).toBe(true);
    expect(canRemove(day(11, '2026-11-11'), today)).toBe(false);
  });

  test('weeks, labels and top-up detection', () => {
    const days = Array.from({ length: 10 }, (_, i) => day(i + 1, addDaysIso('2026-11-01', i)));
    expect(weeksOf(days).map(w => [w.week, w.days.length])).toEqual([
      [1, 7],
      [2, 3],
    ]);
    expect(programLabel(program(), 5)).toBe('Day 5 of 30 · 30-day strength');
    expect(awaitingTopUp(program({ days }), '2026-11-08')).toBe(true);
    expect(awaitingTopUp(program({ days: days.map(d => ({ ...d, recommendation_id: 'r' })) }), '2026-11-08')).toBe(false);
  });

  test('friendly error text by code or status', () => {
    expect(programErrorText('ACTIVE_PROGRAM_EXISTS')).toMatch(/already have an active plan/);
    expect(programErrorText(null, 429)).toMatch(/a bit later/);
    expect(programErrorText(null, 503)).toMatch(/busy/);
    expect(programErrorText('SOMETHING_ELSE', 400)).toBeNull();
  });

  test('plan titles never show raw markdown', () => {
    expect(planMeta({ id: 'r', type: 'diet', date_for: '2026-11-12', title: '| Meal | Items |' }).title).toBe('Today’s meal plan');
    expect(planMeta({ id: 'r', type: 'workout', date_for: '2026-11-12', structured_data: { focus: 'Leg day' } }).title).toBe('Leg day');
  });
});
