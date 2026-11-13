import { expect, test } from 'vitest';
import { cardFromDay, cardFromRun, routeSegments, shareRequestBody } from '../../src/features/share/cardData';
import { availableTemplates, cardStats, projectRoute, safeShareToken, shareMessage, trimEnds, type LatLng } from '../../src/features/share/shareModel';
import type { RunRecord } from '../../src/features/activity/types';

const M = 1 / 111195;
const line = (n: number, stepM: number, seg = 0) =>
  Array.from({ length: n }, (_, i) => ({ latitude: 19.1 + i * stepM * M, longitude: 72.88, timestamp: i, t: i * 1000, segment: seg }));

const run = (over: Partial<RunRecord> = {}): RunRecord => ({
  clientId: 'c1', activityType: 'run', source: 'gps', surface: 'road',
  startedAt: new Date(2026, 9, 21, 7).toISOString(), endedAt: new Date(2026, 9, 21, 8).toISOString(),
  durationSeconds: 1800, elapsedSeconds: 1900, distanceMeters: 5000, avgPaceSecPerKm: 360, bestPaceSecPerKm: 340,
  caloriesKcal: 300, elevationGainMeters: 20,
  coordinates: [...line(30, 100, 0), ...line(30, 100, 1).map(p => ({ ...p, longitude: 72.9 }))],
  splits: [1, 2, 3].map(km => ({ km, distanceMeters: 1000, durationSeconds: 360, paceSecPerKm: 360, elevationGainMeters: 2 })),
  ...over,
});

test('routes split at pauses; route templates need a route, splits need 2+ full km', () => {
  const card = cardFromRun(run());
  expect(routeSegments(run())).toHaveLength(2);
  expect(availableTemplates(card)).toEqual(['route', 'story', 'sticker', 'photo', 'stats', 'splits']);
  expect(availableTemplates(cardFromRun(run({ coordinates: [], activityType: 'football' })))).toEqual(['photo', 'stats']);
});

test('privacy trim drops points within 200 m of the start and finish', () => {
  const pts: LatLng[] = Array.from({ length: 21 }, (_, i) => [19.1 + i * 100 * M, 72.88]);
  const trimmed = trimEnds([pts]).flat();
  expect(trimmed.length).toBe(21 - 3 - 3);
});

test('projection stays inside the box', () => {
  const p = projectRoute([[[19.1, 72.88], [19.11, 72.9], [19.12, 72.89]]], 360, 450, 16);
  for (const pt of p.segments.flat()) {
    expect(pt.x).toBeGreaterThanOrEqual(16);
    expect(pt.x).toBeLessThanOrEqual(344);
    expect(pt.y).toBeGreaterThanOrEqual(16);
    expect(pt.y).toBeLessThanOrEqual(434);
  }
});

test('ride cards show speed; message falls back to the store link', () => {
  const ride = cardFromRun(run({ activityType: 'cycle', distanceMeters: 20000, durationSeconds: 3600 }));
  expect(cardStats(ride).speed).toBe('20.0 km/h');
  expect(cardStats(ride).pace).toBeNull();
  const card = cardFromRun(run());
  expect(shareMessage(card, 'https://x/s/abc', 'STORE')).toContain('https://x/s/abc');
  expect(shareMessage(card, null, 'STORE')).toContain('STORE');
  expect(safeShareToken('abc123XY')).toBe('abc123XY');
  expect(safeShareToken('../x')).toBe('');
});

test('day card sums today only; request body honours the trim', () => {
  const day = new Date(2026, 9, 21);
  const yesterday = run({ clientId: 'y', startedAt: new Date(2026, 9, 20, 7).toISOString() });
  const card = cardFromDay([run(), run({ clientId: 'c2', activityType: 'walk', distanceMeters: 2000 }), yesterday], day);
  expect(card.distanceMeters).toBe(7000);
  expect(card.activities).toHaveLength(2);
  expect(card.shareDate).toBe('2026-10-21');
  const body = shareRequestBody(cardFromRun(run()), [], null, false);
  expect(body.route).toBeNull();
  expect(body.run_client_id).toBe('c1');
});
