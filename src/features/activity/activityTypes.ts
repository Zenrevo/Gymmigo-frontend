/*
 * Activity types: GPS-trackable (run, walk, cycle, hiking) and manually logged sports.
 * Pure data + helpers so the tracker, repository and screens agree on limits and labels.
 */

export const ACTIVITY_TYPES = [
  'run',
  'walk',
  'cycle',
  'football',
  'cricket',
  'badminton',
  'tennis',
  'swimming',
  'yoga',
  'hiking',
  'basketball',
  'other',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivityMeta = {
  /** "Run", "Walk", "Ride", "Football"… */
  label: string;
  /** Lower-case noun for copy: "run", "walk", "ride", "football session". */
  noun: string;
  gps: boolean;
  /** Distance makes sense (asked for in manual logs, shown in lists). */
  distance: boolean;
  /** Fastest believable GPS speed (m/s); faster jumps are GPS noise. */
  maxSpeedMps: number;
  /** kcal per kg per km for distance activities. */
  kcalPerKgKm: number;
  /** Metabolic equivalent for time-based estimates (manual sports, or no distance). */
  met: number;
  /** Health Connect ExerciseType constant name. */
  hcType: string;
  /** Show speed (km/h) instead of pace (min/km). */
  showsSpeed: boolean;
};

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  run: { label: 'Run', noun: 'run', gps: true, distance: true, maxSpeedMps: 12, kcalPerKgKm: 1.0, met: 9.8, hcType: 'RUNNING', showsSpeed: false },
  walk: { label: 'Walk', noun: 'walk', gps: true, distance: true, maxSpeedMps: 4, kcalPerKgKm: 0.55, met: 3.5, hcType: 'WALKING', showsSpeed: false },
  cycle: { label: 'Ride', noun: 'ride', gps: true, distance: true, maxSpeedMps: 25, kcalPerKgKm: 0.3, met: 7.5, hcType: 'BIKING', showsSpeed: true },
  hiking: { label: 'Hike', noun: 'hike', gps: true, distance: true, maxSpeedMps: 4, kcalPerKgKm: 0.75, met: 6, hcType: 'HIKING', showsSpeed: false },
  football: { label: 'Football', noun: 'football session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 7, hcType: 'SOCCER', showsSpeed: false },
  cricket: { label: 'Cricket', noun: 'cricket session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 4.8, hcType: 'CRICKET', showsSpeed: false },
  badminton: { label: 'Badminton', noun: 'badminton session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 5.5, hcType: 'BADMINTON', showsSpeed: false },
  tennis: { label: 'Tennis', noun: 'tennis session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 7.3, hcType: 'TENNIS', showsSpeed: false },
  swimming: { label: 'Swim', noun: 'swim', gps: false, distance: true, maxSpeedMps: 3, kcalPerKgKm: 0, met: 8, hcType: 'SWIMMING_POOL', showsSpeed: false },
  yoga: { label: 'Yoga', noun: 'yoga session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 2.5, hcType: 'YOGA', showsSpeed: false },
  basketball: { label: 'Basketball', noun: 'basketball session', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 6.5, hcType: 'BASKETBALL', showsSpeed: false },
  other: { label: 'Workout', noun: 'workout', gps: false, distance: false, maxSpeedMps: 12, kcalPerKgKm: 0, met: 5, hcType: 'OTHER_WORKOUT', showsSpeed: false },
};

/** GPS start options shown on the activity hub, in order. */
export const GPS_ACTIVITIES: ActivityType[] = ['run', 'walk', 'cycle'];
/** Sports offered in "Log an activity", in order. */
export const LOGGABLE_ACTIVITIES: ActivityType[] = [
  'run', 'walk', 'cycle', 'football', 'cricket', 'badminton', 'tennis', 'swimming', 'yoga', 'hiking', 'basketball', 'other',
];

export const isActivityType = (v: unknown): v is ActivityType => typeof v === 'string' && (ACTIVITY_TYPES as readonly string[]).includes(v);
/** Older runs (and unknown values) are runs. */
export const activityOf = (r: { activityType?: string | null } | null | undefined): ActivityType =>
  isActivityType(r?.activityType) ? r.activityType : 'run';

export const activityMeta = (t: ActivityType | null | undefined) => ACTIVITY_META[t && isActivityType(t) ? t : 'run'];

/**
 * Calories: distance-based for GPS distance activities (net cost per km), otherwise MET × kg × hours.
 */
export function caloriesFor(type: ActivityType, opts: { meters: number; seconds: number; weightKg?: number }) {
  const meta = activityMeta(type);
  const kg = opts.weightKg && opts.weightKg > 0 ? opts.weightKg : 70;
  if (meta.kcalPerKgKm > 0 && opts.meters > 0) return Math.round((opts.meters / 1000) * kg * meta.kcalPerKgKm);
  return Math.round(meta.met * kg * (Math.max(0, opts.seconds) / 3600));
}

/** Speed in km/h from distance and moving time; null when there's too little to say. */
export function speedKmh(meters: number, seconds: number): number | null {
  if (meters < 10 || seconds <= 0) return null;
  return (meters / 1000) / (seconds / 3600);
}

/** 24.3 → "24.3"; null → "--". */
export const formatSpeed = (kmh: number | null | undefined) => (kmh == null || !Number.isFinite(kmh) || kmh <= 0 ? '--' : kmh.toFixed(1));

/** Pace (s/km) → km/h. */
export const paceToKmh = (secPerKm: number | null | undefined) => (secPerKm && secPerKm > 0 ? 3600 / secPerKm : null);

/** Health Connect exercise type number, looked up by constant name on the library's enum. */
export function hcExerciseType(type: ActivityType, surface: string | undefined, enumObj: Record<string, number | string>): number | null {
  const name = type === 'run' && surface === 'treadmill' ? 'RUNNING_TREADMILL' : activityMeta(type).hcType;
  const v = enumObj[name];
  if (typeof v === 'number') return v;
  const other = enumObj.OTHER_WORKOUT;
  return typeof other === 'number' ? other : null;
}

/** "Morning run", "Evening ride", "Afternoon football". */
export function defaultActivityTitle(type: ActivityType, at: Date) {
  const h = at.getHours();
  const part = h < 5 ? 'Night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
  const meta = activityMeta(type);
  return `${part} ${meta.distance && meta.gps ? meta.noun : meta.label.toLowerCase()}`;
}

/** Believable pace range (s/km) for a logged distance; null = not checked (time-based sports). */
export function paceBounds(type: ActivityType): [number, number] | null {
  switch (type) {
    case 'run':
      return [120, 1800];
    case 'walk':
    case 'hiking':
      return [240, 3600];
    case 'cycle':
      return [50, 900];
    default:
      return null;
  }
}

/** Human message for a pace outside `paceBounds`. */
export function paceBoundsMessage(type: ActivityType) {
  if (type === 'cycle') return 'Speed must be between 4 and 72 km/h. Check the distance and time.';
  if (type === 'walk' || type === 'hiking') return 'Pace must be between 4:00 and 60:00 per km. Check the distance and time.';
  return 'Pace must be between 2:00 and 30:00 per km. Check the distance and time.';
}
