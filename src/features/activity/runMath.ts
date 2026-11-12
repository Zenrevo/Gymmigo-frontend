/* Run maths and formatting, ported from the app (src/services/run/runMath.ts). */

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Seconds per km, or null when there is too little distance to say. */
export function paceSecPerKm(seconds: number, meters: number, minMeters = 10): number | null {
  if (meters < minMeters || seconds <= 0) return null;
  return seconds / (meters / 1000);
}

/* ---------------- Formatting ---------------- */

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** 754 → "12:34"; 3754 → "1:02:34". */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

/** 318 → `5'18"`; null → `--'--"`. */
export function formatPace(secPerKm: number | null | undefined) {
  if (secPerKm == null || !Number.isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return `--'--"`;
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}'${pad(s % 60)}"`;
}

/** 4823 → "4.82". */
export const formatKm = (meters: number) => (Math.max(0, meters) / 1000).toFixed(2);
