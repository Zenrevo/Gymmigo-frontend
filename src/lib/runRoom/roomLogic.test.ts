import { describe, expect, test } from 'vitest';
import type { LiveState, RoomMember, RoomSession, RunRoom } from '../../api/runRooms';
import {
  applyLive,
  editionLabel,
  effectiveSessions,
  endsAtError,
  endsInText,
  formatGapDistance,
  gapText,
  gapToLeader,
  isValidRoomCode,
  kolkataDate,
  memberTotals,
  mergeTrails,
  normalizeRoomCode,
  rankRunners,
  runningNow,
  safeRoomCode,
  stepEdition,
} from './roomLogic';


const T0 = Date.parse('2026-10-18T06:00:00Z');

const member = (over: Partial<RoomMember>): RoomMember => ({
  user_id: 'u',
  name: 'Runner',
  avatar_url: null,
  role: 'runner',
  state: 'running',
  is_host: false,
  color: '#FF5722',
  distance_meters: null,
  moving_seconds: null,
  avg_pace_sec_per_km: null,
  current_pace_sec_per_km: null,
  last_lat: null,
  last_lng: null,
  last_accuracy: null,
  last_seen_at: null,
  ...over,
});

const room = (over: Partial<RunRoom> = {}): RunRoom => ({
  id: 'room-1',
  code: 'ABC234',
  title: 'Morning run',
  host_id: 'me',
  status: 'live',
  max_runners: 50,
  created_at: new Date(T0 - 600_000).toISOString(),
  started_at: new Date(T0).toISOString(),
  finished_at: null,
  share_url: 'https://gymmigo.in/run-room/ABC234',
  my_role: 'runner',
  my_state: 'running',
  members: [member({ user_id: 'me', is_host: true })],
  invited: [],
  ...over,
});

const live = (over: Partial<LiveState> = {}): LiveState => ({ room: room(), cursor: 0, trails: {}, cheers: [], ...over });

describe('room codes', () => {
  test('normalises typed codes: uppercase, strips separators and 0/1', () => {
    expect(normalizeRoomCode('ab c-23 4')).toBe('ABC234');
    expect(normalizeRoomCode('a0b1c2d3e4f5')).toBe('ABC2D3');
    expect(normalizeRoomCode('abcdefghij')).toBe('ABCDEF');
  });
  test('validates 6 chars from A–Z / 2–9, case-insensitive', () => {
    expect(isValidRoomCode('ABC234')).toBe(true);
    expect(isValidRoomCode('abc234')).toBe(true);
    expect(isValidRoomCode('ABC23')).toBe(false);
    expect(isValidRoomCode('ABC230')).toBe(false);
    expect(isValidRoomCode('ABC23!')).toBe(false);
    expect(isValidRoomCode(undefined)).toBe(false);
  });
  test('deep-link parser uppercases valid codes and blanks anything else', () => {
    expect(safeRoomCode('xyz789')).toBe('XYZ789');
    expect(safeRoomCode('../etc')).toBe('');
  });
});

describe('trail merging', () => {
  const p = (seq: number) => ({ seq, lat: 12.97 + seq * 1e-5, lng: 77.59, t: new Date(T0 + seq * 1000).toISOString() });

  test('appends new points in seq order and ignores ones already held', () => {
    const a = mergeTrails({}, { u1: [p(2), p(1)] });
    expect(a.u1.map(x => x.seq)).toEqual([1, 2]);
    const b = mergeTrails(a, { u1: [p(2), p(3)], u2: [p(4)] });
    expect(b.u1.map(x => x.seq)).toEqual([1, 2, 3]);
    expect(b.u2.map(x => x.seq)).toEqual([4]);
  });
  test('returns the same object when nothing is new (no re-render)', () => {
    const a = mergeTrails({}, { u1: [p(1)] });
    expect(mergeTrails(a, { u1: [p(1)] })).toBe(a);
    expect(mergeTrails(a, {})).toBe(a);
  });
  test('drops points without valid coordinates', () => {
    const a = mergeTrails({}, { u1: [{ ...p(1), lat: NaN }, p(2)] });
    expect(a.u1.map(x => x.seq)).toEqual([2]);
  });
  test('applyLive: cursor never moves back, cheers are de-duplicated', () => {
    const cheer = { id: 'c1', seq: 5, from_user_id: 'u2', from_name: 'Rahul', to_user_id: null, kind: 'fire' as const, created_at: '' };
    let s = applyLive({ room: null, cursor: 0, trails: {}, sessions: null, cheers: [] }, live({ cursor: 10, cheers: [cheer] }));
    s = applyLive(s, live({ cursor: 4, cheers: [cheer] }));
    expect(s.cursor).toBe(10);
    expect(s.cheers).toHaveLength(1);
  });
});

describe('ranking and gaps', () => {
  const runners = [
    member({ user_id: 'a', distance_meters: 1200, moving_seconds: 400 }),
    member({ user_id: 'b', distance_meters: 3050, moving_seconds: 900 }),
    member({ user_id: 'c', distance_meters: 1200, moving_seconds: 380 }),
    member({ user_id: 'd', distance_meters: null }),
    member({ user_id: 'e', role: 'spectator', distance_meters: 9999 }),
    member({ user_id: 'f', state: 'left', distance_meters: 8000 }),
  ];
  test('ranks runners by distance, ties by less moving time, skips spectators and leavers', () => {
    expect(rankRunners(runners).map(m => m.user_id)).toEqual(['b', 'c', 'a', 'd']);
  });
  test('gap text relative to me', () => {
    expect(gapText({ distance_meters: 1320 }, { distance_meters: 1200 })).toBe('120 m ahead');
    expect(gapText({ distance_meters: 1000 }, { distance_meters: 2500 })).toBe('1.50 km behind');
    expect(gapText({ distance_meters: 1205 }, { distance_meters: 1200 })).toBe('Level');
    expect(gapText({ distance_meters: null }, { distance_meters: 1200 })).toBeNull();
  });
  test('gap to leader for spectators', () => {
    const ranked = rankRunners(runners);
    expect(gapToLeader(ranked, 0)).toBe('Leader');
    expect(gapToLeader(ranked, 1)).toBe('−1.85 km');
    expect(gapToLeader(ranked, 3)).toBe('—');
    expect(formatGapDistance(14_200)).toBe('14.2 km');
  });
});

const session = (over: Partial<RoomSession>): RoomSession => ({
  id: 's',
  user_id: 'u',
  name: 'Runner',
  avatar_url: null,
  color: '#FF5722',
  edition_date: '2026-10-18',
  state: 'running',
  started_at: new Date(T0).toISOString(),
  ended_at: null,
  distance_meters: 0,
  moving_seconds: 0,
  avg_pace_sec_per_km: null,
  current_pace_sec_per_km: null,
  last_lat: null,
  last_lng: null,
  last_seen_at: null,
  ...over,
});

describe('sessions and club editions', () => {
  test('trails merge keyed by session id: two runs by one person stay separate', () => {
    const p = (seq: number) => ({ seq, lat: 12.97, lng: 77.59 + seq * 1e-5, t: '' });
    const a = mergeTrails({}, { 'sess-1': [p(1), p(2)], 'sess-2': [p(3)] });
    const b = mergeTrails(a, { 'sess-2': [p(3), p(4)] });
    expect(Object.keys(b).sort()).toEqual(['sess-1', 'sess-2']);
    expect(b['sess-2'].map(x => x.seq)).toEqual([3, 4]);
  });

  test('applyLive replaces sessions; a server without sessions keeps them null', () => {
    const base = { room: null, cursor: 0, trails: {}, sessions: null, cheers: [] };
    expect(applyLive(base, live()).sessions).toBeNull();
    const withS = applyLive(base, live({ sessions: [session({ id: 'a' })] }));
    expect(withS.sessions?.map(x => x.id)).toEqual(['a']);
    expect(applyLive(withS, live({ sessions: [] })).sessions).toEqual([]);
  });

  test('effectiveSessions falls back to members only for servers without sessions', () => {
    const r = room({ members: [member({ user_id: 'a', distance_meters: 500 }), member({ user_id: 'b', role: 'spectator' })] });
    expect(effectiveSessions(r, null).map(x => x.id)).toEqual(['a']);
    expect(effectiveSessions(r, [])).toEqual([]);
  });

  test('per-member totals add up every run of the day; running now is furthest first', () => {
    const list = [
      session({ id: '1', user_id: 'ashwin', distance_meters: 6000, moving_seconds: 3600, state: 'finished' }),
      session({ id: '2', user_id: 'archil', distance_meters: 10000, moving_seconds: 3300, state: 'finished' }),
      session({ id: '3', user_id: 'ashwin', distance_meters: 2500, moving_seconds: 900, state: 'running' }),
      session({ id: '4', user_id: 'neha', distance_meters: 3100, moving_seconds: 1000, state: 'paused' }),
    ];
    const totals = memberTotals(list);
    expect(totals.map(t => [t.user_id, t.distance_meters, t.sessions, t.running])).toEqual([
      ['archil', 10000, 1, false],
      ['ashwin', 8500, 2, true],
      ['neha', 3100, 1, true],
    ]);
    expect(runningNow(list).map(x => x.id)).toEqual(['4', '3']);
  });

  test('club editions follow India time and step back at most 30 days', () => {
    const lateNightUtc = Date.parse('2026-10-18T19:00:00Z'); // 00:30 on the 19th in India
    expect(kolkataDate(lateNightUtc)).toBe('2026-10-19');
    expect(stepEdition(null, -1, lateNightUtc)).toBe('2026-10-18');
    expect(stepEdition('2026-10-18', 1, lateNightUtc)).toBeNull(); // back to today
    expect(stepEdition(null, 1, lateNightUtc)).toBeNull(); // never into the future
    expect(stepEdition(null, -45, lateNightUtc)).toBe('2026-09-19');
    expect(editionLabel(null, lateNightUtc)).toBe('Today');
    expect(editionLabel('2026-10-18', lateNightUtc)).toBe('Yesterday');
    expect(editionLabel('2026-10-12', lateNightUtc)).toBe('Mon, 12 Oct');
  });

  test('open rooms close between 15 minutes and 30 days from now', () => {
    const now = T0;
    expect(endsAtError(now + 10 * 60_000, now)).toMatch(/15 minutes/);
    expect(endsAtError(now + 31 * 86_400_000, now)).toMatch(/30 days/);
    expect(endsAtError(new Date(now + 2 * 3600_000), now)).toBeNull();
    expect(endsAtError(NaN, now)).toMatch(/Pick/);
    expect(endsInText(new Date(now + 25 * 60_000).toISOString(), now)).toBe('ends in 25 min');
    expect(endsInText(new Date(now + 5 * 3600_000).toISOString(), now)).toBe('ends in 5h');
    expect(endsInText(new Date(now + 3 * 86_400_000).toISOString(), now)).toBe('ends in 3 days');
    expect(endsInText(new Date(now - 1000).toISOString(), now)).toBe('ended');
  });
});

