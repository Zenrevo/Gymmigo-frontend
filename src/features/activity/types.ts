import type { ActivityType } from './activityTypes';

export type { ActivityType };

/** Outdoor / manual run tracking. Shapes mirror the `/runs` API contract (snake_case on the wire). */

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';
export type RunSource = 'gps' | 'manual';
export type RunSurface = 'road' | 'treadmill' | 'trail' | 'track';

/** One accepted GPS fix. `t` is the moving time (ms, pauses excluded) when it was recorded. */
export type RunPoint = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  /** Wall-clock epoch ms. */
  timestamp: number;
  /** Moving time in ms when the fix was taken. */
  t: number;
  /** Increments after every pause so the route isn't joined across a pause. */
  segment: number;
};

export type RunSplit = {
  /** 1-based kilometre index. The last split may be partial (`distanceMeters < 1000`). */
  km: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecPerKm: number;
  elevationGainMeters: number;
};

/** A manual lap marker. Distance and time are for the lap itself (since the previous marker). */
export type RunLap = {
  /** 1-based. */
  index: number;
  /** Moving time (ms) when the lap was marked. */
  atMs: number;
  /** Cumulative distance when the lap was marked. */
  atMeters: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecPerKm: number | null;
};

export type CompletedRunPayload = {
  /** Client-generated id, used for idempotent upload and Health Connect dedupe. */
  clientId: string;
  /** Missing on runs saved before activity types existed: treat as 'run' (see activityOf). */
  activityType?: ActivityType;
  source: RunSource;
  surface: RunSurface;
  startedAt: string;
  endedAt: string;
  /** Moving time, pauses excluded. */
  durationSeconds: number;
  /** Wall time from start to finish, pauses included. */
  elapsedSeconds: number;
  distanceMeters: number;
  avgPaceSecPerKm: number | null;
  bestPaceSecPerKm: number | null;
  caloriesKcal: number;
  elevationGainMeters: number;
  coordinates: RunPoint[];
  splits: RunSplit[];
  /** Manual laps (app-side only for now; not part of the /runs contract). */
  laps?: RunLap[];
  perceivedEffort?: number | null;
  inclinePercent?: number | null;
  notes?: string | null;
  title?: string | null;
};

export type RunRecord = CompletedRunPayload & {
  /** Server id once uploaded. */
  id?: string | null;
  syncedAt?: string | null;
  healthExportedAt?: string | null;
};
