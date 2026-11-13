import {
  Activity,
  Bike,
  Dumbbell,
  Flower2,
  Footprints,
  Goal,
  Medal,
  Mountain,
  Target,
  Trophy,
  Volleyball,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { activityMeta, activityOf, speedKmh, type ActivityType } from '../../features/activity/activityTypes';
import { formatDuration, formatKm, formatPace } from '../../features/activity/runMath';
import type { RunRecord } from '../../features/activity/types';

export const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  run: Activity,
  walk: Footprints,
  cycle: Bike,
  hiking: Mountain,
  football: Goal,
  cricket: Target,
  badminton: Medal,
  tennis: Trophy,
  swimming: Waves,
  yoga: Flower2,
  basketball: Volleyball,
  other: Dumbbell,
};

/** "5.12 km · 5'59"/km" / "18.40 km · 24.1 km/h" / "1:30:00" — the second line of an activity row. */
export function activityLine(r: Pick<RunRecord, 'activityType' | 'distanceMeters' | 'durationSeconds' | 'avgPaceSecPerKm'>) {
  const meta = activityMeta(activityOf(r));
  const parts: string[] = [];
  if (meta.distance && r.distanceMeters > 0) {
    parts.push(`${formatKm(r.distanceMeters)} km`);
    parts.push(meta.showsSpeed ? `${(speedKmh(r.distanceMeters, r.durationSeconds) ?? 0).toFixed(1)} km/h` : `${formatPace(r.avgPaceSecPerKm)}/km`);
  }
  parts.push(formatDuration(r.durationSeconds));
  return parts.join(' · ');
}
