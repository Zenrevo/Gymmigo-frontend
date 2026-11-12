/** Multi-day AI plan programs (docs/revamp/10-PLAN-PROGRAMS.md). */
export type ProgramKind = 'workout' | 'diet' | 'both';
export type ProgramStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ProgramDayType = 'workout' | 'diet' | 'rest';
export type ProgramLogStatus = 'done' | 'partial' | 'skipped';
export const PROGRAM_DURATIONS = [7, 30, 45, 90] as const;
export type ProgramDuration = (typeof PROGRAM_DURATIONS)[number];

export type ProgramLog = { status: ProgramLogStatus; rpe: number | null; feedback: string | null };

export type ProgramDay = {
  day: number;
  date: string;
  type: ProgramDayType;
  title: string;
  focus: string;
  recommendation_id: string | null;
  removed: boolean;
  log: ProgramLog | null;
};

export type ProgramPhase = { name: string; weeks: string; focus: string };

export type ProgramProgress = {
  day_index: number;
  days_done: number;
  days_partial: number;
  days_skipped: number;
  adherence_pct: number;
  streak: number;
};

export type Program = {
  id: string;
  title: string;
  kind: ProgramKind;
  duration_days: number;
  status: ProgramStatus;
  start_date: string;
  end_date: string;
  reminder_time: string | null;
  goal_note?: string | null;
  generation_count?: number;
  outline: { summary: string; phases: ProgramPhase[] };
  progress: ProgramProgress;
  today: ProgramDay | null;
  created_at: string;
  approved_at: string | null;
  days?: ProgramDay[];
};

export type ProgramLists = { drafts: Program[]; active: Program[]; past: Program[] };

export type CreateProgramBody = {
  kind: ProgramKind;
  duration_days: ProgramDuration;
  start_date?: string;
  goal_note?: string;
  days_per_week?: number;
  minutes_per_session?: number;
  reminder_time?: string;
};

export type LogProgramDayBody = { status: ProgramLogStatus; rpe?: number; feedback?: string };
