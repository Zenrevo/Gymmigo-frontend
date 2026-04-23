import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, Building2, 
  TrendingUp, Star, Plus, ArrowRight, ScanLine, Activity,
  MessageCircle, User, CheckCircle2, Shield, AlertTriangle, MapPin, Calendar
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import QRScannerModal from '../../components/QRScannerModal';
import PageLoader from '../../components/PageLoader';
import TrainerDashboard from './TrainerDashboard';
import BookingDetailModal from '../../components/BookingDetailModal';
import GymOwnerInsights from '../../components/GymOwnerInsights';
import MemberInsights from '../../components/MemberInsights';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
          const res = await axios.get(`${API_URL}${endpoint}`, { timeout: 10000 });
          let dashboardData = res.data.data;

          // If user, also fetch trainer bookings and upcoming sessions
          if (user.active_role === 'user') {
            try {
              const bookingsRes = await axios.get(`${API_URL}/trainer-bookings/bookings/my?role=user`);
              dashboardData.trainer_bookings = bookingsRes.data.data.bookings || [];
              const sessionsRes = await axios.get(`${API_URL}/trainer-bookings/sessions/my?role=user`);
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
            const revRes = await axios.get(`${API_URL}/gym-owner/gyms/reviews`);
            setReviews(revRes.data.data.reviews?.slice(0, 5) || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.active_role, user?.roles]);

  if (loading) return <PageLoader message="Loading your hub..." />;

  return (
    <div className="space-y-12">
      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {user?.active_role === 'user' ? (
          <UserDashboardView data={data} />
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

const UserDashboardView = ({ data }: { data: any }) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

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

  if (selectedMembership) {
    return (
      <div className="md:col-span-3">
        <MembershipDetailView gymGroup={selectedMembership} onBack={() => setSelectedMembership(null)} />
      </div>
    );
  }

  return (
    <>
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Star size={18} />
            </div>
            Active Memberships
          </h3>
          <button 
            onClick={() => setShowQRScanner(true)}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
          >
            <ScanLine size={16} /> Scan to Check In
          </button>
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

        {/* ── TRAINER BOOKINGS SECTION ── */}
        <div className="pt-6 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <User size={18} />
            </div>
            Your Trainers
          </h3>
          {groupedTrainerBookings.length ? (
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
          ) : (
            <div className="glass-card p-10 text-center border-dashed text-white/10 text-[10px] uppercase font-bold tracking-[0.2em]">
              No active trainer bookings
            </div>
          )}
        </div>
      </div>
      <div className="space-y-8 md:col-span-1">
        <div className="space-y-4">
          <h4 className="font-bold">Upcoming Sessions</h4>
          {data?.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
            <div className="space-y-3">
              {data.upcoming_sessions.slice(0, 3).map((session: any) => (
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
          ) : (
            <div className="glass-card p-6 border-dashed text-center text-white/20">
              <p className="text-xs font-bold uppercase tracking-widest">No upcoming sessions</p>
            </div>
          )}
          <Link to="/app/trainers" className="w-full btn-primary py-3 inline-block text-center mt-2">Find a Trainer</Link>
        </div>
      </div>

      {/* Member Insights (Gamification & Utility) */}
      <div className="md:col-span-3 pt-6 border-t border-white/10 mt-6">
        <MemberInsights />
      </div>

      <QRScannerModal 
        isOpen={showQRScanner} 
        onClose={() => setShowQRScanner(false)} 
        onSuccess={() => {
          // Could refresh stats here if needed
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

  return (
    <>
      <div className="md:col-span-2 space-y-6">
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

export default Dashboard;
