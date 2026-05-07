import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Activity,
  Award,
  BicepsFlexed,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  ListChecks,
  Medal,
  Phone,
  StretchHorizontal,
  Trophy,
  Utensils,
  UserPlus,
  Users,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../utils/api';
import PageLoader from '../../components/PageLoader';

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
  badges: Array<{
    mission: {
      code: string;
      title: string;
      target_value: number;
      points: number;
    };
    badge: {
      name: string;
      icon?: string;
      color?: string;
    };
    completed_at?: string | null;
  }>;
  clubs: Array<{
    id?: string;
    code: string;
    name: string;
  }>;
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
};

const PublicFitCard = () => {
  const { inviteCode = '' } = useParams();
  const [card, setCard] = useState<PublicFitCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const topBadges = useMemo(() => card?.badges.slice(0, 4) || [], [card?.badges]);
  const invitePayload = card?.share?.qr_payload || `gymmigo:fitcard:${inviteCode}`;

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/clubs/fitcard/${inviteCode}`);
        setCard(res.data?.data || null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (inviteCode) fetchCard();
  }, [inviteCode]);

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
      <main className="min-h-screen bg-black px-5 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <Trophy size={42} className="mx-auto text-primary" />
          <h1 className="mt-5 text-3xl font-black tracking-tight">FitCard unavailable</h1>
          <p className="mt-3 text-sm font-semibold text-white/50">{error || 'This invite link is no longer active.'}</p>
          <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">Go to Gymmigo <ArrowRight size={16} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-white hover:text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black">
              <Trophy size={20} />
            </div>
            <span className="font-black tracking-tight">Gymmigo</span>
          </Link>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
            FitCard Invite
          </span>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(241,130,44,0.18),rgba(255,255,255,0.04)_45%,rgba(22,163,74,0.12))]"
          >
            <div className="border-b border-white/10 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">{card.gym.name}</p>
                  <h1 className="mt-4 text-4xl font-black tracking-tighter sm:text-6xl">{card.fitcard.title}</h1>
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/50">
                    {card.trial_offer?.headline || `${card.member.name} invited you for a free trial workout.`}
                  </p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {card.member.avatar_url ? <img src={card.member.avatar_url} alt="" className="h-full w-full object-cover" /> : <Medal className="text-primary" size={28} />}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {card.gym.logo_url ? <img src={card.gym.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="text-primary" size={22} />}
                  </div>
                  <div>
                    <p className="text-lg font-black">{card.member.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{card.fitcard.frame} frame</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric label="Check-ins" value={card.fitcard.total_check_ins} />
                  <Metric label="Streak" value={card.fitcard.current_streak} />
                  <Metric label="Points" value={card.fitcard.total_points} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto rounded-2xl border border-white/10 bg-white p-3">
                  <QRCodeSVG value={invitePayload} size={118} fgColor="#111827" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Invited by</p>
                  <p className="mt-1 text-xl font-black text-white">{card.member.name}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/45">{card.trial_offer?.description}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <UserPlus className="text-primary" size={22} />
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Claim your trial workout</h2>
                  <p className="mt-1 text-sm font-semibold text-white/45">Share your contact and the gym team will follow up.</p>
                </div>
              </div>

              <form onSubmit={submitLead} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Name</span>
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                    required
                    minLength={2}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-primary/50"
                    placeholder="Your full name"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Phone</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-primary/50"
                    placeholder="+91..."
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Email</span>
                  <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-primary/50"
                    placeholder="Optional"
                  />
                </label>

                {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p>}
                {success && (
                  <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                    <CheckCircle2 size={16} /> {success}
                  </p>
                )}

                <button disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                  <Phone size={16} /> {submitting ? 'Sending...' : 'Claim Free Trial'}
                </button>
              </form>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              {topBadges.map((badge) => {
                const Icon = iconMap[badge.badge.icon as keyof typeof iconMap] || Award;
                return (
                  <div key={badge.mission.code} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/25" style={{ color: badge.badge.color || '#f1822c' }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{badge.badge.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">+{badge.mission.points} points</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {card.clubs.slice(0, 2).map((club) => (
                <div key={club.id || club.code} className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <Users className="text-emerald-300" size={20} />
                    <div>
                      <p className="text-sm font-black text-white">{club.name}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Club unlocked</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</p>
    <p className="mt-1 text-2xl font-black">{value}</p>
  </div>
);

export default PublicFitCard;
