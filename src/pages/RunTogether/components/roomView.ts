import type { RoomMember, RoomSession, RunRoom, TrailPoint } from '../../../api/runRooms';
import { isSessionActive, type MemberTotal } from '../../../lib/runRoom/roomLogic';

/* Plain helpers shared by the Run together pages (kept out of component files). */

export const roomPath = (r: Pick<RunRoom, 'id'>) => `/app/run-room/${r.id}`;

const PRESET_MS: Record<string, number> = { '2h': 2 * 3600_000, '24h': 24 * 3600_000, '3d': 3 * 86_400_000, '7d': 7 * 86_400_000 };

/** End time for an open room from a preset chip, or from the custom date + time fields (local time). */
export function resolveEndsAt(preset: string, date: string, time: string, now = Date.now()): Date {
  if (preset !== 'custom') return new Date(now + (PRESET_MS[preset] ?? PRESET_MS['24h']));
  return new Date(`${date}T${time || '00:00'}`);
}

export type LatLng = { lat: number; lng: number };
export type MapRunner = { session: RoomSession; at: LatLng; active: boolean; isMe: boolean };

/** Where each runner is drawn: live position while running, else the end of their trail. */
export function mapRunners(sessions: RoomSession[], trails: Record<string, TrailPoint[] | undefined>, me?: string, viewingPast = false): MapRunner[] {
  const out: MapRunner[] = [];
  for (const s of sessions) {
    const active = isSessionActive(s) && !viewingPast;
    const t = trails[s.id];
    const last = t?.[t.length - 1];
    if (active && s.last_lat != null && s.last_lng != null) out.push({ session: s, at: { lat: s.last_lat, lng: s.last_lng }, active, isMe: s.user_id === me });
    else if (last) out.push({ session: s, at: { lat: last.lat, lng: last.lng }, active, isMe: s.user_id === me });
  }
  return out.sort((a, b) => Number(a.isMe) - Number(b.isMe));
}


export type Row = { user_id: string; name: string; avatar_url: string | null; color: string; distance_meters: number | null; moving_seconds: number | null; pace: number | null; sub?: string; running?: boolean };

export const rowFromMember = (m: RoomMember): Row => ({
  user_id: m.user_id,
  name: m.name,
  avatar_url: m.avatar_url,
  color: m.color,
  distance_meters: m.distance_meters,
  moving_seconds: m.moving_seconds,
  pace: m.current_pace_sec_per_km ?? m.avg_pace_sec_per_km,
  running: m.state === 'running',
  sub: m.state === 'paused' ? 'Paused' : m.state === 'finished' ? 'Finished' : undefined,
});
export const rowFromSession = (s: RoomSession): Row => ({
  user_id: s.user_id,
  name: s.name,
  avatar_url: s.avatar_url,
  color: s.color,
  distance_meters: s.distance_meters,
  moving_seconds: s.moving_seconds,
  pace: s.current_pace_sec_per_km ?? s.avg_pace_sec_per_km,
  running: s.state === 'running',
  sub: s.state === 'paused' ? 'Paused' : undefined,
});
export const rowFromTotal = (t: MemberTotal): Row => ({
  user_id: t.user_id,
  name: t.name,
  avatar_url: t.avatar_url,
  color: t.color,
  distance_meters: t.distance_meters,
  moving_seconds: t.moving_seconds,
  pace: t.distance_meters > 50 ? t.moving_seconds / (t.distance_meters / 1000) : null,
  running: t.running,
  sub: `${t.sessions} ${t.sessions === 1 ? 'run' : 'runs'}`,
});

