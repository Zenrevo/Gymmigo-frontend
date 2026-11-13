/** Migo AI: chat, recommendations (day plans), weekly schedule. Mirrors the app's src/types/ai.ts. */

export type ChatRole = 'user' | 'model';

export type ChatMessagePayload = {
  role: ChatRole | string;
  content: string;
  image_base64?: string;
  image_mime_type?: string;
};

export type ExerciseMedia = {
  name?: string;
  sets?: number | string | null;
  reps?: number | string | null;
  target_muscle?: string | null;
  equipment?: string | null;
  gif_url?: string | null;
  image_url?: string | null;
  demo_gif_url?: string | null;
  demo_video_url?: string | null;
  youtube_url?: string | null;
  exercise_db?: {
    gif_url?: string | null;
    image_url?: string | null;
    youtube_url?: string | null;
    video_url?: string | null;
    instructions?: string[];
    target_muscles?: string[];
    body_parts?: string[];
    equipments?: string[];
  } | null;
  [key: string]: unknown;
};

export type YouTubeVideo = { title?: string; url?: string; thumbnail?: string; channel?: string; query?: string };

export type ChatMedia = { exercises?: ExerciseMedia[]; videos?: YouTubeVideo[] };

export type RecommendationExercise = ExerciseMedia & { name: string };

export type Recommendation = {
  id: string;
  type: 'workout' | 'diet' | string;
  date_for: string;
  title?: string | null;
  is_active?: boolean;
  is_completed?: boolean;
  duration?: string | number | null;
  intensity?: string | null;
  content?: string | null;
  score?: number | null;
  score_label?: string | null;
  generation_count?: number | null;
  created_at?: string;
  program_id?: string | null;
  program_day?: number | null;
  structured_data?: {
    focus?: string;
    description?: string;
    duration?: string | number;
    intensity?: string;
    score?: number;
    score_label?: string;
    calendar_tag?: string;
    exercises?: RecommendationExercise[];
    [key: string]: unknown;
  } | null;
};

export type WeeklyScheduleBody = { start_date: string; days: number; force: boolean; user_instructions?: string };
