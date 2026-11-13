import type { ExerciseMedia } from '../../types/ai';

export const https = (u?: string | null) => (u ? u.replace(/^http:\/\//i, 'https://') : null);

export const mediaUrl = (e: ExerciseMedia) => https(e.exercise_db?.gif_url ?? e.exercise_db?.image_url ?? e.demo_gif_url ?? e.gif_url ?? e.image_url ?? null);
export const youtubeUrl = (e: ExerciseMedia) => e.exercise_db?.youtube_url ?? e.exercise_db?.video_url ?? e.demo_video_url ?? e.youtube_url ?? null;
export const exerciseMeta = (e: ExerciseMedia) => ({
  target: e.target_muscle ?? e.exercise_db?.target_muscles?.[0] ?? e.exercise_db?.body_parts?.[0] ?? null,
  equipment: e.equipment ?? e.exercise_db?.equipments?.[0] ?? null,
});

