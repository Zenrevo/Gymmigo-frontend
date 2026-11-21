import api from '../utils/api';

export type Level = { level: number; name: string; threshold: number; blurb?: string };
export type Mission = {
  id: string; date: string; kind: 'daily' | 'weekly'; core: boolean; category: string; difficulty: string; base_cp: number; title: string;
  instructions: string | null; safety_note: string | null; verification: string; self_report: boolean; target: Record<string, unknown>;
  expires_at: string; status: 'issued' | 'completed' | 'expired' | 'void'; completed_at: string | null;
};
export type Dimension = { name: string; weight: number; score: number | null; why: string | null };
export type ClubStanding = {
  gym: { id: string; name: string | null; program_enabled: boolean };
  gyms: { id: string; name: string | null }[];
  level: Level; next_level: Level | null; progress_pct: number; active_cp: number; lifetime_cp: number; cp_to_next: number;
  multiplier: { value: number; label: string; until: string | null };
  gcpi: { score: number | null; dimensions: Record<string, Dimension>; period: { start: string; end: string } | null; next_review: string; notes: string[] };
  streak_weeks: number; global_streak_grace_until: string | null;
  this_week: { core_issued: number; core_done: number; threshold_pct: number };
  review: { status: string; message: string | null; requalify_until: string | null; previous_level: number | null; deficient_weeks_in_a_row: number };
  shield: { held: number; max: number; days_needed: number | null; qualifying_days: number; available_at_level: boolean };
  missions: Mission[];
  coins: { gym_balance: number; cycle_ceiling: number; issued_this_cycle: number; cashback_pct: number };
  ladder: Level[];
  limits: { daily_cap: number; weekly_cap: number; category_caps: Record<string, number> };
};
export type Tx = { id: string; at: string; kind: string; source: string; category: string | null; base_cp: number; multiplier: number; cp: number;
  lifetime_delta: number; cap: string | null; reason: string | null; status: string };
export type Reward = { id: string; name: string; description: string | null; category: string; sponsor_name: string | null; reward_type: string;
  min_level: number; discount_pct: number | null; discount_inr: number | null; max_discount_inr: number | null; min_spend_inr: number | null;
  coin_cost: number | null; left: number | null; per_member_limit: number; ends_on: string | null; restrictions: string | null;
  member_value_inr: number | null; eligible?: boolean; used?: number };
export type Redemption = { id: string; code: string; status: string; reward: string | null; created_at: string; expires_at: string | null; coins_spent: number };
export type Coins = { total: number; coin_value_inr: number; buckets: { bucket: string; gym: string | null; balance: number; next_expiry: string | null }[];
  rules: { invoice_cap_pct: number; expiry_days: number };
  history: { id: string; at: string; bucket: string; direction: string; amount: number; reason: string; balance_after: number; expires_at: string | null; note: string | null }[] };
export type History = {
  evaluations: { start: string; end: string; gcpi: number; multiplier: number; label: string; dimensions: Record<string, number>; penalty: number; review: string; data_ok: boolean }[];
  weeks: { week_start: string; available: number; completed: number; compliance: number | null; qualifying: boolean; deficient: boolean; severity: number; raw_penalty: number; protected: string | null }[];
};
export type Passport = { lifetime_cp: number; best_level: Level; streak_grace_until: string | null; cooldown_days_left: number;
  gyms: { gym_id: string; gym: string | null; level: Level; active_cp: number; active: boolean }[];
  transfers: { id: string; to_gym_id: string; status: string; passport: Record<string, unknown> | null; created_at: string }[];
  rules: { level_drop: number; requalify_days: number; streak_grace_days: number } };

const data = <T,>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const clubsV2 = {
  me: (gymId?: string) => data<ClubStanding>(api.get('/clubs/v2/me', { params: gymId ? { gym_id: gymId } : {} })),
  complete: (id: string) => data<Mission>(api.post(`/clubs/v2/missions/${id}/complete`)),
  ledger: (gymId?: string) => data<Tx[]>(api.get('/clubs/v2/ledger', { params: gymId ? { gym_id: gymId } : {} })),
  history: (gymId?: string) => data<History>(api.get('/clubs/v2/history', { params: gymId ? { gym_id: gymId } : {} })),
  rewards: (gymId?: string) => data<Reward[]>(api.get('/clubs/v2/rewards', { params: gymId ? { gym_id: gymId } : {} })),
  redeem: (id: string) => data<Redemption>(api.post(`/clubs/v2/rewards/${id}/redeem`)),
  redemptions: () => data<Redemption[]>(api.get('/clubs/v2/redemptions')),
  coins: () => data<Coins>(api.get('/clubs/v2/coins')),
  passport: () => data<Passport>(api.get('/clubs/v2/passport')),
  protect: (body: { gym_id?: string; reason: string; starts_on: string; ends_on: string; note?: string }) => data(api.post('/clubs/v2/protections', body)),
  appeal: (body: { gym_id?: string; cp_transaction_id?: string; mission_id?: string; message: string }) => data(api.post('/clubs/v2/appeals', body)),
  transfer: (body: { from_gym_id: string; to_gym_id: string; note?: string }) => data(api.post('/clubs/v2/passport/transfer', body)),
};
