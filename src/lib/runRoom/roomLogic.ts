import type { Cheer, CheerKind, LiveState, RoomKind, RoomMember, RoomSession, RunRoom, TrailPoint } from '../../api/runRooms';

/* Pure helpers for Run Rooms: codes, trail merging, ranking and gap text. */

export const ROOM_CODE_LENGTH = 6;

/** Uppercases, drops spaces/dashes and any character outside A–Z / 2–9 (the server never issues 0 or 1). */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export const isValidRoomCode = (v: string | null | undefined): v is string => typeof v === 'string' && /^[A-Z2-9]{6}$/i.test(v);

/** Deep-link parser: a clean uppercase code, or '' (the join screen then shows "room not found"). */
export const safeRoomCode = (v: string) => (isValidRoomCode(v) ? v.toUpperCase() : '');

/** Max points kept per member on the device; older ones are thinned out so long runs stay cheap to draw. */
export const MAX_TRAIL_POINTS = 3000;

export type Trails = Record<string, TrailPoint[]>;

/**
 * Appends a `/live` delta to the trails we already hold. Points at or below the last seq we have for that
 * member are ignored, so a repeated or overlapping response never duplicates a point.
 */
export function mergeTrails(prev: Trails, delta: Trails): Trails {
  let changed = false;
  const next: Trails = { ...prev };
  for (const [userId, pts] of Object.entries(delta ?? {})) {
    if (!pts?.length) continue;
    const have = prev[userId] ?? [];
    const lastSeq = have.length ? have[have.length - 1].seq : -Infinity;
    const fresh = pts.filter(p => p.seq > lastSeq && Number.isFinite(p.lat) && Number.isFinite(p.lng)).sort((a, b) => a.seq - b.seq);
    if (!fresh.length) continue;
    let merged = have.concat(fresh);
    if (merged.length > MAX_TRAIL_POINTS) {
      // Keep every other point of the oldest half: the shape stays, the count halves.
      const half = Math.floor(merged.length / 2);
      merged = merged.slice(0, half).filter((_, i) => i % 2 === 0).concat(merged.slice(half));
    }
    next[userId] = merged;
    changed = true;
  }
  return changed ? next : prev;
}

/** `sessions` is null until a server that knows sessions (v2) answers. */
export type LiveSnapshot = { room: RunRoom | null; cursor: number; trails: Trails; sessions: RoomSession[] | null; cheers: Cheer[] };

/**
 * Applies one `/live` response. The cursor never moves backwards; cheers are de-duplicated by seq;
 * sessions are replaced wholesale (the server sends every session of the edition each time).
 */
export function applyLive(prev: LiveSnapshot, live: LiveState): LiveSnapshot {
  const seen = new Set(prev.cheers.map(c => c.seq));
  const cheers = (live.cheers ?? []).filter(c => !seen.has(c.seq));
  return {
    room: live.room,
    cursor: Math.max(prev.cursor, Number(live.cursor) || 0),
    trails: mergeTrails(prev.trails, live.trails),
    sessions: live.sessions ?? prev.sessions,
    cheers: cheers.length ? prev.cheers.concat(cheers).slice(-100) : prev.cheers,
  };
}

/* ---------------- Room kinds, sessions, editions ---------------- */

export const roomKind = (room: Pick<RunRoom, 'kind'> | null | undefined): RoomKind => room?.kind ?? 'live';
export const isAnytimeRoom = (room: Pick<RunRoom, 'kind'> | null | undefined) => roomKind(room) !== 'live';

/** Rooms one GPS run can be shared to at once (server cap, 409 TOO_MANY_ACTIVE_SESSIONS). */
export const MAX_SHARED_ROOMS = 3;

/**
 * The sessions to draw. Servers before v2 send no `sessions` field (null here) and key trails by user id: each runner then
 * becomes one pseudo-session whose id is their user id, so the same map code handles both.
 */
export function effectiveSessions(room: RunRoom | null | undefined, sessions: RoomSession[] | null | undefined): RoomSession[] {
  if (sessions) return sessions;
  return (room?.members ?? [])
    .filter(m => m.role === 'runner' && m.state !== 'left' && m.state !== 'invited' && (m.distance_meters != null || m.last_lat != null))
    .map(m => ({
      id: m.user_id,
      user_id: m.user_id,
      name: m.name,
      avatar_url: m.avatar_url,
      color: m.color,
      edition_date: '',
      state: m.state === 'paused' ? 'paused' : m.state === 'finished' ? 'finished' : 'running',
      started_at: room?.started_at ?? room?.created_at ?? '',
      ended_at: null,
      distance_meters: m.distance_meters ?? 0,
      moving_seconds: m.moving_seconds ?? 0,
      avg_pace_sec_per_km: m.avg_pace_sec_per_km,
      current_pace_sec_per_km: m.current_pace_sec_per_km,
      last_lat: m.last_lat,
      last_lng: m.last_lng,
      last_seen_at: m.last_seen_at,
    }));
}

export const isSessionActive = (s: Pick<RoomSession, 'state'>) => s.state !== 'finished';

/** Sessions running or paused now, furthest first. */
export function runningNow(sessions: RoomSession[]): RoomSession[] {
  return sessions.filter(isSessionActive).sort((a, b) => b.distance_meters - a.distance_meters);
}

export type MemberTotal = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  color: string;
  distance_meters: number;
  moving_seconds: number;
  sessions: number;
  running: boolean;
  first_started_at: string;
};

/** Per-runner totals for an edition (the "Today" leaderboard): furthest first, ties to less moving time. */
export function memberTotals(sessions: RoomSession[]): MemberTotal[] {
  const by = new Map<string, MemberTotal>();
  for (const s of sessions) {
    const t = by.get(s.user_id);
    if (!t) {
      by.set(s.user_id, {
        user_id: s.user_id,
        name: s.name,
        avatar_url: s.avatar_url,
        color: s.color,
        distance_meters: s.distance_meters,
        moving_seconds: s.moving_seconds,
        sessions: 1,
        running: isSessionActive(s),
        first_started_at: s.started_at,
      });
      continue;
    }
    t.distance_meters += s.distance_meters;
    t.moving_seconds += s.moving_seconds;
    t.sessions += 1;
    t.running ||= isSessionActive(s);
    if (s.started_at < t.first_started_at) t.first_started_at = s.started_at;
  }
  return [...by.values()].sort((a, b) => b.distance_meters - a.distance_meters || a.moving_seconds - b.moving_seconds);
}

/* Club editions run midnight to midnight in India (UTC+05:30, no daylight saving). */
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 24 * 3600_000;
export const MAX_EDITION_DAYS_BACK = 30;

/** `YYYY-MM-DD` of an instant in Asia/Kolkata. */
export const kolkataDate = (ms: number = Date.now()) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
const fromDayNumber = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);

/**
 * Moves an edition date by `delta` days, kept between 30 days ago and today. Returns null for
 * "today" so callers poll the live edition instead of asking for a fixed date.
 */
export function stepEdition(current: string | null, delta: number, now: number = Date.now()): string | null {
  const today = dayNumber(kolkataDate(now));
  const from = current ? dayNumber(current) : today;
  const next = Math.min(today, Math.max(today - MAX_EDITION_DAYS_BACK, from + delta));
  return next === today ? null : fromDayNumber(next);
}

/** "Today", "Yesterday" or "Mon, 20 Oct" for an edition date (null = today). */
export function editionLabel(date: string | null, now: number = Date.now()): string {
  if (!date) return 'Today';
  const diff = dayNumber(kolkataDate(now)) - dayNumber(date);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(`${date}T00:00:00Z`);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  return `${wd}, ${d.getUTCDate()} ${mo}`;
}

/* ---------------- Open-room end time ---------------- */

export const MIN_OPEN_MS = 15 * 60_000;
export const MAX_OPEN_MS = 30 * DAY_MS;

/** Why an open room's end time is not allowed, or null when it is. */
export function endsAtError(endsAt: Date | number, now: number = Date.now()): string | null {
  const t = typeof endsAt === 'number' ? endsAt : endsAt.getTime();
  if (!Number.isFinite(t)) return 'Pick when the room closes.';
  if (t < now + MIN_OPEN_MS) return 'The room must stay open for at least 15 minutes.';
  if (t > now + MAX_OPEN_MS) return 'Rooms can stay open for up to 30 days.';
  return null;
}

/** "ends in 25 min" / "ends in 5h" / "ends in 3 days" / "ended". */
export function endsInText(endsAt: string | null | undefined, now: number = Date.now()): string | null {
  if (!endsAt) return null;
  const ms = Date.parse(endsAt) - now;
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'ended';
  const min = Math.round(ms / 60_000);
  if (min < 60) return `ends in ${Math.max(1, min)} min`;
  const h = Math.round(ms / 3600_000);
  if (h < 48) return `ends in ${h}h`;
  return `ends in ${Math.round(ms / DAY_MS)} days`;
}

const active = (m: RoomMember) => m.state !== 'left' && m.state !== 'invited';

/** Runners ranked by distance (furthest first); ties go to the one with less moving time. */
export function rankRunners(members: RoomMember[]): RoomMember[] {
  return members
    .filter(m => m.role === 'runner' && active(m))
    .slice()
    .sort((a, b) => {
      const da = a.distance_meters ?? -1;
      const db = b.distance_meters ?? -1;
      if (db !== da) return db - da;
      return (a.moving_seconds ?? Infinity) - (b.moving_seconds ?? Infinity);
    });
}

export function formatGapDistance(meters: number): string {
  const m = Math.abs(meters);
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

/**
 * "120 m ahead" / "1.20 km behind" / "Level" for `other` compared with `me`.
 * Returns null when either has no distance yet.
 */
export function gapText(other: Pick<RoomMember, 'distance_meters'>, me: Pick<RoomMember, 'distance_meters'>): string | null {
  if (other.distance_meters == null || me.distance_meters == null) return null;
  const d = other.distance_meters - me.distance_meters;
  if (Math.abs(d) < 10) return 'Level';
  return `${formatGapDistance(d)} ${d > 0 ? 'ahead' : 'behind'}`;
}

/** Gap to the leader for a ranked list, as shown when the viewer is a spectator ("Leader", "+240 m"). */
export function gapToLeader(ranked: RoomMember[], index: number): string {
  if (index === 0) return 'Leader';
  const lead = ranked[0]?.distance_meters;
  const mine = ranked[index]?.distance_meters;
  if (lead == null || mine == null) return '—';
  return `−${formatGapDistance(lead - mine)}`;
}

export const CHEER_KINDS: CheerKind[] = ['clap', 'fire', 'go', 'strong', 'almost'];

export const CHEER_TEXT: Record<CheerKind, { label: string; message: string }> = {
  clap: { label: 'Nice', message: 'Nice pace!' },
  fire: { label: 'On fire', message: 'You’re on fire!' },
  go: { label: 'Go', message: 'Keep going!' },
  strong: { label: 'Strong', message: 'Stay strong!' },
  almost: { label: 'Almost', message: 'Almost there!' },
};

/** First name for compact labels ("Rahul" from "Rahul Verma"). */
export const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || 'Runner';

/** Members that are actually in the room (not invited-only, not left). */
export const presentMembers = (room: RunRoom | null | undefined) => (room?.members ?? []).filter(active);

/* ---------------- Map heads ---------------- */

export type LatLngPoint = { latitude: number; longitude: number };
export type MapHead = { session: RoomSession; at: LatLngPoint; active: boolean };

/**
 * Where to draw each runner on a room map. Other runners come from the server (live position, else the
 * end of their trail). My own marker, while my run is shared to this room, always comes from the phone
 * (`myHere`: the latest GPS fix), so it shows from the first fix and ignores server lag or trimming; it
 * is drawn even before the server lists my session.
 */
export function buildMapHeads({
  sessions,
  trails,
  me,
  myHere,
  viewingPast,
  ownMember,
  fallbackColor,
}: {
  sessions: RoomSession[];
  trails: Record<string, TrailPoint[] | undefined>;
  me?: string;
  /** Set only while my run is being shared to this room. */
  myHere: LatLngPoint | null;
  viewingPast: boolean;
  ownMember?: Pick<RoomMember, 'name' | 'avatar_url' | 'color'> | null;
  fallbackColor: string;
}): MapHead[] {
  const out: MapHead[] = [];
  const mineLive = !viewingPast && !!myHere && !!me;
  let drewMe = false;
  for (const s of sessions) {
    const live = isSessionActive(s) && !viewingPast;
    if (mineLive && s.user_id === me && isSessionActive(s)) {
      if (drewMe) continue;
      drewMe = true;
      out.push({ session: s, at: myHere as LatLngPoint, active: true });
      continue;
    }
    const t = trails[s.id];
    const last = t?.[t.length - 1];
    if (live && s.last_lat != null && s.last_lng != null) out.push({ session: s, at: { latitude: s.last_lat, longitude: s.last_lng }, active: live });
    else if (last) out.push({ session: s, at: { latitude: last.lat, longitude: last.lng }, active: live });
  }
  if (mineLive && !drewMe) {
    out.push({
      session: {
        id: 'me',
        user_id: me as string,
        name: ownMember?.name ?? 'You',
        avatar_url: ownMember?.avatar_url ?? null,
        color: ownMember?.color ?? fallbackColor,
        edition_date: '',
        state: 'running',
        started_at: '',
        ended_at: null,
        distance_meters: 0,
        moving_seconds: 0,
        avg_pace_sec_per_km: null,
        current_pace_sec_per_km: null,
        last_lat: null,
        last_lng: null,
        last_seen_at: null,
      },
      at: myHere as LatLngPoint,
      active: true,
    });
  }
  // Me on top: drawn last.
  return out.sort((a, b) => Number(a.session.user_id === me && a.active) - Number(b.session.user_id === me && b.active));
}
