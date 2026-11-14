import { http, pathId } from './envelope';
import type { UserCard } from './social';

/* Group runs (docs/revamp/08-RUN-ROOMS-AND-SOCIAL-API.md §2 and §4). */

export type RoomStatus = 'lobby' | 'live' | 'finished';
/** live: host starts/ends it · open: join and run any time until `ends_at` · club: the official never-ending room. */
export type RoomKind = 'live' | 'open' | 'club';
export type SessionState = 'running' | 'paused' | 'finished';
export type MemberRole = 'runner' | 'spectator';
export type MemberState = 'invited' | 'joined' | 'running' | 'paused' | 'finished' | 'left';
export type CheerKind = 'clap' | 'fire' | 'go' | 'strong' | 'almost';

export type RoomMember = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: MemberRole;
  state: MemberState;
  is_host: boolean;
  color: string;
  distance_meters: number | null;
  moving_seconds: number | null;
  avg_pace_sec_per_km: number | null;
  current_pace_sec_per_km: number | null;
  last_lat: number | null;
  last_lng: number | null;
  last_accuracy: number | null;
  last_seen_at: string | null;
};

/** One runner's run inside one room (a GPS run can feed up to 3 rooms, one session each). */
export type RoomSession = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  color: string;
  edition_date: string;
  state: SessionState;
  started_at: string;
  ended_at: string | null;
  distance_meters: number;
  moving_seconds: number;
  avg_pace_sec_per_km: number | null;
  current_pace_sec_per_km: number | null;
  /** Null when the runner is inside their start privacy zone (others' sessions only). */
  last_lat: number | null;
  last_lng: number | null;
  last_seen_at: string | null;
};

export type RoomToday = { runners: number; sessions: number; distance_meters: number };

export type RunRoom = {
  id: string;
  code: string;
  title: string;
  /** Null for the official club. */
  host_id: string | null;
  status: RoomStatus;
  /** Older servers omit these three: treat as a live room. */
  kind?: RoomKind;
  is_official?: boolean;
  ends_at?: string | null;
  edition_date?: string | null;
  today?: RoomToday | null;
  max_runners: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  share_url: string;
  my_role: MemberRole | null;
  my_state: MemberState | null;
  members: RoomMember[];
  invited: UserCard[];
};

export type TrailPoint = { seq: number; lat: number; lng: number; t: string };

export type Cheer = {
  id: string;
  seq: number;
  from_user_id: string;
  from_name: string;
  to_user_id: string | null;
  kind: CheerKind;
  created_at: string;
};

export type LiveState = {
  room: RunRoom;
  cursor: number;
  /** The club edition returned (YYYY-MM-DD); null for live and open rooms. */
  date?: string | null;
  sessions?: RoomSession[];
  /** Keyed by session id (older servers: by user id). Privacy-trimmed for other runners. */
  trails: Record<string, TrailPoint[]>;
  cheers: Cheer[];
};

export type MyRooms = { active: RunRoom[]; invites: RunRoom[]; recent: RunRoom[]; club?: RunRoom; open?: RunRoom[] };

/** A row of the "Joined" page. Totals cover the edition date (club) or the whole room. */
export type RoomMemberSummary = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  color: string;
  role: MemberRole;
  joined_at: string;
  last_run_at: string | null;
  sessions: number;
  distance_meters: number;
  moving_seconds: number;
  best_pace_sec_per_km: number | null;
  running_now: boolean;
};

export type MemberPage = { items: RoomMemberSummary[]; page: number; page_size: number; total: number };

export type CreateRoomBody = { title?: string; kind?: 'live' | 'open'; ends_at?: string };

export type LocationPost = {
  session_id?: string;
  points: { lat: number; lng: number; t: string }[];
  state: 'running' | 'paused' | 'finished';
  distance_meters: number;
  moving_seconds: number;
  avg_pace_sec_per_km: number | null;
  current_pace_sec_per_km: number | null;
  accuracy: number | null;
};

const id = pathId;

export const runRoomsApi = {
  create: (body: CreateRoomBody = {}) => http.post<RunRoom>('/run-rooms', body),
  mine: () => http.get<MyRooms>('/run-rooms'),
  /** The official Gymmigo Run Club (preview for non-members). */
  club: () => http.get<RunRoom>('/run-rooms/club'),
  /** Room id or 6-char code. Non-members get a preview (`my_role: null`). */
  get: (idOrCode: string) => http.get<RunRoom>(`/run-rooms/${id(idOrCode)}`),
  /** Join by 6-char code, or by room id (`{ roomId }`) for the club and rooms found in lists. */
  join: (target: string | { roomId: string }, role: MemberRole) =>
    http.post<RunRoom>('/run-rooms/join', typeof target === 'string' ? { code: target, role } : { room_id: target.roomId, role }),
  invite: (roomId: string, userIds: string[]) => http.post<RunRoom>(`/run-rooms/${id(roomId)}/invite`, { user_ids: userIds }),
  start: (roomId: string) => http.post<RunRoom>(`/run-rooms/${id(roomId)}/start`),
  finish: (roomId: string) => http.post<RunRoom>(`/run-rooms/${id(roomId)}/finish`),
  leave: (roomId: string) => http.post<{ ok: boolean }>(`/run-rooms/${id(roomId)}/leave`),
  remove: (roomId: string, userId: string) => http.post<RunRoom>(`/run-rooms/${id(roomId)}/remove`, { user_id: userId }),
  location: (roomId: string, body: LocationPost) => http.post<{ cursor: number }>(`/run-rooms/${id(roomId)}/location`, body),
  /** Starts (or returns the unfinished) session for the caller in this room. 409 TOO_MANY_ACTIVE_SESSIONS past 3. */
  startSession: (roomId: string) => http.post<RoomSession>(`/run-rooms/${id(roomId)}/sessions`, {}),
  live: (roomId: string, since: number, date?: string | null) =>
    http.get<LiveState>(`/run-rooms/${id(roomId)}/live`, { params: date ? { since, date } : { since } }),
  members: (roomId: string, opts: { date?: string | null; page?: number } = {}) =>
    http.get<MemberPage>(`/run-rooms/${id(roomId)}/members`, {
      params: { page: opts.page ?? 1, ...(opts.date ? { date: opts.date } : null) },
    }),
  cheer: (roomId: string, kind: CheerKind, toUserId?: string | null) =>
    http.post<Cheer>(`/run-rooms/${id(roomId)}/cheers`, toUserId ? { kind, to_user_id: toUserId } : { kind }),
};
