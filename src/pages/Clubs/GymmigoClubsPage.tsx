import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Activity,
  Apple,
  Award,
  BadgeCheck,
  BicepsFlexed,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Crown,
  Dumbbell,
  Flame,
  Gift,
  HeartPulse,
  ListChecks,
  LockKeyhole,
  Medal,
  MessageCircle,
  ShieldCheck,
  StretchHorizontal,
  Sparkles,
  Trophy,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import api, { getApiErrorMessage } from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import clubHeroImage from '../../assets/clubs/premium-club-hero.jpg';

type Membership = {
  id: string;
  gym_id: string;
  gym_name?: string;
  gym_logo_url?: string;
  status: string;
  total_check_ins: number;
  current_occupancy?: number;
  max_capacity?: number;
};

type MissionProgress = {
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
  unlocks?: {
    category?: string;
    action_label?: string;
    facilities?: string[];
    club_definition?: string;
    reward_preview?: string;
    content?: string[];
    share_cta?: string;
  };
};

type FitCardData = {
  member: {
    name: string;
    avatar_url?: string | null;
    city?: string | null;
  };
  gym: {
    id: string;
    name: string;
    logo_url?: string | null;
    city?: string | null;
  };
  fitcard: {
    frame: string;
    title: string;
    total_check_ins: number;
    current_streak: number;
    best_streak: number;
    total_points: number;
  };
  badges: MissionProgress[];
  clubs: Array<{
    id: string;
    code: string;
    name: string;
    joined_at?: string | null;
    definition?: string | null;
    facilities?: string[];
    reward_preview?: string | null;
    share_cta?: string | null;
  }>;
  share?: {
    invite_code: string;
    share_url: string;
    whatsapp_url: string;
    qr_payload: string;
    click_count: number;
    lead_count: number;
  } | null;
};

type RewardClaim = {
  id: string;
  club_code: string;
  club_name: string;
  reward_label: string;
  status: 'claimed' | 'redeemed' | 'cancelled';
  claimed_at?: string | null;
  redeemed_at?: string | null;
};

type TransferRequest = {
  id: string;
  status: 'pending' | 'rejected' | 'applied' | 'cancelled';
  admin_status: 'pending' | 'approved' | 'rejected';
  owner_status: 'pending' | 'approved' | 'rejected';
  max_level_reached?: number;
  badges_count: number;
  clubs_count: number;
  source_gym: { id: string; name?: string | null };
  target_gym: { id: string; name?: string | null };
};

type TransferOption = {
  source_gym_id: string;
  source_gym: { id: string; name: string; city?: string | null; logo_url?: string | null };
  is_eligible: boolean;
  eligible_level?: number | null;
  max_level_reached: number;
  locked_reason?: string | null;
  badges_count: number;
  clubs_count: number;
  badges: Array<{ badge?: { name?: string }; mission?: { title?: string; code?: string }; stage?: number | null }>;
  clubs: Array<{ id?: string; code?: string; name?: string; stage?: number | null }>;
  pending_request?: TransferRequest;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Unlocked';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const renderMissionIcon = (icon?: string, missionType?: string, size = 21) => {
  switch (icon) {
    case 'activity':
      return <Activity size={size} />;
    case 'apple':
      return <Apple size={size} />;
    case 'biceps-flexed':
      return <BicepsFlexed size={size} />;
    case 'dumbbell':
      return <Dumbbell size={size} />;
    case 'flame':
      return <Flame size={size} />;
    case 'heart-pulse':
      return <HeartPulse size={size} />;
    case 'calendar-check':
      return <CalendarCheck size={size} />;
    case 'list-checks':
      return <ListChecks size={size} />;
    case 'salad':
    case 'utensils':
      return <Utensils size={size} />;
    case 'stretch-horizontal':
      return <StretchHorizontal size={size} />;
    case 'trophy':
      return <Trophy size={size} />;
    default:
      return missionType === 'task_completion' ? <ListChecks size={size} /> : <Award size={size} />;
  }
};

const getMissionCategory = (mission: MissionProgress) => {
  if (mission.unlocks?.category) return mission.unlocks.category;
  if (mission.mission.mission_type === 'check_in_count') return 'Check-in';
  if (mission.mission.mission_type === 'check_in_streak') return 'Streak';
  if (mission.mission.mission_type === 'task_completion') return 'Task';
  return 'Mission';
};

const contentFacilityMap: Record<string, string> = {
  advanced_workout_plans: 'Advanced workout plans',
  basic_diet_plan: 'Basic diet plan',
  diet_plan: 'Diet plan',
  habit_builder_workout_plan: 'Habit-builder plan',
  meal_prep_checklist: 'Meal-prep checklist',
  mobility_flow: 'Mobility flow',
  progressive_workout_plan: 'Progressive workout plan',
  recovery_plan: 'Recovery plan',
  sports_plan: 'Sports plan',
  starter_workout_plan: 'Starter workout plan',
  weekly_workout_plan: 'Weekly workout plan',
};

const fallbackFacilitiesByMission: Record<string, string[]> = {
  first_check_in: ['Free protein shake', 'Starter workout plan', 'Shareable QR invite', 'FitCard starter frame'],
  three_day_streak: ['5% renewal discount', 'Habit-builder plan', 'Buddy streak challenge', 'Spark FitCard frame'],
  workout_plan_completed: ['1 free trainer form-check session', 'Progressive workout plan', 'Workout finisher badge'],
  seven_day_streak: ['Professional diet plan', 'Weekly workout plan', 'Priority class booking'],
  diet_plan_followed: ['Professional diet consultation', 'Meal-prep checklist', 'Protein/supplement discount'],
  twenty_one_day_consistency: ['10% renewal discount', '2 free personal training sessions', 'Advanced workout plans', 'Professional diet plan'],
  mobility_reset: ['Free guided stretching session', 'Recovery plan', 'Sports massage discount'],
};

const formatContentSlug = (value: string) => {
  return contentFacilityMap[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getClubFacilities = (mission: MissionProgress) => {
  const facilities = [
    ...(mission.unlocks?.facilities || []),
    ...(mission.unlocks?.content || []).map(formatContentSlug),
    ...(mission.unlocks?.reward_preview ? [mission.unlocks.reward_preview] : []),
    ...(fallbackFacilitiesByMission[mission.mission.code] || []),
  ];
  return Array.from(new Set(facilities)).slice(0, 4);
};

const getMissionRequirement = (mission: MissionProgress) => {
  if (mission.mission.mission_type === 'check_in_count') return `${mission.mission.target_value} gym check-in`;
  if (mission.mission.mission_type === 'check_in_streak') return `${mission.mission.target_value}-day streak`;
  return `${mission.mission.target_value} ${getMissionCategory(mission).toLowerCase()} task${mission.mission.target_value === 1 ? '' : 's'}`;
};

const getClubDisplayName = (mission: MissionProgress) => {
  if (mission.club?.name) return mission.club.name;
  return mission.badge.name.replace(/\s*badge$/i, ' Club');
};

const getClubDefinition = (mission: MissionProgress) => (
  mission.club?.definition ||
  mission.unlocks?.club_definition ||
  'A fitness loyalty club unlocked by proving consistent action. Each club carries real gym benefits such as discounts, protein, personal training, diet support, or recovery perks.'
);

const clampPercent = (value?: number) => Math.min(100, Math.max(0, Math.round(value || 0)));

const getInitials = (value?: string | null) => {
  const words = (value || 'Gymmigo').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'GM';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const copyToClipboard = async (value?: string | null) => {
  if (!value) return;
  await navigator.clipboard.writeText(value);
};

const GymmigoClubsPage = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedGymId, setSelectedGymId] = useState('');
  const [missions, setMissions] = useState<MissionProgress[]>([]);
  const [fitcard, setFitcard] = useState<FitCardData | null>(null);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recordingMissionCode, setRecordingMissionCode] = useState('');
  const [claimingClubCode, setClaimingClubCode] = useState('');
  const [selectedClubMission, setSelectedClubMission] = useState<MissionProgress | null>(null);
  const [transferOptions, setTransferOptions] = useState<TransferOption[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [selectedTransferSourceGymId, setSelectedTransferSourceGymId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const activeMemberships = useMemo(
    () => memberships.filter((membership) => membership.status === 'active'),
    [memberships]
  );

  const selectedMembership = useMemo(
    () => activeMemberships.find((membership) => membership.gym_id === selectedGymId),
    [activeMemberships, selectedGymId]
  );

  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.is_completed),
    [missions]
  );

  const nextMission = useMemo(
    () => missions.find((mission) => !mission.is_completed),
    [missions]
  );
  const rewardClaimsByClub = useMemo(
    () => new Map(rewardClaims.map((claim) => [claim.club_code, claim])),
    [rewardClaims]
  );
  const eligibleTransferOptions = useMemo(
    () => transferOptions.filter((option) => option.is_eligible && !option.pending_request),
    [transferOptions]
  );
  const lockedTransferOption = useMemo(
    () => transferOptions.find((option) => option.clubs_count > 0 && !option.is_eligible),
    [transferOptions]
  );
  const selectedTransferOption = useMemo(
    () => eligibleTransferOptions.find((option) => option.source_gym_id === selectedTransferSourceGymId) || eligibleTransferOptions[0],
    [eligibleTransferOptions, selectedTransferSourceGymId]
  );

  const fetchMemberships = useCallback(async () => {
    setInitialLoading(true);
    setError('');
    try {
      const res = await api.get('/memberships/my');
      const items = (res.data?.data?.memberships || []) as Membership[];
      setMemberships(items);
      const firstActive = items.find((membership) => membership.status === 'active');
      if (firstActive) setSelectedGymId((current) => current || firstActive.gym_id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const fetchClubData = useCallback(async (gymId: string) => {
    setSectionLoading(true);
    setError('');
    try {
      const [missionsRes, fitcardRes, claimsRes, transferOptionsRes, transferRequestsRes] = await Promise.all([
        api.get(`/clubs/missions?gym_id=${gymId}`),
        api.get(`/clubs/fitcard/me?gym_id=${gymId}`),
        api.get(`/clubs/reward-claims/my?gym_id=${gymId}`).catch(() => ({ data: { data: { claims: [] } } })),
        api.get(`/clubs/transfer-options?target_gym_id=${gymId}`).catch(() => ({ data: { data: { options: [] } } })),
        api.get('/clubs/transfer-requests/my').catch(() => ({ data: { data: { requests: [] } } })),
      ]);
      setMissions(missionsRes.data?.data?.missions || []);
      setFitcard(fitcardRes.data?.data || null);
      setRewardClaims(claimsRes.data?.data?.claims || []);
      const options = transferOptionsRes.data?.data?.options || [];
      setTransferOptions(options);
      setSelectedTransferSourceGymId((current) => (
        options.some((option: TransferOption) => option.source_gym_id === current && option.is_eligible && !option.pending_request)
          ? current
          : options.find((option: TransferOption) => option.is_eligible && !option.pending_request)?.source_gym_id || ''
      ));
      setTransferRequests((transferRequestsRes.data?.data?.requests || []).filter(
        (request: TransferRequest) => request.target_gym.id === gymId
      ));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setMissions([]);
      setFitcard(null);
      setRewardClaims([]);
      setTransferOptions([]);
      setTransferRequests([]);
    } finally {
      setSectionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    if (selectedGymId) fetchClubData(selectedGymId);
  }, [fetchClubData, selectedGymId]);

  const handleCopy = async () => {
    await copyToClipboard(fitcard?.share?.share_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleTaskMission = async (mission: MissionProgress) => {
    if (!selectedGymId || mission.mission.mission_type !== 'task_completion') return;
    setRecordingMissionCode(mission.mission.code);
    setError('');
    try {
      await api.post('/clubs/task-completions', {
        gym_id: selectedGymId,
        mission_code: mission.mission.code,
        value: 1,
        metadata: {
          source: 'clubs_page',
          category: getMissionCategory(mission),
        },
      });
      await fetchClubData(selectedGymId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRecordingMissionCode('');
    }
  };

  const handleClaimReward = async (club: FitCardData['clubs'][number]) => {
    if (!selectedGymId || !club?.code) return;
    setClaimingClubCode(club.code);
    setError('');
    try {
      await api.post('/clubs/reward-claims', {
        gym_id: selectedGymId,
        club_code: club.code,
      });
      await fetchClubData(selectedGymId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setClaimingClubCode('');
    }
  };

  const handleSubmitTransfer = async () => {
    if (!selectedGymId || !selectedTransferOption) return;
    setSubmittingTransfer(true);
    setError('');
    try {
      await api.post('/clubs/transfer-requests', {
        source_gym_id: selectedTransferOption.source_gym_id,
        target_gym_id: selectedGymId,
        member_note: transferNote.trim() || undefined,
      });
      setTransferNote('');
      await fetchClubData(selectedGymId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmittingTransfer(false);
    }
  };

  if (initialLoading) return <PageLoader message="Loading Clubs and FitCard..." />;

  if (!activeMemberships.length) {
    return (
      <EmptyState
        icon={Trophy}
        title="No active gym membership"
        description="Join a gym to start badge missions, unlock Clubs, and build your FitCard."
        action={<Link to="/app/discovery" className="btn-primary inline-flex items-center gap-2"><Building2 size={16} /> Explore Gyms</Link>}
      />
    );
  }

  const selectedGymName = selectedMembership?.gym_name || fitcard?.gym.name || 'Your gym';
  const selectedGymLogo = selectedMembership?.gym_logo_url || fitcard?.gym.logo_url || undefined;
  const unlockedClubCount = fitcard?.clubs.length ?? 0;
  const highlightedClub = fitcard?.clubs[0] || null;
  const highlightedClubName = highlightedClub?.name || (nextMission ? getClubDisplayName(nextMission) : `${selectedGymName} Starter Club`);
  const highlightedClubStatus = highlightedClub
    ? highlightedClub.joined_at
      ? `Joined ${formatDate(highlightedClub.joined_at)}`
      : 'Club unlocked'
    : nextMission
      ? `Next badge: ${nextMission.badge.name}`
      : 'Starter club';
  const clubCompletionPercent = missions.length
    ? clampPercent((completedMissions.length / missions.length) * 100)
    : 0;
  const nextMissionPercent = clampPercent(nextMission?.progress_percent);
  const roadMissions = missions;
  const nextClubFacilities = nextMission ? getClubFacilities(nextMission).slice(0, 3) : [];
  const highlightedFacilities = highlightedClub?.facilities?.length
    ? highlightedClub.facilities.slice(0, 4)
    : nextClubFacilities;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-slate-300/10 bg-[#111827] shadow-2xl shadow-slate-950/30">
        <img
          src={clubHeroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0F172A_0%,rgba(15,23,42,0.9)_46%,rgba(15,23,42,0.42)_100%)]" />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-black uppercase text-primary">
              <Crown size={15} /> Highlighted Club
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
                {highlightedClubName}
              </h1>
              <p className="max-w-2xl text-sm font-semibold leading-6 text-white/68">
                {highlightedClub
                  ? highlightedClub.definition || `You are in this fitness loyalty club at ${selectedGymName}. Clubs are not just badges: they carry gym-defined benefits like protein, fee discounts, training sessions, diet plans, and recovery perks.`
                  : `Start here at ${selectedGymName}. Finish the next required badge mission to unlock a real fitness club tier with gym benefits on your FitCard.`}
              </p>
              {highlightedFacilities.length > 0 && (
                <div className="flex max-w-2xl flex-wrap gap-2">
                  {highlightedFacilities.map((facility) => (
                    <span key={facility} className="rounded-full border border-slate-300/15 bg-slate-900/55 px-3 py-1.5 text-[10px] font-black uppercase text-white/58">
                      {facility}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {fitcard?.share ? (
                <>
                  <a
                    href={fitcard.share.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
                  >
                    <MessageCircle size={17} /> Share FitCard
                  </a>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:border-primary/50 hover:bg-primary/15"
                  >
                    <Copy size={17} /> {copied ? 'Link copied' : 'Copy link'}
                  </button>
                  {highlightedClub && !rewardClaimsByClub.get(highlightedClub.code) && (
                    <button
                      onClick={() => handleClaimReward(highlightedClub)}
                      disabled={claimingClubCode === highlightedClub.code}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/15 px-5 py-3 text-sm font-black text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-400/20 disabled:opacity-60"
                    >
                      <Gift size={17} /> {claimingClubCode === highlightedClub.code ? 'Claiming' : 'Claim reward'}
                    </button>
                  )}
                </>
              ) : (
                <Link
                  to="/app/discovery"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
                >
                  Explore gyms <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-300/15 bg-slate-900/70 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <ClubLogo src={selectedGymLogo} name={selectedGymName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{selectedGymName}</p>
                <p className="mt-1 text-xs font-bold text-white/45">{highlightedClubStatus}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatTile label="Badges" value={completedMissions.length} />
              <StatTile label="Streak" value={fitcard?.fitcard.current_streak || 0} tone="orange" />
              <StatTile label="Clubs" value={unlockedClubCount} tone="green" />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black text-white/55">
                <span>Club progress</span>
                <span>{completedMissions.length}/{missions.length || 1}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${clubCompletionPercent}%` }} />
              </div>
            </div>

            {nextMission && (
              <button
                type="button"
                onClick={() => setSelectedClubMission(nextMission)}
                className="mt-5 w-full rounded-lg border border-primary/30 bg-primary/10 p-3 text-left transition hover:border-primary/55 hover:bg-primary/15"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-slate-950/35 text-primary"
                    style={{ color: nextMission.badge.color || '#f1822c' }}
                  >
                    {renderMissionIcon(nextMission.badge.icon, nextMission.mission.mission_type, 20)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Next club glimpse</p>
                    <p className="truncate text-sm font-black text-white">{getClubDisplayName(nextMission)}</p>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-primary" />
                </div>
                {nextClubFacilities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {nextClubFacilities.map((facility) => (
                      <span key={facility} className="rounded-full border border-slate-300/10 bg-slate-950/35 px-2 py-1 text-[10px] font-black text-white/55">
                        {facility}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">Choose gym</h2>
            <p className="mt-1 text-sm font-semibold text-white/45">Your club progress changes with each active membership.</p>
          </div>
          <Users size={19} className="shrink-0 text-primary" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {activeMemberships.map((membership) => (
          <button
            key={membership.gym_id}
            onClick={() => setSelectedGymId(membership.gym_id)}
            className={clsx(
              'flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-all',
              selectedGymId === membership.gym_id
                ? 'border-primary/60 bg-primary/15 text-white shadow-lg shadow-primary/10'
                : 'border-white/10 bg-white/[0.035] text-white/55 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            <ClubLogo src={membership.gym_logo_url} name={membership.gym_name || 'Gym'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{membership.gym_name || 'Gym'}</p>
              <p className="mt-1 text-xs font-bold text-white/35">{membership.total_check_ins} check-ins</p>
            </div>
            {selectedGymId === membership.gym_id && <CheckCircle2 size={18} className="shrink-0 text-primary" />}
          </button>
        ))}
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      {sectionLoading ? (
        <PageLoader message="Syncing your Clubs..." />
      ) : (
        <div className="space-y-6">
          {(eligibleTransferOptions.length > 0 || lockedTransferOption || transferRequests.length > 0) && (
            <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <ShieldCheck size={19} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Carry badges to this gym</h2>
                    <p className="mt-1 text-sm font-semibold text-white/45">Both Gymmigo Admin and the destination gym owner must approve.</p>
                  </div>
                </div>
                {lockedTransferOption && !eligibleTransferOptions.length && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-black text-primary">
                    <LockKeyhole size={14} /> Reach Club level 5 to carry your badges to another gym.
                  </div>
                )}
              </div>

              {transferRequests.length > 0 && (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {transferRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{request.source_gym.name || 'Previous gym'}</p>
                          <p className="mt-1 text-xs font-bold text-white/45">
                            Admin {request.admin_status} · Owner {request.owner_status}
                          </p>
                        </div>
                        <span className={clsx(
                          'rounded-full px-3 py-1.5 text-[10px] font-black uppercase',
                          request.status === 'applied' ? 'bg-emerald-400/15 text-emerald-200' :
                            request.status === 'rejected' ? 'bg-red-500/15 text-red-200' : 'bg-amber-400/15 text-amber-200'
                        )}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {eligibleTransferOptions.length > 0 && selectedTransferOption && (
                <div className="mt-5 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {eligibleTransferOptions.map((option) => (
                      <button
                        key={option.source_gym_id}
                        type="button"
                        onClick={() => setSelectedTransferSourceGymId(option.source_gym_id)}
                        className={clsx(
                          'w-full rounded-lg border p-3 text-left transition',
                          selectedTransferOption.source_gym_id === option.source_gym_id
                            ? 'border-primary/45 bg-primary/12 text-white'
                            : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white'
                        )}
                      >
                        <p className="truncate text-sm font-black">{option.source_gym.name}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/38">
                          Level {option.eligible_level || option.max_level_reached}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatTile label="Badges" value={selectedTransferOption.badges_count} />
                      <StatTile label="Clubs" value={selectedTransferOption.clubs_count} tone="green" />
                      <StatTile label="Level" value={selectedTransferOption.eligible_level || selectedTransferOption.max_level_reached} tone="orange" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedTransferOption.clubs.slice(0, 5).map((club) => (
                        <span key={club.id || club.code || club.name} className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-100">
                          {club.name}
                        </span>
                      ))}
                    </div>
                    <textarea
                      value={transferNote}
                      onChange={(event) => setTransferNote(event.target.value)}
                      rows={3}
                      placeholder="Optional note for approvals"
                      className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-slate-950/55 px-4 py-3 text-sm font-bold leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitTransfer}
                      disabled={submittingTransfer}
                      className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-60"
                    >
                      <ShieldCheck size={17} /> {submittingTransfer ? 'Sending' : 'Request transfer'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Club road</h2>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                  A Club is a benefit tier, not only a badge. Higher clubs stay locked but visible so members can preview the required badge and real gym benefits before chasing it.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase text-primary">
                <LockKeyhole size={14} /> Locked previews
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-3 sm:p-4">
              {roadMissions.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {roadMissions.map((mission, index) => (
                    <ClubRoadCard
                      key={mission.mission.code}
                      mission={mission}
                      stage={index + 1}
                      isNext={mission.mission.code === nextMission?.mission.code}
                      onClick={() => setSelectedClubMission(mission)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm font-semibold leading-6 text-white/45">
                  Badge missions will appear here once your club progress syncs.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-5">
            <section className="overflow-hidden rounded-lg border border-slate-300/10 bg-slate-900/55">
              <div className="border-b border-slate-300/10 bg-slate-800/35 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-primary">FitCard</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{fitcard?.fitcard.title || 'Gymmigo Starter'}</h2>
                    <p className="mt-1 text-sm font-bold text-white/45">{selectedGymName}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-300/10 bg-slate-950/35 text-primary">
                    {fitcard?.member.avatar_url ? <img src={fitcard.member.avatar_url} alt="" className="h-full w-full object-cover" /> : <Medal size={24} />}
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xl font-black text-white">{fitcard?.member.name || 'Gymmigo Member'}</p>
                      <p className="mt-1 text-xs font-bold uppercase text-white/35">{fitcard?.fitcard.frame || 'starter'} frame</p>
                    </div>
                    <ShieldCheck className="text-emerald-400" size={24} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <StatTile label="Check-ins" value={fitcard?.fitcard.total_check_ins || 0} />
                    <StatTile label="Best" value={fitcard?.fitcard.best_streak || 0} />
                    <StatTile label="Points" value={fitcard?.fitcard.total_points || 0} tone="green" />
                  </div>
                </div>

                {fitcard?.share && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <BadgeCheck size={18} className="text-primary" />
                      <p className="text-sm font-black text-white">Share your FitCard</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                      <div className="mx-auto rounded-lg border border-white/10 bg-white p-2">
                        <QRCodeSVG value={fitcard.share.qr_payload || fitcard.share.share_url} size={112} fgColor="#111827" />
                      </div>
                      <div className="min-w-0 space-y-3">
                        <div className="rounded-lg border border-slate-300/10 bg-slate-950/30 px-3 py-2">
                          <p className="truncate text-xs font-bold text-white/60">{fitcard.share.share_url}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={handleCopy} className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs font-black uppercase text-white transition hover:border-primary/40">
                            <span className="inline-flex items-center gap-2"><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <a href={fitcard.share.whatsapp_url} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-400 px-3 py-3 text-center text-xs font-black uppercase text-black transition hover:brightness-110">
                            <span className="inline-flex items-center justify-center gap-2"><MessageCircle size={14} /> WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Clicks" value={fitcard?.share?.click_count || 0} />
                  <StatTile label="Leads" value={fitcard?.share?.lead_count || 0} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Unlocked clubs</h3>
                <Users size={18} className="text-primary" />
              </div>
              {fitcard?.clubs.length ? (
                <div className="space-y-2">
                  {fitcard.clubs.map((club) => (
                    <div key={club.id || club.code} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                      {(() => {
                        const claim = rewardClaimsByClub.get(club.code);
                        return (
                          <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                          <Crown size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-white">{club.name}</p>
                          <p className="mt-0.5 text-xs font-bold text-white/40">Joined {formatDate(club.joined_at)}</p>
                        </div>
                      </div>
                      {club.definition && (
                        <p className="mt-3 text-xs font-semibold leading-5 text-white/48">{club.definition}</p>
                      )}
                      {!!club.facilities?.length && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {club.facilities.slice(0, 3).map((facility) => (
                            <span key={facility} className="rounded-full border border-emerald-300/15 bg-slate-950/25 px-2 py-1 text-[10px] font-black text-emerald-100/65">
                              {facility}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {claim?.status === 'redeemed' ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-100">
                            <CheckCircle2 size={12} /> Reward redeemed
                          </span>
                        ) : claim?.status === 'claimed' ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-100">
                            <Gift size={12} /> Claim sent to gym desk
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaimReward(club)}
                            disabled={claimingClubCode === club.code}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-100 transition hover:border-emerald-300/40 disabled:opacity-60"
                          >
                            <Gift size={12} /> {claimingClubCode === club.code ? 'Claiming' : 'Claim reward'}
                          </button>
                        )}
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm font-semibold leading-6 text-white/45">
                  Unlock your first badge to join a club. Your highlighted club will appear at the top of this page.
                </div>
              )}
            </section>
            </aside>

            <main className="space-y-5">
            {nextMission && (
              <section className="rounded-lg border border-primary/30 bg-[#160e08] p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Sparkles size={21} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase text-primary">Next unlock</p>
                      <h3 className="text-2xl font-black text-white">{nextMission.badge.name}</h3>
                      <p className="text-sm font-semibold leading-6 text-white/55">{nextMission.mission.description}</p>
                    </div>
                  </div>
                  <div className="min-w-[170px]">
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-white">{nextMissionPercent}%</span>
                      <span className="text-xs font-black text-white/30">{nextMission.progress_value}/{nextMission.mission.target_value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/40">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${nextMissionPercent}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Badge missions</h3>
                  <p className="mt-1 text-sm font-semibold text-white/45">Finish these simple actions to unlock clubs and rewards.</p>
                </div>
                <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/55">
                  {completedMissions.length}/{missions.length || 0} done
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {missions.map((mission, index) => {
                  const missionProgress = clampPercent(mission.progress_percent);
                  const category = getMissionCategory(mission);
                  const isTaskMission = mission.mission.mission_type === 'task_completion';
                  const isRecording = recordingMissionCode === mission.mission.code;
                  return (
                    <motion.article
                      key={mission.mission.code}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={clsx(
                        'rounded-lg border p-4 transition-all',
                        mission.is_completed
                          ? 'border-emerald-400/25 bg-emerald-400/10'
                          : 'border-white/10 bg-white/[0.035] hover:border-primary/25 hover:bg-white/[0.055]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/30"
                            style={{ color: mission.badge.color || '#f1822c' }}
                          >
                            {renderMissionIcon(mission.badge.icon, mission.mission.mission_type)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-white">{mission.badge.name}</h4>
                              <span className="rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] font-black uppercase text-white/45">
                                {category}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold leading-5 text-white/50">{mission.mission.description}</p>
                          </div>
                        </div>
                        <span className={clsx(
                          'shrink-0 rounded-full px-2.5 py-1 text-xs font-black',
                          mission.is_completed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/8 text-white/45'
                        )}>
                          {mission.is_completed ? 'Done' : `${missionProgress}%`}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-white/35">Progress</span>
                          <span className={mission.is_completed ? 'text-emerald-300' : 'text-white/50'}>{mission.progress_value}/{mission.mission.target_value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-950/30">
                          <div
                            className={clsx('h-full rounded-full', mission.is_completed ? 'bg-emerald-400' : 'bg-primary')}
                            style={{ width: `${missionProgress}%` }}
                          />
                        </div>
                        {mission.unlocks?.reward_preview && (
                          <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-200">
                            {mission.unlocks.reward_preview}
                          </p>
                        )}
                        {isTaskMission && !mission.is_completed && (
                          <button
                            onClick={() => handleTaskMission(mission)}
                            disabled={isRecording}
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/12 px-3 py-2.5 text-xs font-black uppercase text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            <CheckCircle2 size={15} /> {isRecording ? 'Logging...' : mission.unlocks?.action_label || 'Mark done'}
                          </button>
                        )}
                        {!isTaskMission && !mission.is_completed && (
                          <p className="pt-1 text-xs font-semibold text-white/35">
                            Auto-updates when you scan the gym QR.
                          </p>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
            </main>
          </div>
        </div>
      )}
      <AnimatePresence>
        {selectedClubMission && (
          <ClubDetailModal
            mission={selectedClubMission}
            isNext={selectedClubMission.mission.code === nextMission?.mission.code}
            isRecording={recordingMissionCode === selectedClubMission.mission.code}
            onClose={() => setSelectedClubMission(null)}
            onLogMission={() => handleTaskMission(selectedClubMission)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ClubRoadCard = ({
  mission,
  stage,
  isNext,
  onClick,
}: {
  mission: MissionProgress;
  stage: number;
  isNext: boolean;
  onClick: () => void;
}) => {
  const missionProgress = clampPercent(mission.progress_percent);
  const status = mission.is_completed ? 'Unlocked' : isNext ? 'Next' : 'Locked';
  const facilities = getClubFacilities(mission).slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative min-h-[250px] overflow-hidden rounded-lg border p-4 text-left transition-all',
        mission.is_completed
          ? 'border-emerald-400/35 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(255,255,255,0.035))]'
          : isNext
            ? 'border-primary/45 bg-[linear-gradient(135deg,rgba(241,130,44,0.2),rgba(255,255,255,0.035))] shadow-lg shadow-primary/10'
            : 'border-slate-300/10 bg-slate-900/45 hover:border-slate-300/20 hover:bg-slate-800/45'
      )}
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />
      {!mission.is_completed && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-300/10 bg-slate-950/55 text-white/45">
          <LockKeyhole size={13} />
        </div>
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={clsx(
            'relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-slate-950/45 transition-transform group-hover:scale-105',
            mission.is_completed ? 'border-emerald-400/35' : isNext ? 'border-primary/45' : 'border-white/10'
          )}
          style={{ color: mission.badge.color || '#f1822c' }}
        >
          {renderMissionIcon(mission.badge.icon, mission.mission.mission_type, 28)}
          {!mission.is_completed && <div className="absolute inset-0 rounded-2xl bg-slate-950/35" />}
        </div>
        <span className="rounded-full border border-slate-300/10 bg-slate-950/35 px-2 py-1 text-[10px] font-black uppercase text-white/35">
          Stage {stage}
        </span>
      </div>

      <div className="relative mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'rounded-full px-2 py-1 text-[10px] font-black uppercase',
              mission.is_completed
                ? 'bg-emerald-400/15 text-emerald-300'
                : isNext
                  ? 'bg-primary/15 text-primary'
                  : 'bg-white/8 text-white/45'
            )}
          >
            {status}
          </span>
          <span className="rounded-full border border-slate-300/10 bg-slate-950/25 px-2 py-1 text-[10px] font-black uppercase text-white/35">
            {getMissionCategory(mission)}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[48px] text-xl font-black leading-6 text-white">
          {getClubDisplayName(mission)}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/45">
          {getClubDefinition(mission)}
        </p>
      </div>

      <div className="relative mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-white/45">
          <span>{mission.badge.name}</span>
          <span>{missionProgress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950/45">
          <div
            className={clsx('h-full rounded-full', mission.is_completed ? 'bg-emerald-400' : 'bg-primary')}
            style={{ width: `${missionProgress}%` }}
          />
        </div>
      </div>

      {facilities.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {facilities.map((facility) => (
            <span key={facility} className="rounded-full border border-slate-300/10 bg-slate-950/35 px-2 py-1 text-[10px] font-bold text-white/45">
              {facility}
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-4 flex items-center gap-2 text-xs font-black uppercase text-primary">
        Preview club <ArrowRight size={14} className="transition group-hover:translate-x-1" />
      </div>
    </button>
  );
};

const ClubDetailModal = ({
  mission,
  isNext,
  isRecording,
  onClose,
  onLogMission,
}: {
  mission: MissionProgress;
  isNext: boolean;
  isRecording: boolean;
  onClose: () => void;
  onLogMission: () => void;
}) => {
  const facilities = getClubFacilities(mission);
  const missionProgress = clampPercent(mission.progress_percent);
  const isTaskMission = mission.mission.mission_type === 'task_completion';
  const isLocked = !mission.is_completed;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/12 bg-[#090909] shadow-2xl shadow-black"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/10 bg-slate-950/45 text-white/55 transition hover:text-white"
          aria-label="Close club preview"
        >
          <X size={18} />
        </button>

        <div className="relative overflow-hidden border-b border-white/10 p-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(241,130,44,0.2),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative flex items-start gap-4 pr-10">
            <div
              className={clsx(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-slate-950/45',
                mission.is_completed ? 'border-emerald-400/35' : isNext ? 'border-primary/45' : 'border-white/10'
              )}
              style={{ color: mission.badge.color || '#f1822c' }}
            >
              {renderMissionIcon(mission.badge.icon, mission.mission.mission_type, 30)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={clsx(
                    'rounded-full px-2.5 py-1 text-[10px] font-black uppercase',
                    mission.is_completed
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : isNext
                        ? 'bg-primary/15 text-primary'
                        : 'bg-white/8 text-white/45'
                  )}
                >
                  {mission.is_completed ? 'Unlocked' : isNext ? 'Next club' : 'Locked club'}
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/10 bg-slate-950/35 px-2.5 py-1 text-[10px] font-black uppercase text-white/45">
                    <LockKeyhole size={12} /> Locked
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-3xl font-black leading-tight text-white">
                {getClubDisplayName(mission)}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                {getClubDefinition(mission)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase text-primary">Required badge to unlock</p>
            <h4 className="mt-2 text-xl font-black text-white">{mission.badge.name}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/52">{mission.mission.description}</p>
            <p className="mt-3 rounded-lg border border-slate-300/10 bg-slate-950/25 px-3 py-2 text-xs font-black uppercase tracking-widest text-white/42">
              Required: {getMissionRequirement(mission)}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-black text-white/45">
                <span>{mission.progress_value}/{mission.mission.target_value}</span>
                <span>{missionProgress}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-950/40">
                <div
                  className={clsx('h-full rounded-full', mission.is_completed ? 'bg-emerald-400' : 'bg-primary')}
                  style={{ width: `${missionProgress}%` }}
                />
              </div>
            </div>

            {isTaskMission && !mission.is_completed ? (
              <button
                type="button"
                onClick={onLogMission}
                disabled={isRecording}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <CheckCircle2 size={16} /> {isRecording ? 'Logging...' : mission.unlocks?.action_label || 'Mark done'}
              </button>
            ) : !mission.is_completed ? (
              <p className="mt-5 rounded-lg border border-slate-300/10 bg-slate-950/25 px-3 py-3 text-sm font-semibold leading-6 text-white/45">
                This mission updates automatically when you scan the gym QR.
              </p>
            ) : (
              <p className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-sm font-black text-emerald-300">
                Club unlocked on your FitCard.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase text-primary">Club benefits</p>
            <div className="mt-3 grid gap-2">
              {facilities.map((facility) => (
                <div key={facility} className="flex items-center gap-3 rounded-lg border border-slate-300/10 bg-slate-950/25 px-3 py-2.5">
                  <Sparkles size={15} className="shrink-0 text-primary" />
                  <span className="text-sm font-bold text-white/65">{facility}</span>
                </div>
              ))}
            </div>
            {mission.unlocks?.share_cta && (
              <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-3 text-sm font-bold leading-6 text-primary">
                {mission.unlocks.share_cta}
              </p>
            )}
          </section>
        </div>
      </motion.article>
    </motion.div>
  );
};

const ClubLogo = ({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' }) => (
  <div
    className={clsx(
      'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/8 text-primary',
      size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'
    )}
  >
    {src ? (
      <img src={src} alt={`${name} logo`} className="h-full w-full object-cover" />
    ) : (
      <div className="relative h-full w-full">
        <img src="/logo.png" alt={`${name} logo`} className="h-full w-full object-cover" />
        <span className="sr-only">{getInitials(name)}</span>
      </div>
    )}
  </div>
);

const StatTile = ({ label, value, tone = 'white' }: { label: string; value: number | string; tone?: 'white' | 'orange' | 'green' }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
    <p className="text-[10px] font-black uppercase text-white/35">{label}</p>
    <p className={clsx(
      'mt-1 text-2xl font-black',
      tone === 'orange' && 'text-primary',
      tone === 'green' && 'text-emerald-300',
      tone === 'white' && 'text-white'
    )}>{value}</p>
  </div>
);

export default GymmigoClubsPage;
