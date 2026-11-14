import { activityMeta, speedKmh, type ActivityType } from '../activity/activityTypes';
import { formatDuration, formatKm, formatPace, haversineMeters } from '../activity/runMath';
import type { RunSplit } from '../activity/types';

/*
 * Share cards (docs/revamp/09-SHARE-CARDS.md): data model, template rules, privacy trim and route
 * projection. Pure so the rules are unit-tested; the components only draw.
 */

export type LatLng = [number, number];

export type DayActivity = { activityType: ActivityType; distanceMeters: number; durationSeconds: number; route: LatLng[] };

export type ShareCardData = {
  kind: 'activity' | 'day';
  title: string;
  activityType: ActivityType;
  /** e.g. "Mon 19 Oct · 6:42 PM". */
  dateLabel: string;
  startedAt: string | null;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number | null;
  caloriesKcal: number;
  elevationGainMeters: number;
  avgBpm: number | null;
  /** Untrimmed; segments are separate polylines (pauses are never joined). */
  segments: LatLng[][];
  splits: RunSplit[];
  surface?: string | null;
  runClientId?: string | null;
  /** Day cards. */
  shareDate?: string | null;
  activities?: DayActivity[];
};

export type ShareOptions = { hideEnds: boolean; showPace: boolean; showCalories: boolean; showHeartRate: boolean };

export const TEMPLATE_KEYS = ['route', 'story', 'sticker', 'photo', 'stats', 'splits', 'day'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** Logical size each template is laid out at; captured at 3x (1080 px wide). */
export const TEMPLATE_SIZE: Record<TemplateKey, { width: number; height: number }> = {
  route: { width: 360, height: 450 },
  story: { width: 360, height: 640 },
  sticker: { width: 360, height: 360 },
  photo: { width: 360, height: 450 },
  stats: { width: 360, height: 360 },
  splits: { width: 360, height: 450 },
  day: { width: 360, height: 450 },
};

export const TEMPLATE_LABEL: Record<TemplateKey, string> = {
  route: 'Route',
  story: 'Story',
  sticker: 'Sticker',
  photo: 'Photo',
  stats: 'Stats',
  splits: 'Splits',
  day: 'Today',
};

export const PRIVACY_RADIUS_M = 200;

const pointCount = (segs: LatLng[][]) => segs.reduce((n, s) => n + s.length, 0);
export const hasRoute = (d: Pick<ShareCardData, 'segments'>) => pointCount(d.segments) >= 2;
export const fullKmSplits = (d: Pick<ShareCardData, 'splits'>) => d.splits.filter(s => s.distanceMeters >= 1000);

/** Templates that make sense for this card, in display order. */
export function availableTemplates(d: ShareCardData): TemplateKey[] {
  if (d.kind === 'day') return ['day', 'stats'];
  const route = hasRoute(d);
  const keys: TemplateKey[] = [];
  if (route) keys.push('route', 'story', 'sticker');
  keys.push('photo', 'stats');
  if (route && d.activityType === 'run' && fullKmSplits(d).length >= 2) keys.push('splits');
  return keys;
}

const dist = (a: LatLng, b: LatLng) => haversineMeters({ latitude: a[0], longitude: a[1] }, { latitude: b[0], longitude: b[1] });

/** Drops every point within `radius` of the route's first and last point, so a home or office isn't revealed. */
export function trimEnds(segments: LatLng[][], radius = PRIVACY_RADIUS_M): LatLng[][] {
  const all = segments.flat();
  if (all.length < 2) return segments;
  const start = all[0];
  const end = all[all.length - 1];
  return segments.map(seg => seg.filter(p => dist(p, start) > radius && dist(p, end) > radius)).filter(seg => seg.length >= 2);
}

export type Projected = { segments: { x: number; y: number }[][]; start: { x: number; y: number } | null; end: { x: number; y: number } | null };

/**
 * Fits the route into width×height minus `pad`, keeping the shape: longitude is scaled by cos(lat)
 * so the route isn't stretched east–west, and the shorter axis is centred.
 */
export function projectRoute(segments: LatLng[][], width: number, height: number, pad = 16): Projected {
  const pts = segments.flat();
  if (pts.length < 2) return { segments: [], start: null, end: null };
  const midLat = (Math.min(...pts.map(p => p[0])) + Math.max(...pts.map(p => p[0]))) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const xs = pts.map(p => p[1] * k);
  const ys = pts.map(p => p[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const w = Math.max(1, width - pad * 2);
  const h = Math.max(1, height - pad * 2);
  const scale = Math.min(w / spanX, h / spanY);
  const offX = pad + (w - spanX * scale) / 2;
  const offY = pad + (h - spanY * scale) / 2;
  const map = (p: LatLng) => ({ x: offX + (p[1] * k - minX) * scale, y: offY + (maxY - p[0]) * scale });
  const projected = segments.filter(s => s.length >= 2).map(s => s.map(map));
  const flat = projected.flat();
  return { segments: projected, start: flat[0] ?? null, end: flat[flat.length - 1] ?? null };
}

/** Smooth SVG path through the points (quadratic midpoints), so GPS steps don't look jagged. */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(points[0].x)},${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${f(points[i].x)},${f(points[i].y)} ${f(mx)},${f(my)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${f(last.x)},${f(last.y)}`;
}

/** Keeps the route under `max` points (the share API accepts 500). */
export function thinLatLngs(points: LatLng[], max = 500): LatLng[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

/** Headline numbers in display form. Distance is null for activities without one. */
export function cardStats(d: ShareCardData) {
  const meta = activityMeta(d.activityType);
  const hasDistance = d.distanceMeters > 0 && (meta.distance || d.kind === 'day');
  return {
    distance: hasDistance ? formatKm(d.distanceMeters) : null,
    time: formatDuration(d.durationSeconds),
    pace: hasDistance && !meta.showsSpeed ? `${formatPace(d.avgPaceSecPerKm)}/km` : null,
    speed: hasDistance && meta.showsSpeed ? `${(speedKmh(d.distanceMeters, d.durationSeconds) ?? 0).toFixed(1)} km/h` : null,
    calories: d.caloriesKcal > 0 ? `${Math.round(d.caloriesKcal)}` : null,
    elevation: d.elevationGainMeters > 0 ? `+${Math.round(d.elevationGainMeters)} m` : null,
    bpm: d.avgBpm ? `${Math.round(d.avgBpm)}` : null,
    label: meta.label,
  };
}

/** The message sent with the image. Falls back to the store link when no share link could be created. */
export function shareMessage(d: ShareCardData, url: string | null, storeUrl: string) {
  const s = cardStats(d);
  const what = d.kind === 'day' ? 'My day' : d.title || s.label;
  const headline = s.distance ? `${what} — ${s.distance} km on Gymmigo` : `${what} — ${s.time} on Gymmigo`;
  return url ? `${headline} ${url}` : `${headline}. Track yours: ${storeUrl}`;
}

/** Share tokens from links: 6–16 letters/digits, anything else is ignored. */
export const safeShareToken = (v: string) => (/^[A-Za-z0-9]{6,16}$/.test(v) ? v : '');
