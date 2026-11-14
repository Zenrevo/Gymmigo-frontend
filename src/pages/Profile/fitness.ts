export type FitnessProfile = {
  primary_goal: string | null;
  activity_level: string | null;
  experience_level: string | null;
  height: number | null;
  current_weight: number | null;
  target_weight: number | null;
  dietary_preference: string | null;
  food_allergies: string[];
  injuries: string[];
  medical_conditions: string[];
  preferred_workout_duration: number | null;
  workout_days_per_week: number | null;
  notes_for_agent: string;
};

export const EMPTY_FITNESS: FitnessProfile = {
  primary_goal: null,
  activity_level: null,
  experience_level: null,
  height: null,
  current_weight: null,
  target_weight: null,
  dietary_preference: null,
  food_allergies: [],
  injuries: [],
  medical_conditions: [],
  preferred_workout_duration: null,
  workout_days_per_week: null,
  notes_for_agent: '',
};

export const humanize = (v?: string | null) => (v ? v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : null);

