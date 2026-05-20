export type ClubsLadderSummary = {
  total_tiers: number;
  current_tier: number;
  estimated_full_path_weeks?: number;
  gym_bound?: boolean;
  transfer_carry_from_tier?: number;
};

export type MissionLadderMeta = {
  framework_version?: string;
  tier?: number | null;
  stage?: number | null;
  estimated_weeks_min?: number | null;
  timeline_label?: string | null;
  timeline_min_days?: number | null;
  timeline_max_days?: number | null;
  owner_config_hint?: string | null;
  reward_tier?: string | null;
  wallet_credit_inr?: number | null;
  type?: string | null;
  transfer_carry_eligible?: boolean;
  protected_status?: boolean;
  first_month_renewal_hook?: boolean;
  fee_discount_percent?: number | null;
  supplement_discount_percent?: number | null;
  prerequisite_mission_code?: string | null;
};

export type LoyaltyWallet = {
  id: string;
  user_id: string;
  balance_inr: number;
  lifetime_earned_inr: number;
  lifetime_spent_inr: number;
  currency: string;
  updated_at?: string | null;
};

export type WalletTransaction = {
  id: string;
  amount_inr: number;
  signed_amount_inr: number;
  direction: 'credit' | 'debit';
  transaction_type: string;
  status?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  description: string;
  balance_after_inr: number;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  gym_id?: string | null;
};

export type ClubReward = {
  label: string;
  type?: string;
  source?: 'gym_owner' | 'gymmigo' | 'supplement_partner' | string;
  value?: string;
  reward_tier?: 'meaningful' | 'normal' | string | null;
  estimated_cost_inr?: number;
  wallet_credit_inr?: number | null;
  user_perceived_value?: string;
  condition?: string;
};

export type ComebackMission = {
  title?: string;
  description?: string;
  required_actions?: string[];
  restore_benefits?: boolean;
};

export type BenefitStatus = {
  status?: 'active' | 'warning' | 'momentum_reduced' | 'paused' | 'protected' | string;
  benefits_paused?: boolean;
  protected_status?: boolean;
  negative_marking_stops?: boolean;
  days_inactive?: number;
  momentum_score?: number;
  days_left_to_protect_benefit?: number | null;
  message?: string;
  comeback_mission_available?: boolean;
  comeback_mission?: ComebackMission | null;
};

export type MissionProgress = {
  mission: {
    code: string;
    title: string;
    description: string;
    mission_type: string;
    target_value: number;
    points: number;
  };
  badge: {
    name: string;
    icon?: string;
    color?: string;
  };
  club?: {
    code?: string;
    name?: string;
    definition?: string | null;
  } | null;
  progress_value: number;
  progress_percent: number;
  current_streak: number;
  best_streak: number;
  is_completed: boolean;
  completed_at?: string | null;
  fitcard_frame?: string | null;
  is_locked?: boolean;
  locked_reason?: string | null;
  prerequisite_mission_code?: string | null;
  ladder?: MissionLadderMeta;
  unlocks?: {
    category?: string;
    action_label?: string;
    facilities?: string[];
    club_definition?: string;
    reward_preview?: string;
    rewards?: ClubReward[];
    reward_sources?: string[];
    content?: string[];
    share_cta?: string;
    self_serve_logging?: boolean;
    timeline_label?: string;
    tasks?: string[];
    goal_tracks?: Record<string, string[]>;
    fee_discount_percent?: number;
    supplement_discount_percent?: number;
    protected_status?: boolean;
    transfer_carry_eligible?: boolean;
    comeback_mission?: ComebackMission | null;
    business_benefit?: string;
  };
  tasks?: string[];
  goal_tracks?: Record<string, string[]>;
  rewards?: ClubReward[];
  reward_sources?: string[];
  fee_discount_percent?: number | null;
  supplement_discount_percent?: number | null;
  free_trainer_sessions_per_month?: number | null;
  estimated_reward_cost_inr?: number | null;
  user_perceived_value?: string | null;
  business_benefit?: string | null;
  momentum_rules?: Record<string, unknown> | null;
  comeback_mission?: ComebackMission | null;
  protected_status?: boolean;
  negative_marking_stops?: boolean;
  transfer_carry_eligible?: boolean;
  first_month_renewal_hook?: boolean;
  migo_recommendation?: string | null;
  benefit_status?: BenefitStatus;
};

export type ClubConfig = {
  id: string;
  mission_code: string;
  club_code: string;
  club_name: string;
  club_definition?: string | null;
  mission: {
    title: string;
    description: string;
    mission_type: string;
    target_value: number;
    points: number;
  };
  badge: {
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  facilities: string[];
  reward_preview?: string | null;
  share_cta?: string | null;
  display_order: number;
  is_active: boolean;
  tier?: number | null;
  estimated_weeks_min?: number | null;
  timeline_label?: string | null;
  timeline_min_days?: number | null;
  timeline_max_days?: number | null;
  owner_config_hint?: string | null;
  owner_warning_notes?: string[];
  transfer_carry_eligible?: boolean;
  transfer_eligibility?: Record<string, unknown> | null;
  protected_status?: boolean;
  negative_marking_stops?: boolean;
  first_month_renewal_hook?: boolean;
  renewal_hook?: boolean;
  tasks?: string[];
  task_types?: string[];
  goal_tracks?: Record<string, string[]>;
  rewards?: ClubReward[];
  reward_sources?: string[];
  fee_discount_percent?: number | null;
  supplement_discount_percent?: number | null;
  free_trainer_sessions_per_month?: number | null;
  estimated_reward_cost_inr?: number | null;
  user_perceived_value?: string | null;
  business_benefit?: string | null;
  momentum_rules?: Record<string, unknown> | null;
  comeback_mission?: ComebackMission | null;
  migo_recommendation_template?: string | null;
  unlocks?: Record<string, unknown>;
  framework_version?: string;
};

export const TIER_TARGET_FLOORS: Record<string, number> = {
  tier_01_foundation: 8,
  tier_02_rhythm: 10,
  tier_03_iron_program: 30,
  tier_04_anchor: 75,
  tier_05_fuel: 90,
  tier_06_quarter: 120,
  tier_07_elite_streak: 64,
  tier_08_founders: 78,
};

export const COMPLETION_VIA_SYSTEM_COPY =
  'Complete via gym check-in, checkout, Migo, or your trainer — not manual logging here.';

export const allowsSelfServeTaskLog = (mission: MissionProgress) =>
  Boolean(mission.unlocks?.self_serve_logging);

export const getMissionTier = (mission: MissionProgress, fallback: number) =>
  mission.ladder?.tier ?? fallback;

export type PrimaryGoal = 'renewals' | 'retention' | 'supplements' | 'community';

export type ClubGenerationInputs = {
  primary_goal: PrimaryGoal;
  max_fee_discount_percent: number;
  max_supplement_discount_percent: number;
  gym_reward_budget_inr: number;
  supplement_partner_enabled: boolean;
  trainer_available: boolean;
  body_composition_scan_supported: boolean;
  protection_enabled: boolean;
  owner_notes: string;
};

export type ClubDraftSummary = {
  total_estimated_cost_inr: number;
  first_month_hook_tier: number | null;
  protected_tiers: number[];
  task_type_count: number;
  club_count: number;
};

export type ClubValidationResult = {
  errors: Array<{ code?: string; message: string; mission_code?: string }>;
  warnings: Array<{ code?: string; message: string; mission_code?: string }>;
};

export const PRIMARY_GOAL_OPTIONS: { id: PrimaryGoal; label: string; description: string }[] = [
  { id: 'renewals', label: 'More renewals', description: 'Hook members before month one ends' },
  { id: 'retention', label: 'Reduce drop-off', description: 'Build habits in the first 90 days' },
  { id: 'supplements', label: 'Supplement sales', description: 'Partner pricing and discipline rewards' },
  { id: 'community', label: 'Community growth', description: 'Referrals, mentors, and gym ambassadors' },
];

export const getTargetGuardrailWarning = (missionCode: string, target: number) => {
  const floor = TIER_TARGET_FLOORS[missionCode];
  if (floor && target < floor) {
    return `Target ${target} is below the recommended minimum (${floor}) for this tier — members may unlock too quickly.`;
  }
  return null;
};
