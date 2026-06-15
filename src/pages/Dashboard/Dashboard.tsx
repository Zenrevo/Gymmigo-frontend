import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { 
  Users, Building2, 
  TrendingUp, Star, Plus, ArrowRight, ScanLine, Activity,
  MessageCircle, User, CheckCircle2, Shield, AlertTriangle, MapPin, Calendar,
  Award, Flame, Trophy, Package,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import QRScannerModal from '../../components/QRScannerModal';
import PageLoader from '../../components/PageLoader';
import TrainerDashboard from './TrainerDashboard';
import BookingDetailModal from '../../components/BookingDetailModal';
import GymOwnerInsights from '../../components/GymOwnerInsights';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Guard: Don't fetch if user or active_role is missing, or if role is not completed
    const currentRole = user?.roles?.find((r: any) => r.role === user.active_role);
    if (!user?.active_role || !currentRole?.is_completed) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let endpoint = '';
      if (user.active_role === 'user') endpoint = '/memberships/my';
      else if (user.active_role === 'trainer') endpoint = '/trainer/full';
      else if (user.active_role === 'gym_owner' || user.active_role === 'gym_manager') endpoint = '/gym-owner/gyms';

      if (endpoint) {
        const res = await api.get(endpoint);
        const dashboardData = res.data.data;

        // If user, also fetch trainer bookings and upcoming sessions
        if (user.active_role === 'user') {
          try {
            const bookingsRes = await api.get('/trainer-bookings/bookings/my?role=user');
            dashboardData.trainer_bookings = bookingsRes.data.data.bookings || [];
            const sessionsRes = await api.get('/trainer-bookings/sessions/my?role=user');
            // Filter to only upcoming scheduled/pending sessions
            dashboardData.upcoming_sessions = (sessionsRes.data.data.sessions || [])
              .filter((s: any) => ['pending_confirmation', 'scheduled'].includes(s.status));
          } catch (err) {
            console.error('Failed to fetch trainer bookings or sessions:', err);
            dashboardData.trainer_bookings = [];
            dashboardData.upcoming_sessions = [];
          }
        }

        setData(dashboardData);

        if (user.active_role === 'gym_owner' || user.active_role === 'gym_manager') {
          const revRes = await api.get('/gym-owner/gyms/reviews');
          setReviews(revRes.data.data.reviews?.slice(0, 5) || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.active_role, user?.roles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <PageLoader message="Loading your hub..." />;

  return (
    <div className="space-y-12">
      {/* Header Greeting Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative py-10 px-8 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] overflow-hidden shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[1px] w-8 bg-primary/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Intelligence Hub</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white italic">
            WELCOME BACK, {user?.full_name?.split(' ')[0] || 'CHAMP'} <span className="not-italic">⚡️</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs md:text-sm max-w-2xl leading-relaxed">
            {user?.active_role === 'user' && data?.ai_tagline 
              ? data.ai_tagline 
              : ['gym_owner', 'gym_manager'].includes(user?.active_role || '') 
                ? 'Managing your fitness empire with precision data' 
                : 'Ready to crush your coaching goals today?'}
          </p>
        </div>
      </motion.div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {user?.active_role === 'user' ? (
          <UserDashboardView data={data} onRefreshData={fetchData} />
        ) : user?.active_role === 'trainer' ? (
          <TrainerDashboardView data={data} />
        ) : (
          <OwnerDashboardView data={data} reviews={reviews} />
        )}
      </div>
    </div>
  );
};

import MembershipDetailView from './MembershipDetailView';

import AITodaysFocus from '../../components/AITodaysFocus';

const UserDashboardView = ({ data, onRefreshData }: { data: any; onRefreshData: () => void }) => {
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [clubReward, setClubReward] = useState<{ pending?: any; available?: any } | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);

  const groupedMemberships = useMemo(() => {
    if (!data?.memberships) return [];
    
    const groups: Record<string, any> = {};
    data.memberships.forEach((m: any) => {
      const gymId = m.gym_id;
      if (!groups[gymId]) {
        groups[gymId] = {
          gym_id: gymId,
          gym_name: m.gym_name,
          gym_logo_url: m.gym_logo_url,
          current_occupancy: m.current_occupancy,
          max_capacity: m.max_capacity,
          // Derive overall status: 'active' if ANY plan is active
          status: m.status, 
          memberships: []
        };
      }
      groups[gymId].memberships.push(m);
      if (m.status === 'active') {
        groups[gymId].status = 'active'; // upgrade group status to active if one plan is active
      }
    });
    return Object.values(groups);
  }, [data?.memberships]);

  const activeMemberships = useMemo(
    () => groupedMemberships.filter((group: any) => group.status === 'active'),
    [groupedMemberships]
  );

  const groupedTrainerBookings = useMemo(() => {
    if (!data?.trainer_bookings) return [];
    
    const groups: Record<string, any> = {};
    data.trainer_bookings.forEach((b: any) => {
      const trainerId = b.trainer_id;
      if (!groups[trainerId]) {
        groups[trainerId] = { ...b };
      } else {
        // Aggregate counts
        groups[trainerId].sessions_remaining += b.sessions_remaining;
        groups[trainerId].total_sessions += (b.total_sessions || 0);
        
        // If the representative 'id' has no sessions but this one does, swap it
        // so scheduling targets a valid booking.
        if (groups[trainerId].sessions_remaining === 0 && b.sessions_remaining > 0) {
          groups[trainerId].id = b.id;
        }
      }
    });
    return Object.values(groups).filter((b: any) => b.sessions_remaining > 0);
  }, [data?.trainer_bookings]);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await api.get('/memberships/dashboard-stats');
        if (mounted) setStats(res.data?.data || null);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const isCheckedIn = Boolean(data?.current_check_in);
  const score = stats?.daily_score?.score ?? stats?.today_score ?? 0;
  const streak = stats?.streak ?? 0;
  const totalPoints = stats?.competition?.total_points ?? 0;
  const weeklyTarget = stats?.weekly_target_days ?? 4;
  const activeDays = stats?.week_active_days ?? 0;
  const weekProgress = Math.min(100, (activeDays / Math.max(1, weeklyTarget)) * 100);
  const scoreTone = score >= 75 ? 'text-emerald-400 border-emerald-400/35' : score >= 45 ? 'text-primary border-primary/35' : 'text-red-400 border-red-400/35';
  const primaryGym = activeMemberships[0];
  const coachNudge = stats?.daily_score?.coach_nudge || data?.ai_tagline || 'Check in, train, and keep your week moving.';
  const upcomingSessions = data?.upcoming_sessions || [];
  const showTrainingPanel = upcomingSessions.length > 0 || groupedTrainerBookings.length === 0;

  useEffect(() => {
    let mounted = true;
    const fetchClubReward = async () => {
      if (!primaryGym?.gym_id) {
        setClubReward(null);
        return;
      }
      try {
        const [fitcardRes, claimsRes] = await Promise.all([
          api.get(`/clubs/fitcard/me?gym_id=${primaryGym.gym_id}`),
          api.get(`/clubs/reward-claims/my?gym_id=${primaryGym.gym_id}`).catch(() => ({ data: { data: { claims: [] } } })),
        ]);
        if (!mounted) return;
        const clubs = fitcardRes.data?.data?.clubs || [];
        const claims = claimsRes.data?.data?.claims || [];
        const pending = claims.find((claim: any) => claim.status === 'claimed');
        const available = clubs.find((club: any) => !claims.some((claim: any) => claim.club_code === club.code && claim.status !== 'cancelled'));
        setClubReward({ pending, available });
      } catch {
        if (mounted) setClubReward(null);
      }
    };
    fetchClubReward();
    return () => { mounted = false; };
  }, [primaryGym?.gym_id]);

  const claimReward = async () => {
    const available = clubReward?.available;
    if (!primaryGym?.gym_id || !available?.code) return;
    setClaimingReward(true);
    try {
      await api.post('/clubs/reward-claims', {
        gym_id: primaryGym.gym_id,
        club_code: available.code,
      });
      setClubReward({
        pending: { club_name: available.name, reward_label: available.reward_preview || 'Reward claim sent', status: 'claimed' },
        available: null,
      });
    } catch (err) {
      console.error('Failed to claim Club reward:', err);
    } finally {
      setClaimingReward(false);
    }
  };

  if (selectedMembership) {
    return (
      <div className="md:col-span-3">
        <MembershipDetailView gymGroup={selectedMembership} onBack={() => setSelectedMembership(null)} />
      </div>
    );
  }

  return (
    <>
      <div className={clsx('space-y-8', showTrainingPanel ? 'md:col-span-2' : 'md:col-span-3')}>
        <section className="glass-card overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-white/[0.03] to-transparent p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className={clsx('inline-flex items-center gap-2 rounded-2xl border bg-slate-950/25 px-4 py-3', scoreTone)}>
                  {statsLoading ? (
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">Syncing</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black">{score}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">score</span>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Member Home</p>
                  <h3 className="text-2xl font-black tracking-tight">
                    {isCheckedIn ? 'Move in progress' : primaryGym ? "Today's Move" : 'Find Your Move'}
                  </h3>
                </div>
              </div>
              <p className="max-w-xl text-sm font-semibold leading-6 text-white/55">{coachNudge}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-widest transition-all active:scale-95',
                isCheckedIn ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-primary text-black hover:brightness-110'
              )}
            >
              {isCheckedIn ? <CheckCircle2 size={18} /> : <ScanLine size={18} />}
              {isCheckedIn ? 'Workout Active' : 'Scan Check-in'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <Trophy size={15} className="mb-2 text-primary" />
              <p className="text-xl font-black text-white">{activeDays}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/35">Active days</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <Flame size={15} className="mb-2 text-amber-400" fill="currentColor" />
              <p className="text-xl font-black text-amber-300">{streak}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/35">Streak</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <Award size={15} className="mb-2 text-emerald-400" />
              <p className="text-xl font-black text-emerald-300">{totalPoints}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/35">Points</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-white/45">
              <span>Weekly progress</span>
              <span>{activeDays}/{weeklyTarget} active days</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${weekProgress}%` }} />
            </div>
          </div>

          {primaryGym && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/app/clubs" className="flex min-h-[76px] items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-primary transition-all hover:border-primary/40 hover:bg-primary/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-black/25">
                  <Trophy size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-widest text-white">Club Road</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-white/45">{totalPoints} pts · {streak} day streak</span>
                </span>
                <ArrowRight size={15} />
              </Link>

              <Link to="?social=true&socialTab=profile" className="flex min-h-[76px] items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-black/25">
                  <Award size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-widest text-white">My FitCard</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-white/45">Redesigned Card</span>
                </span>
                <ArrowRight size={15} />
              </Link>

              <Link to="?social=true&socialTab=feed" className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[#f1822c]/20 bg-[#f1822c]/10 px-4 py-3 text-[#f1822c] transition-all hover:border-[#f1822c]/40 hover:bg-[#f1822c]/15">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f1822c]/25 bg-black/25">
                  <Users size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-widest text-white">Social Feed</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-white/45">Buddies & Posts</span>
                </span>
                <ArrowRight size={15} />
              </Link>

              {clubReward?.available ? (
                <button
                  type="button"
                  onClick={claimReward}
                  disabled={claimingReward}
                  className="flex min-h-[76px] items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-left text-emerald-300 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/15 disabled:opacity-70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-black/25">
                    <Package size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black uppercase tracking-widest text-white">Reward ready</span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-white/45">
                      {claimingReward ? 'Sending claim...' : clubReward.available.reward_preview || clubReward.available.name}
                    </span>
                  </span>
                </button>
              ) : (
                <Link
                  to="/app/clubs"
                  className="flex min-h-[76px] items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-left text-emerald-300 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/15"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-black/25">
                    <Package size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black uppercase tracking-widest text-white">
                      {clubReward?.pending ? 'Claim sent' : 'FitCard'}
                    </span>
                    <span className="mt-1 block truncate text-[11px] font-bold text-white/45">
                      {clubReward?.pending ? clubReward.pending.reward_label || 'Show at gym desk' : 'Share and invite'}
                    </span>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Today's Focus Card */}
        <section className="space-y-6">
          <AITodaysFocus />
        </section>

        <div className="flex items-center justify-between pt-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Star size={18} />
            </div>
            Active Memberships
          </h3>
        </div>
        {groupedMemberships.length ? groupedMemberships.map((group: any, index: number) => (
          <motion.div 
            key={group.gym_id || index} 
            whileHover={{ scale: 1.01 }} 
            onClick={() => setSelectedMembership(group)}
            className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between group overflow-hidden cursor-pointer hover:border-primary/50 transition-all border border-transparent gap-4"
          >
             <div className="flex items-center gap-4 sm:gap-6">
               <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all overflow-hidden relative shrink-0">
                 {group.gym_logo_url ? (
                   <img src={group.gym_logo_url} alt="logo" className="w-full h-full object-cover" />
                 ) : (
                   <Building2 size={24} className="sm:w-8 sm:h-8" />
                 )}
               </div>
               <div className="min-w-0">
                 <h4 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors truncate">{group.gym_name}</h4>
                 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                   <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{group.memberships.length} Plan{group.memberships.length !== 1 && 's'}</p>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all shrink-0">
                      <Activity size={10} className={clsx(
                        "animate-pulse",
                        (group.current_occupancy / (group.max_capacity || 100)) > 0.8 ? "text-red-500" : 
                        (group.current_occupancy / (group.max_capacity || 100)) > 0.5 ? "text-orange-500" : "text-emerald-500"
                      )} />
                      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-tighter text-white whitespace-nowrap">
                        {group.current_occupancy} / {group.max_capacity || 100} <span className="text-white/40 font-bold">LIVE</span>
                      </span>
                    </div>

                 </div>
               </div>
             </div>
             <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
               <div className="flex flex-col items-end gap-2">
                 <span className={clsx(
                   "text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shrink-0",
                   group.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'
                 )}>
                   {group.status}
                 </span>
               </div>
               <div className="text-white/20 group-hover:text-primary transition-colors">
                 <ArrowRight size={18} className="sm:w-5 sm:h-5" />
               </div>
             </div>
          </motion.div>
        )) : (
          <div className="glass-card p-12 text-center text-white/20">No memberships yet. Visit a gym to get started!</div>
        )}

        {groupedTrainerBookings.length > 0 && (
          <div className="pt-6 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <User size={18} />
              </div>
              Your Trainers
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {groupedTrainerBookings.map((booking: any) => (
                <div 
                  key={booking.id} 
                  onClick={() => setSelectedBooking(booking)}
                  className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between group cursor-pointer hover:border-primary/30 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all shrink-0">
                      <User size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors truncate">{booking.trainer_name || 'Pro Trainer'}</h4>
                      <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest truncate">{booking.package_name || 'Personal Training'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-0.5">Sessions</p>
                      <p className="text-xs sm:text-sm font-black">
                        {booking.sessions_completed} <span className="text-white/20 font-medium">/ {booking.total_sessions}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={clsx(
                        "text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shrink-0",
                        booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-white/5 text-white/20 border border-white/10'
                      )}>
                        {booking.status}
                      </span>
                      <ArrowRight size={16} className="text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showTrainingPanel && (
        <div className="space-y-8 md:col-span-1">
          <div className="space-y-4">
            {upcomingSessions.length > 0 ? (
              <>
                <h4 className="font-bold">Upcoming Sessions</h4>
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 3).map((session: any) => (
                    <Link key={session.id} to={`/app/sessions/${session.id}`} className="block glass-card p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 space-y-2 hover:border-primary/50 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white capitalize">{session.session_type} Session</p>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                          {session.status === 'pending_confirmation' ? 'Pending' : session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-white/60 text-xs font-bold">
                        <Calendar size={14} className="text-primary" />
                        <span>{new Date(session.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {session.scheduled_time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/60 text-xs font-bold">
                        <MapPin size={14} className="text-primary" />
                        <span className="truncate max-w-[200px]" title={session.location || 'Trainer Gym'}>{session.location || 'Trainer Gym'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <h4 className="font-bold">Personal Training</h4>
            )}
            <Link to="/app/trainers" className="w-full btn-primary py-3 inline-block text-center mt-2">Find a Trainer</Link>
          </div>
        </div>
      )}

      <QRScannerModal 
        isOpen={showQRScanner} 
        onClose={() => setShowQRScanner(false)} 
        onSuccess={() => {
          onRefreshData();
        }}
      />
      
      <BookingDetailModal 
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        role="user"
      />
    </>
  );
};


const TrainerDashboardView = ({ data: _data }: { data: any }) => {
  return (
    <div className="md:col-span-3">
      <TrainerDashboard />
    </div>
  );
};

const OwnerDashboardView = ({ data, reviews }: { data: any, reviews: any[] }) => {
  const totalGyms = Array.isArray(data) ? data.length : 0;
  const totalMembers = Array.isArray(data) ? data.reduce((acc: number, item: any) => acc + (item.metrics?.active_members || 0), 0) : 0;
  const totalRevenue = Array.isArray(data) ? data.reduce((acc: number, item: any) => acc + (item.metrics?.monthly_revenue || 0), 0) : 0;
  const gyms = Array.isArray(data) ? data : [];
  const [growthByGym, setGrowthByGym] = useState<Record<string, any>>({});
  const [growthLoading, setGrowthLoading] = useState(false);
  const growthItems = gyms.map((item: any) => growthByGym[item.gym?.id]).filter(Boolean);
  const growthTotals = {
    newLeads: growthItems.reduce((sum: number, item: any) => sum + (item.new_leads || 0), 0),
    trials: growthItems.reduce((sum: number, item: any) => sum + (item.trial_booked || 0), 0),
    rewards: growthItems.reduce((sum: number, item: any) => sum + (item.pending_reward_claims || 0), 0),
    atRisk: growthItems.reduce((sum: number, item: any) => sum + (item.at_risk_members || 0), 0),
    renewals: growthItems.reduce((sum: number, item: any) => sum + (item.renewals_due_7d || 0), 0),
  };
  const priorityGym = gyms.find((item: any) => {
    const summary = growthByGym[item.gym?.id];
    return summary?.new_leads || summary?.trial_booked || summary?.pending_reward_claims || summary?.at_risk_members;
  }) || gyms[0];
  const pickGymFor = (predicate: (summary: any) => boolean) => (
    gyms.find((item: any) => predicate(growthByGym[item.gym?.id] || {})) || priorityGym
  );
  const ownerRoute = (item: any, screen?: string) => {
    const gymId = item?.gym?.id || priorityGym?.gym?.id;
    if (!gymId) return '/app/gym-owner/add-gym';
    return screen ? `/app/gym-owner/gyms/${gymId}/${screen}` : `/app/gym-owner/gyms/${gymId}`;
  };
  const ownerPriority =
    growthTotals.newLeads > 0
      ? {
          icon: MessageCircle,
          title: `${growthTotals.newLeads} new lead${growthTotals.newLeads === 1 ? '' : 's'} waiting`,
          copy: 'Open WhatsApp or call before interest cools down.',
          label: 'Follow up',
          color: 'text-primary',
          border: 'border-primary/25 bg-primary/10',
          button: 'bg-primary text-black',
          route: ownerRoute(pickGymFor((summary) => (summary.new_leads || 0) > 0), 'leads'),
        }
      : growthTotals.rewards > 0
      ? {
          icon: Package,
          title: `${growthTotals.rewards} reward claim${growthTotals.rewards === 1 ? '' : 's'} pending`,
          copy: 'Redeem benefits fast so Clubs feel like real value.',
          label: 'Redeem',
          color: 'text-emerald-300',
          border: 'border-emerald-400/25 bg-emerald-400/10',
          button: 'bg-emerald-400 text-black',
          route: ownerRoute(pickGymFor((summary) => (summary.pending_reward_claims || 0) > 0), 'clubs'),
        }
      : growthTotals.atRisk > 0
      ? {
          icon: AlertTriangle,
          title: `${growthTotals.atRisk} member${growthTotals.atRisk === 1 ? '' : 's'} need attention`,
          copy: 'Review member activity and call the most likely drop-offs.',
          label: 'Open members',
          color: 'text-red-300',
          border: 'border-red-400/25 bg-red-400/10',
          button: 'bg-red-400 text-black',
          route: ownerRoute(pickGymFor((summary) => (summary.at_risk_members || 0) > 0), 'members'),
        }
      : growthTotals.renewals > 0
      ? {
          icon: Calendar,
          title: `${growthTotals.renewals} renewal${growthTotals.renewals === 1 ? '' : 's'} due this week`,
          copy: 'Secure renewal intent before expiry day pressure.',
          label: 'Review',
          color: 'text-amber-300',
          border: 'border-amber-400/25 bg-amber-400/10',
          button: 'bg-amber-300 text-black',
          route: ownerRoute(pickGymFor((summary) => (summary.renewals_due_7d || 0) > 0), 'members'),
        }
      : {
          icon: TrendingUp,
          title: 'Growth is steady today',
          copy: 'No urgent gaps. Review gym health or start a FitCard push.',
          label: 'Open gym',
          color: 'text-blue-300',
          border: 'border-blue-400/25 bg-blue-400/10',
          button: 'bg-blue-300 text-black',
          route: ownerRoute(priorityGym),
        };
  const OwnerPriorityIcon = ownerPriority.icon;

  useEffect(() => {
    let mounted = true;
    const fetchGrowth = async () => {
      if (!gyms.length) {
        setGrowthByGym({});
        return;
      }
      setGrowthLoading(true);
      try {
        const results = await Promise.all(
          gyms.map((item: any) =>
            item.gym?.id
              ? api
                  .get(`/clubs/gyms/${item.gym.id}/growth-summary`)
                  .then((res) => [item.gym.id, res.data?.data])
                  .catch(() => [item.gym.id, null])
              : Promise.resolve([null, null])
          )
        );
        if (!mounted) return;
        const next: Record<string, any> = {};
        results.forEach(([id, summary]) => {
          if (id && summary) next[id as string] = summary;
        });
        setGrowthByGym(next);
      } catch (err) {
        console.error('Failed to fetch web growth summary:', err);
      } finally {
        if (mounted) setGrowthLoading(false);
      }
    };
    fetchGrowth();
    return () => { mounted = false; };
  }, [data]);

  return (
    <>
      <div className="md:col-span-2 space-y-6">
        <section className="rounded-[2rem] border border-primary/20 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Growth Command Center</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-white">Do this first</h3>
                <p className="mt-1 text-sm font-semibold text-white/45">One priority, then the numbers behind it.</p>
              </div>
              {growthLoading && <span className="text-xs font-black uppercase tracking-widest text-white/35">Syncing</span>}
            </div>

            <div className={clsx('flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center', ownerPriority.border)}>
              <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-black/20', ownerPriority.border, ownerPriority.color)}>
                <OwnerPriorityIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-black leading-tight text-white">{ownerPriority.title}</h4>
                <p className="mt-1 text-sm font-semibold leading-5 text-white/50">{ownerPriority.copy}</p>
              </div>
              <Link to={ownerPriority.route} className={clsx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition hover:brightness-110', ownerPriority.button)}>
                {ownerPriority.label} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <GrowthSignal label="New leads" value={growthTotals.newLeads} tone="text-primary" />
              <GrowthSignal label="Trials" value={growthTotals.trials} tone="text-amber-300" />
              <GrowthSignal label="Rewards" value={growthTotals.rewards} tone="text-emerald-300" />
              <GrowthSignal label="At risk" value={growthTotals.atRisk} tone="text-red-300" />
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h3 className="text-xl font-bold">Your Gyms</h3>
          <Link 
            to="/app/gym-owner/add-gym" 
            className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={14} /> List New Gym
          </Link>
        </div>
        {data?.length ? data.map((item: any, index: number) => (
          <Link 
            key={item.gym?.id || index} 
            to={`/app/gym-owner/gyms/${item.gym?.id}`}
            className="glass-card p-6 flex flex-col gap-4 group hover:border-primary/50 transition-all active:scale-98 relative"
          >
            <div className="absolute top-6 right-6 flex items-center gap-2">
              {item.gym?.is_verified ? (
                <span className="text-blue-400 text-[10px] font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-1">
                  <Shield size={10} /> Verified
                </span>
              ) : (
                <span className="text-amber-400 text-[10px] font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle size={10} /> Unverified
                </span>
              )}
              {item.gym?.is_active ? (
                <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Active</span>
              ) : (
                <span className="text-red-500 text-[10px] font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 uppercase tracking-widest">Inactive</span>
              )}
            </div>
            
            {/* Status Banner */}
            {(!item.gym?.is_verified || !item.gym?.is_active) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3 mb-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400">
                    {!item.gym?.is_verified && !item.gym?.is_active
                      ? 'Your gym is not verified and inactive — it won\'t appear in explore.'
                      : !item.gym?.is_verified
                      ? 'Your gym is pending verification — it won\'t appear in explore until approved.'
                      : 'Your gym is currently inactive — members cannot discover it.'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 pr-16">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all overflow-hidden shrink-0">
                {item.gym?.logo_url ? (
                  <img src={item.gym.logo_url} alt={item.gym.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={24} />
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{item.gym?.name}</h4>
                <p className="text-xs text-white/40 line-clamp-1">{item.gym?.description || 'No description available'}</p>
              </div>
            </div>

            {/* Performance Analytics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
              <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-end">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Active Users</p>
                  <Users size={14} className="text-primary/60" />
                </div>
                <p className="text-2xl font-black text-white">
                  {item.gym?.show_stats ? (item.metrics?.active_members || 0) : '•••'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-end relative overflow-hidden">
                <TrendingUp size={60} className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">MTD Revenue</p>
                </div>
                <p className="text-2xl font-black text-white">
                  {item.gym?.show_stats ? `₹${(item.metrics?.monthly_revenue || 0).toLocaleString()}` : '₹ •••••'}
                </p>
              </div>
            </div>
            {growthByGym[item.gym?.id] && (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase text-primary">
                  {growthByGym[item.gym.id].new_leads || 0} new leads
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-200">
                  {growthByGym[item.gym.id].pending_reward_claims || 0} rewards
                </span>
                <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-[10px] font-black uppercase text-red-200">
                  {growthByGym[item.gym.id].at_risk_members || 0} at risk
                </span>
              </div>
            )}
          </Link>
        )) : (
          <div className="glass-card p-12 text-center text-white/20">No gyms listed. Start growing your fitness empire!</div>
        )}

        {/* Gym Owner Insights / Analytics & CRM */}
        <GymOwnerInsights gyms={data} />

        {/* Global Recent Reviews */}
        <div className="space-y-6 pt-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <MessageCircle size={18} />
                 </div>
                 Recent Feedback
              </h3>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {reviews.length > 0 ? reviews.map((rev) => (
                 <div key={rev.id} className="glass-card p-5 space-y-3 group hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                             {rev.avatar_url ? <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-white/20" />}
                          </div>
                          <div>
                             <h5 className="text-xs font-bold text-white">{rev.user_name}</h5>
                             <div className="flex items-center gap-1 mt-0.5">
                                {[1,2,3,4,5].map(i => <Star key={i} size={8} className={clsx(i <= rev.rating ? "text-primary fill-primary" : "text-white/10")} />)}
                                <span className="text-[8px] text-white/20 ml-1 uppercase font-bold tracking-tighter">on {rev.gym_name}</span>
                             </div>
                          </div>
                       </div>
                       <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                       <h6 className="text-[10px] font-bold italic text-white/80 uppercase tracking-tight flex items-center gap-1.5">
                         {rev.title}
                         {rev.owner_response && <CheckCircle2 size={10} className="text-emerald-500" />}
                       </h6>
                       <p className="text-[11px] text-white/40 line-clamp-2 mt-1">{rev.review}</p>
                    </div>
                    {!rev.owner_response && (
                       <Link 
                          to={`/app/gym-owner/gyms/${rev.gym_id}/reviews`}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                       >
                          Reply Now <ArrowRight size={10} />
                       </Link>
                    )}
                 </div>
              )) : (
                 <div className="glass-card p-10 text-center border-dashed text-white/10 text-[10px] uppercase font-bold tracking-[0.2em]">
                    No feedback received yet
                 </div>
              )}
           </div>
        </div>
      </div>
      <div className="space-y-8">
        <h3 className="text-xl font-bold">Portfolio Overview</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card p-6 border-b-2 border-b-primary/50 relative overflow-hidden group hover:border-white/10 transition-colors">
            <Building2 size={80} className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-all transform group-hover:scale-110" />
            <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 flex items-center gap-2"><Building2 size={14} className="text-primary"/> Total Gyms</h4>
            <p className="text-3xl font-black">{totalGyms}</p>
          </div>
          <div className="glass-card p-6 border-b-2 border-b-emerald-500/50 relative overflow-hidden group hover:border-white/10 transition-colors">
             <Users size={80} className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-all transform group-hover:scale-110" />
             <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 flex items-center gap-2"><Users size={14} className="text-emerald-500"/> Total Active Members</h4>
             <p className="text-3xl font-black">
               {Array.isArray(data) && data.every((item: any) => item.gym.show_stats) ? totalMembers : '•••'}
             </p>
          </div>
          <div className="glass-card p-6 border-b-2 border-b-green-500/50 relative overflow-hidden group hover:border-white/10 transition-colors">
             <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-green-500/5 group-hover:text-green-500/10 transition-all transform group-hover:scale-110" />
             <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 flex items-center gap-2"><TrendingUp size={14} className="text-green-500"/> Combined MTD Revenue</h4>
             <p className="text-3xl font-black">
               {Array.isArray(data) && data.every((item: any) => item.gym.show_stats) ? `₹${totalRevenue.toLocaleString()}` : '₹ •••••'}
             </p>
          </div>
        </div>
      </div>
    </>
  );
};

const GrowthSignal = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className={clsx('text-2xl font-black', tone)}>{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
  </div>
);

export default Dashboard;
