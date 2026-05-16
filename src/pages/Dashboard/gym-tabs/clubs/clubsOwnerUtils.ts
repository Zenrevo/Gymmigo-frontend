import type { ClubConfig } from '../../../../types/clubs';

/** Canonical retention_v3 ladder — must match backend DEFAULT_BADGE_MISSIONS order. */
export const RETENTION_MISSION_CODES = [
  'tier_01_foundation',
  'tier_02_rhythm',
  'tier_03_iron_program',
  'tier_04_anchor',
  'tier_05_fuel',
  'tier_06_quarter',
  'tier_07_elite_streak',
  'tier_08_founders',
] as const;

const RETENTION_MISSION_CODE_SET = new Set<string>(RETENTION_MISSION_CODES);

/** Ensure API/LLM draft payloads always match ClubConfig shape (prevents render crashes). */
export const normalizeClubConfig = (raw: Partial<ClubConfig> & Record<string, unknown>): ClubConfig => {
  const mission = (raw.mission && typeof raw.mission === 'object' ? raw.mission : {}) as ClubConfig['mission'];
  const badge = (raw.badge && typeof raw.badge === 'object' ? raw.badge : {}) as ClubConfig['badge'];
  const unlocks = (raw.unlocks && typeof raw.unlocks === 'object' ? raw.unlocks : {}) as Record<string, unknown>;

  return {
    id: String(raw.id || raw.mission_code || ''),
    mission_code: String(raw.mission_code || ''),
    club_code: String(raw.club_code || raw.mission_code || ''),
    club_name: String(raw.club_name || 'Club'),
    club_definition: (raw.club_definition as string) ?? null,
    mission: {
      title: String(mission.title || (raw.mission_title as string) || 'Club mission'),
      description: String(mission.description || (raw.mission_description as string) || ''),
      mission_type: String(mission.mission_type || (raw.mission_type as string) || 'check_in_count'),
      target_value: Math.max(1, Number(mission.target_value ?? raw.target_value ?? 1)),
      points: Math.max(0, Number(mission.points ?? raw.points ?? 0)),
    },
    badge: {
      name: String(badge.name || (raw.badge_name as string) || 'Badge'),
      icon: badge.icon ?? (raw.badge_icon as string) ?? null,
      color: badge.color ?? (raw.badge_color as string) ?? null,
    },
    facilities: Array.isArray(raw.facilities) ? raw.facilities.map(String) : [],
    reward_preview: (raw.reward_preview as string) ?? null,
    share_cta: (raw.share_cta as string) ?? null,
    display_order: Number(raw.display_order ?? 0),
    is_active: raw.is_active !== false,
    tier: (raw.tier as number) ?? (unlocks.tier as number) ?? null,
    timeline_label: (raw.timeline_label as string) ?? (unlocks.timeline_label as string) ?? null,
    timeline_min_days: raw.timeline_min_days as number | undefined,
    timeline_max_days: raw.timeline_max_days as number | undefined,
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(String) : [],
    task_types: Array.isArray(raw.task_types) ? raw.task_types.map(String) : [],
    goal_tracks: (raw.goal_tracks as ClubConfig['goal_tracks']) ?? undefined,
    rewards: Array.isArray(raw.rewards) ? raw.rewards : [],
    reward_sources: Array.isArray(raw.reward_sources) ? raw.reward_sources.map(String) : [],
    fee_discount_percent: raw.fee_discount_percent as number | null | undefined,
    supplement_discount_percent: raw.supplement_discount_percent as number | null | undefined,
    free_trainer_sessions_per_month: raw.free_trainer_sessions_per_month as number | null | undefined,
    estimated_reward_cost_inr: raw.estimated_reward_cost_inr as number | null | undefined,
    user_perceived_value: (raw.user_perceived_value as string) ?? null,
    business_benefit: (raw.business_benefit as string) ?? null,
    momentum_rules: raw.momentum_rules ?? undefined,
    comeback_mission: raw.comeback_mission ?? undefined,
    protected_status: Boolean(raw.protected_status ?? unlocks.protected_status),
    negative_marking_stops: Boolean(raw.negative_marking_stops ?? unlocks.negative_marking_stops),
    transfer_carry_eligible: Boolean(raw.transfer_carry_eligible ?? unlocks.transfer_carry_eligible),
    first_month_renewal_hook: Boolean(raw.first_month_renewal_hook ?? unlocks.first_month_renewal_hook),
    renewal_hook: Boolean(raw.renewal_hook ?? unlocks.renewal_hook),
    owner_warning_notes: Array.isArray(raw.owner_warning_notes) ? raw.owner_warning_notes.map(String) : [],
    migo_recommendation_template: (raw.migo_recommendation_template as string) ?? null,
    unlocks,
    framework_version: (raw.framework_version as string) ?? undefined,
  };
};

export const normalizeClubList = (items: unknown[]): ClubConfig[] => {
  const byCode = new Map<string, ClubConfig>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const club = normalizeClubConfig(item as Record<string, unknown>);
    if (!RETENTION_MISSION_CODE_SET.has(club.mission_code)) continue;
    byCode.set(club.mission_code, club);
  }
  return RETENTION_MISSION_CODES.map((code) => byCode.get(code)).filter((club): club is ClubConfig => Boolean(club));
};

export const toLinesText = (items?: string[]) => (items || []).join('\n');
export const fromLinesText = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);

export const sourceLabel = (value?: string) => {
  if (value === 'gym_owner') return 'Gym owner funded';
  if (value === 'gymmigo') return 'Gymmigo funded';
  if (value === 'supplement_partner') return 'Supplement partner';
  return value || 'Source missing';
};

export const clubToPublishPayload = (club: ClubConfig, generationInputs: { max_fee_discount_percent: number; max_supplement_discount_percent: number; supplement_partner_enabled: boolean; trainer_available: boolean; body_composition_scan_supported: boolean; protection_enabled: boolean }) => ({
  mission_code: club.mission_code,
  club_name: club.club_name.trim(),
  club_definition: (club.club_definition || '').trim(),
  mission_title: club.mission.title.trim(),
  mission_description: club.mission.description.trim(),
  mission_type: club.mission.mission_type,
  target_value: Math.max(1, Number(club.mission.target_value) || 1),
  points: Math.max(0, Number(club.mission.points) || 0),
  badge_name: club.badge.name.trim(),
  facilities: (club.facilities || []).map((facility) => facility.trim()).filter(Boolean),
  reward_preview: club.reward_preview || '',
  share_cta: club.share_cta || '',
  timeline_label: club.timeline_label || '',
  timeline_min_days: club.timeline_min_days || undefined,
  timeline_max_days: club.timeline_max_days || undefined,
  tasks: club.tasks || [],
  task_types: club.task_types || [],
  goal_tracks: club.goal_tracks || undefined,
  rewards: club.rewards || [],
  reward_sources: club.reward_sources || [],
  fee_discount_percent: Number(club.fee_discount_percent || 0),
  supplement_discount_percent: Number(club.supplement_discount_percent || 0),
  free_trainer_sessions_per_month: Number(club.free_trainer_sessions_per_month || 0),
  estimated_reward_cost_inr: Number(club.estimated_reward_cost_inr || 0),
  user_perceived_value: club.user_perceived_value || '',
  business_benefit: club.business_benefit || '',
  momentum_rules: club.momentum_rules || undefined,
  comeback_mission: club.comeback_mission || undefined,
  protected_status: !!club.protected_status,
  negative_marking_stops: !!club.protected_status,
  transfer_carry_eligible: !!club.transfer_carry_eligible,
  first_month_renewal_hook: !!club.first_month_renewal_hook,
  renewal_hook: !!club.renewal_hook,
  owner_warning_notes: club.owner_warning_notes || [],
  migo_recommendation_template: club.migo_recommendation_template || '',
  owner_limits: {
    max_fee_discount_percent: generationInputs.max_fee_discount_percent,
    max_supplement_discount_percent: generationInputs.max_supplement_discount_percent,
  },
  supplement_partner_enabled: generationInputs.supplement_partner_enabled,
  trainer_available: generationInputs.trainer_available,
  body_composition_scan_supported: generationInputs.body_composition_scan_supported,
  protection_enabled: generationInputs.protection_enabled,
  is_active: club.is_active,
});

export const getOwnerWarnings = (
  club: ClubConfig,
  tier: number,
  totalClubs: number,
  generationInputs: { supplement_partner_enabled: boolean; trainer_available: boolean }
) => [
  ...(club.owner_warning_notes || []),
  ...(club.supplement_discount_percent && !generationInputs.supplement_partner_enabled
    ? ['Supplement reward requires supplement partner']
    : []),
  ...(club.free_trainer_sessions_per_month && !generationInputs.trainer_available
    ? ['Trainer session reward requires available trainer']
    : []),
  ...(tier === 1 && !club.first_month_renewal_hook ? ['First month reward missing'] : []),
  ...(tier <= 2 && !club.fee_discount_percent ? ['No renewal reward in early clubs'] : []),
  ...(tier >= totalClubs - 1 && !club.protected_status ? ['Top club should feel rare and protected'] : []),
].filter(Boolean);
