import type { Recommendation, RecommendationExercise } from '../../types/ai';
import { plainTitle } from './markdownBlocks';

/** First non-empty string/number among `keys` of a loose object, as a string. */
export const pickField = (obj: Record<string, unknown> | null | undefined, keys: string[]): string | null => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
};

/** "52" → "52 min"; free text passes through. */
export const durationLabel = (d: string | number | null | undefined) => {
  if (d == null || d === '') return null;
  return /^\d+(\.\d+)?$/.test(String(d).trim()) ? `${d} min` : String(d);
};

/** "4 sets × 5 reps" (whatever the plan provides). */
export const setsReps = (e: Pick<RecommendationExercise, 'sets' | 'reps'>) =>
  [e.sets ? `${e.sets} sets` : null, e.reps ? `${e.reps} reps` : null].filter(Boolean).join(' × ');

/** Optional per-exercise coaching fields some plans carry (rest, tempo, notes). */
export const exerciseExtras = (e: RecommendationExercise) => {
  const raw = e as unknown as Record<string, unknown>;
  const rest = pickField(raw, ['rest', 'rest_seconds', 'rest_time', 'rest_interval']);
  return {
    rest: rest && /^\d+$/.test(rest) ? `${rest}s rest` : rest ? `${rest} rest` : null,
    tempo: pickField(raw, ['tempo']),
    notes: pickField(raw, ['notes', 'note', 'cue', 'coaching_cue', 'instructions']),
    load: pickField(raw, ['weight', 'load']),
  };
};

/** Display fields for a plan card or sheet, using only what the API returned. */
export function planMeta(rec: Recommendation) {
  const sd = rec.structured_data ?? {};
  const raw = sd as Record<string, unknown>;
  return {
    isWorkout: rec.type === 'workout',
    // AI titles can be a raw table header ("| Meal | Items |") or carry [METER] tags; never show those.
    title:
      plainTitle(sd.focus) ||
      plainTitle(rec.title) ||
      (rec.type === 'workout' ? plainTitle(rec.content) : null) ||
      (rec.type === 'diet' ? 'Today’s meal plan' : rec.type === 'workout' ? 'Today’s workout' : 'Today’s plan'),
    category: pickField(raw, ['category', 'workout_type', 'split', 'phase']),
    location: pickField(raw, ['location', 'gym_name', 'venue']),
    rpe: pickField(raw, ['target_rpe', 'rpe']),
    duration: durationLabel(sd.duration ?? rec.duration),
    intensity: (sd.intensity ?? rec.intensity) || null,
    score: sd.score ?? rec.score ?? null,
    scoreLabel: (sd.score_label ?? rec.score_label) || null,
    exercises: sd.exercises ?? [],
    description: typeof sd.description === 'string' && sd.description.trim() ? sd.description.trim() : null,
    macros: (
      [
        ['Calories', pickField(raw, ['calories', 'total_calories'])],
        ['Protein', pickField(raw, ['protein', 'protein_g'])],
        ['Carbs', pickField(raw, ['carbs', 'carbs_g'])],
        ['Fats', pickField(raw, ['fats', 'fat', 'fat_g'])],
      ] as [string, string | null][]
    ).filter((m): m is [string, string] => !!m[1]),
  };
}
