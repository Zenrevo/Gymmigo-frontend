import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  ArrowRight,
  Activity,
  Award,
  BicepsFlexed,
  CalendarCheck,
  CheckCircle2,
  Crown,
  Dumbbell,
  Flame,
  Gift,
  HeartPulse,
  ListChecks,
  LockKeyhole,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  StretchHorizontal,
  Trophy,
  Utensils,
  UserPlus,
  Users,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../utils/api';
import PageLoader from '../../components/PageLoader';
import BrandLogo from '../../components/BrandLogo';
import clubHeroImage from '../../assets/clubs/premium-club-hero.jpg';
import type { ClubsLadderSummary, MissionProgress } from '../../types/clubs';

type PublicClub = {
  id?: string;
  code: string;
  name: string;
  definition?: string | null;
  joined_at?: string | null;
  facilities?: string[];
  rewards?: Array<{ label?: string; value?: string; wallet_credit_inr?: number }>;
};

type PublicFitCardData = {
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
  clubs: PublicClub[];
  missions?: MissionProgress[];
  ladder?: ClubsLadderSummary | null;
  journey?: {
    completed_count: number;
    total_missions: number;
    club_progress_percent: number;
    current_tier: number;
    total_tiers: number;
    next_mission?: MissionProgress | null;
    active_badge?: MissionProgress | null;
    active_club?: PublicClub | null;
  };
  share?: {
    invite_code: string;
    share_url: string;
    qr_payload: string;
  } | null;
  trial_offer?: {
    headline: string;
    description: string;
    invite_code: string;
  };
};

const iconMap = {
  activity: Activity,
  'biceps-flexed': BicepsFlexed,
  dumbbell: Dumbbell,
  flame: Flame,
  'heart-pulse': HeartPulse,
  'calendar-check': CalendarCheck,
  'list-checks': ListChecks,
  salad: Utensils,
  'stretch-horizontal': StretchHorizontal,
  trophy: Trophy,
  utensils: Utensils,
  'shield-check': ShieldCheck,
};

const renderMissionIcon = (icon?: string, missionType?: string, size = 18) => {
  const Icon = iconMap[icon as keyof typeof iconMap] || (missionType === 'task_completion' ? ListChecks : Award);
  return <Icon size={size} />;
};

const getInitials = (value?: string | null) => {
  const words = (value || 'GM').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const clampPercent = (value?: number) => Math.min(100, Math.max(0, Math.round(value || 0)));

const PublicFitCard = () => {
  const { inviteCode = '', cardCode = '' } = useParams();
  const publicCode = cardCode || inviteCode;
  const isFitnessCardRoute = Boolean(cardCode);
  const [card, setCard] = useState<PublicFitCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });

  const missions = card?.missions?.length ? card.missions : card?.badges || [];
  const ladder = card?.ladder;
  const journey = card?.journey;
  const totalTiers = journey?.total_tiers ?? ladder?.total_tiers ?? (missions.length || 8);
  const currentTier = journey?.current_tier ?? ladder?.current_tier ?? card?.clubs.length ?? 0;
  const clubProgress = journey?.club_progress_percent ?? (
    missions.length ? Math.round((missions.filter((m) => m.is_completed).length / missions.length) * 100) : 0
  );
  const nextMission = journey?.next_mission ?? missions.find((m) => !m.is_completed && !m.is_locked);
  const activeClub = journey?.active_club ?? card?.clubs[0];
  const activeBadge = journey?.active_badge ?? missions.find((m) => m.is_completed) ?? missions[0];
  const highlightedClubName = activeClub?.name || card?.fitcard.title || 'Starter Club';
  const invitePayload = card?.share?.qr_payload || `gymmigo:${isFitnessCardRoute ? 'fitness-card' : 'fitcard'}:${publicCode}`;

  const chartMissions = useMemo(
    () => missions.slice(0, 8).map((mission, index) => ({
      label: mission.badge?.name || `Tier ${index + 1}`,
      percent: mission.is_completed ? 100 : clampPercent(mission.progress_percent),
      done: mission.is_completed,
      locked: mission.is_locked,
    })),
    [missions]
  );

  const analysisBars = useMemo(
    () => [
      { label: 'Check-ins', value: card?.fitcard.total_check_ins ?? 0, max: Math.max(card?.fitcard.total_check_ins ?? 0, 8), tone: 'bg-primary' },
      { label: 'Streak', value: card?.fitcard.current_streak ?? 0, max: Math.max(card?.fitcard.best_streak ?? 0, card?.fitcard.current_streak ?? 0, 7), tone: 'bg-amber-400' },
      { label: 'Points', value: card?.fitcard.total_points ?? 0, max: Math.max(card?.fitcard.total_points ?? 0, 100), tone: 'bg-emerald-400' },
    ],
    [card?.fitcard]
  );

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(isFitnessCardRoute ? `/clubs/fitness-card/${publicCode}` : `/clubs/fitcard/${publicCode}`);
        const data = res.data?.data;
        setCard(data ? {
          ...data,
          gym: data.gym || { id: '', name: 'Gymmigo Fitness Card', logo_url: null, city: data.member?.city || null },
          badges: data.badges || [],
          clubs: data.clubs || [],
        } : null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (publicCode) fetchCard();
  }, [isFitnessCardRoute, publicCode]);

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/clubs/referrals/${inviteCode}/leads`, {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
      });
      setSuccess('Trial request sent. The gym team will contact you soon.');
      setForm({ full_name: '', phone: '', email: '' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader fullScreen message="Opening FitCard..." />;

  if (!card) {
    return (
      <main className="min-h-screen px-5 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-300/10 bg-slate-900/55 p-8 text-center backdrop-blur-xl">
          <Trophy size={42} className="mx-auto text-primary" />
          <h1 className="mt-5 text-3xl font-black tracking-tight">FitCard unavailable</h1>
          <p className="mt-3 text-sm font-semibold text-white/50">{error || 'This invite link is no longer active.'}</p>
          <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">Go to Gymmigo <ArrowRight size={16} /></Link>
        </div>
      </main>
    );
  }

  if (isFitnessCardRoute) {
    return <PublicFitnessCardProfile card={card} cardCode={publicCode} />;
  }

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <BrandLogo size={44} />
          </Link>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
            FitCard invite
          </span>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-slate-300/10 bg-[#111827] shadow-2xl">
          <img src={clubHeroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0F172A_0%,rgba(15,23,42,0.92)_42%,rgba(15,23,42,0.55)_100%)]" />
          <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-black uppercase text-primary">
                <Crown size={14} /> {activeClub ? 'Club member' : 'Building their journey'}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">{card.gym.name}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-white sm:text-5xl">{highlightedClubName}</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/60">
                  {card.trial_offer?.headline || `${card.member.name} invited you for a free trial workout.`}
                </p>
              </div>

              <motion.div className="flex flex-wrap gap-2">
                {(activeClub?.rewards || []).slice(0, 3).map((reward) => (
                  <span
                    key={reward.label}
                    className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-100"
                  >
                    {reward.wallet_credit_inr ? `₹${reward.wallet_credit_inr} wallet` : reward.label}
                  </span>
                ))}
                {!activeClub?.rewards?.length && nextMission?.rewards?.slice(0, 2).map((reward) => (
                  <span key={reward.label} className="rounded-full border border-slate-300/10 bg-slate-950/45 px-3 py-1.5 text-[10px] font-black uppercase text-white/55">
                    Locked: {reward.label}
                  </span>
                ))}
              </motion.div>

              {nextMission && (
                <div className="rounded-lg border border-slate-300/10 bg-slate-950/45 p-4 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Club journey</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold text-white/40">Current club</p>
                      <p className="text-sm font-black text-white">{highlightedClubName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/40">Next unlock</p>
                      <p className="text-sm font-black text-primary">{nextMission.badge?.name || nextMission.mission.title}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-bold text-white/40">Progress</p>
                      <p className="text-sm font-black text-white">{clampPercent(nextMission.progress_percent)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/40">
                    <motion.div className="h-full rounded-full bg-primary" style={{ width: `${clampPercent(nextMission.progress_percent)}%` }} />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border border-slate-300/15 bg-slate-900/75 p-4 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <GymLogo src={card.gym.logo_url} name={card.gym.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{card.gym.name}</p>
                  <p className="text-xs font-bold text-white/45">{card.member.name}&apos;s FitCard</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatTile label="Tier" value={`${currentTier}/${totalTiers}`} tone="orange" />
                <StatTile label="Streak" value={card.fitcard.current_streak} tone="orange" />
                <StatTile label="Clubs" value={card.clubs.length} tone="green" />
              </div>
              <div className="mt-4">
                <motion.div className="flex items-center justify-between text-xs font-black text-white/55">
                  <span>Club progress</span>
                  <span>{journey?.completed_count ?? 0}/{journey?.total_missions ?? totalTiers}</span>
                </motion.div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/40">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${clubProgress}%` }} />
                </div>
              </div>
              {activeBadge && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-slate-950/40"
                    style={{ color: activeBadge.badge?.color || '#f1822c' }}
                  >
                    {renderMissionIcon(activeBadge.badge?.icon, activeBadge.mission?.mission_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Active badge</p>
                    <p className="truncate text-sm font-black text-white">{activeBadge.badge?.name}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-300/10 bg-slate-900/55 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300/10 bg-slate-950/35">
                  {card.member.avatar_url ? (
                    <img src={card.member.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{getInitials(card.member.name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Member profile</p>
                  <h2 className="mt-1 text-2xl font-black text-white">{card.member.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-white/45">
                    {card.fitcard.frame} frame · {card.fitcard.title}
                    {card.member.city ? ` · ${card.member.city}` : ''}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="Check-ins" value={card.fitcard.total_check_ins} />
                    <Metric label="Streak" value={card.fitcard.current_streak} />
                    <Metric label="Best" value={card.fitcard.best_streak} />
                    <Metric label="Points" value={card.fitcard.total_points} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-300/10 bg-slate-900/55 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Progress analysis</p>
                  <h3 className="text-lg font-black text-white">Activity & tier momentum</h3>
                </div>
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="mt-5 space-y-4">
                {analysisBars.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold">
                      <span className="text-white/50">{bar.label}</span>
                      <span className="text-white">{bar.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-950/40">
                      <div
                        className={clsx('h-full rounded-full transition-all', bar.tone)}
                        style={{ width: `${bar.max ? Math.round((bar.value / bar.max) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/35">8-tier club ladder</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalTiers }, (_, i) => {
                    const tier = i + 1;
                    const done = tier <= currentTier;
                    const active = tier === currentTier + 1;
                    return (
                      <div
                        key={tier}
                        className={clsx(
                          'flex h-9 flex-1 items-center justify-center rounded-lg border text-[10px] font-black',
                          done && 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200',
                          active && !done && 'border-primary/40 bg-primary/15 text-primary',
                          !done && !active && 'border-slate-300/10 bg-slate-950/35 text-white/25'
                        )}
                      >
                        {tier}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {chartMissions.map((row) => (
                  <div key={row.label} className="rounded-xl border border-slate-300/10 bg-slate-950/35 px-3 py-2.5">
                    <motion.div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[10px] font-black uppercase text-white/45">{row.label}</p>
                      <span className="text-[10px] font-black text-white/70">
                        {row.done ? '✓' : row.locked ? <LockKeyhole size={10} className="inline" /> : `${row.percent}%`}
                      </span>
                    </motion.div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-950/40">
                      <div
                        className={clsx('h-full rounded-full', row.done ? 'bg-emerald-400' : row.locked ? 'bg-white/20' : 'bg-primary')}
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              {activeBadge && (
                <div className="rounded-lg border border-primary/25 bg-[linear-gradient(135deg,rgba(241,130,44,0.18),rgba(255,255,255,0.035))] p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Current badge</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300/10 bg-slate-950/45"
                      style={{ color: activeBadge.badge?.color || '#f1822c' }}
                    >
                      {renderMissionIcon(activeBadge.badge?.icon, activeBadge.mission?.mission_type, 22)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{activeBadge.badge?.name}</p>
                      <p className="text-xs font-semibold text-white/45">{activeBadge.mission?.title}</p>
                    </div>
                  </div>
                </div>
              )}
              {activeClub ? (
                <div className="rounded-lg border border-emerald-400/30 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(255,255,255,0.035))] p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Unlocked club</p>
                  <div className="mt-3 flex items-start gap-3">
                    <Users className="shrink-0 text-emerald-300" size={22} />
                    <div>
                      <p className="text-lg font-black text-white">{activeClub.name}</p>
                      {activeClub.definition && (
                        <p className="mt-1 text-xs font-semibold leading-5 text-white/50 line-clamp-3">{activeClub.definition}</p>
                      )}
                      {!!activeClub.facilities?.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {activeClub.facilities.slice(0, 3).map((f) => (
                            <span key={f} className="rounded-full border border-emerald-300/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-100/80">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-300/10 bg-slate-900/55 p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Club status</p>
                  <p className="mt-2 text-sm font-semibold text-white/55">
                    {card.member.name} is working toward their first club unlock at {card.gym.name}.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-300/10 bg-slate-900/55 p-5 backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto rounded-xl border border-slate-300/15 bg-white p-3">
                  <QRCodeSVG value={invitePayload} size={108} fgColor="#0F172A" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Scan to join</p>
                  <p className="mt-1 text-lg font-black">{card.member.name}&apos;s challenge</p>
                  <p className="mt-2 text-sm font-semibold text-white/45">{card.trial_offer?.description}</p>
                  {card.share?.share_url && (
                    <p className="mt-2 truncate text-xs font-bold text-primary/80">{card.share.share_url}</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-slate-300/10 bg-slate-900/55 p-6 backdrop-blur-xl sm:p-8 lg:sticky lg:top-6">
              <div className="flex items-center gap-3">
                <UserPlus className="text-primary" size={22} />
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Claim your trial workout</h2>
                  <p className="mt-1 text-sm font-semibold text-white/45">Share your contact and the gym team will follow up.</p>
                </div>
              </div>
              <form onSubmit={submitLead} className="mt-6 space-y-4">
                <Field label="Name" value={form.full_name} onChange={(v) => setForm((c) => ({ ...c, full_name: v }))} required placeholder="Your full name" />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm((c) => ({ ...c, phone: v }))} required placeholder="+91..." />
                <Field label="Email" value={form.email} onChange={(v) => setForm((c) => ({ ...c, email: v }))} type="email" placeholder="Optional" />
                {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p>}
                {success && (
                  <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                    <CheckCircle2 size={16} /> {success}
                  </p>
                )}
                <button disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60">
                  <Phone size={16} /> {submitting ? 'Sending...' : 'Claim free trial'}
                </button>
              </form>
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Gift size={16} />
                  <p className="text-xs font-black uppercase tracking-widest">Why join</p>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                  Earn badges, unlock real gym clubs, and collect ₹ loyalty credits in your Gymmigo wallet — on any membership plan.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};

const PublicFitnessCardProfile = ({ card, cardCode }: { card: any; cardCode: string }) => {
  const fitnessId = String(card?.share?.card_code || card?.fitness_card?.card_code || cardCode || '').toUpperCase();
  const qrPayload = card?.share?.qr_payload || `gymmigo:fitness-card:${fitnessId}`;
  const shareUrl = card?.share?.share_url || `${window.location.origin}/fitness-card/${fitnessId}`;
  const tierLabel = card?.tier_card?.tier_label || card?.fitcard?.tier_label || card?.fitcard?.frame || 'Starter';
  const memberName = card?.member?.name || 'Gymmigo Member';

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/">
            <BrandLogo size={44} />
          </Link>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-200">
            Fitness Card
          </span>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(241,130,44,0.18),transparent_35%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                <Sparkles size={13} /> Holographic member identity
              </div>
              <div>
                <h1 className="text-4xl font-display font-black tracking-tight sm:text-6xl">{memberName}</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/50">
                  Permanent Gymmigo Fitness Card profile with verified progress, social gallery, and a six-character Fitness ID.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Fitness ID" value={fitnessId || 'PENDING'} />
                <Metric label="Score" value={card?.tier_card?.fitness_score ?? card?.fitcard?.fitness_score ?? 0} />
                <Metric label="Streak" value={card?.fitcard?.current_streak ?? 0} />
                <Metric label="Check-ins" value={card?.fitcard?.total_check_ins ?? 0} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={shareUrl}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Share2 size={16} /> Share Card
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-widest text-white/70 transition hover:border-primary/30 hover:text-white"
                >
                  Join Gymmigo <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[360px] rounded-[28px] border border-cyan-200/20 bg-gradient-to-br from-slate-950 via-[#121a2a] to-slate-950 p-5 shadow-2xl shadow-cyan-500/20">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-primary/25 via-cyan-400/15 to-fuchsia-400/10 opacity-80" />
              <div className="relative flex aspect-[1.58/1] flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/40">Fitness Card</p>
                    <p className="mt-1 text-sm font-black tracking-widest">GYMMIGO CORE</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase text-white/80">
                    {tierLabel}
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-black uppercase tracking-tight">{memberName}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-widest text-cyan-100/75">Fitness ID {fitnessId}</p>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                      {card?.member?.avatar_url ? (
                        <img src={card.member.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-primary">{getInitials(memberName)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Verified</p>
                      <p className="text-xs font-black text-emerald-200">Active profile</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-2">
                    <QRCodeSVG value={qrPayload} size={44} fgColor="#0F172A" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const GymLogo = ({ src, name }: { src?: string | null; name: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-300/15 bg-slate-950/45 p-1">
      {src && !failed ? (
        <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span className="text-sm font-black text-primary">{getInitials(name)}</span>
      )}
    </div>
  );
};

const StatTile = ({ label, value, tone = 'white' }: { label: string; value: number | string; tone?: 'white' | 'orange' | 'green' }) => (
  <div className="rounded-lg border border-slate-300/10 bg-slate-950/45 p-3">
    <p className="text-[10px] font-black uppercase text-white/35">{label}</p>
    <p className={clsx(
      'mt-1 text-xl font-black',
      tone === 'orange' && 'text-primary',
      tone === 'green' && 'text-emerald-300',
      tone === 'white' && 'text-white'
    )}>{value}</p>
  </div>
);

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-xl border border-slate-300/10 bg-slate-950/35 p-3">
    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</p>
    <p className="mt-1 text-xl font-black">{value}</p>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      minLength={required ? 2 : undefined}
      placeholder={placeholder}
      className="mt-2 w-full rounded-2xl border border-slate-300/10 bg-slate-950/55 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-primary/50"
    />
  </label>
);

export default PublicFitCard;
