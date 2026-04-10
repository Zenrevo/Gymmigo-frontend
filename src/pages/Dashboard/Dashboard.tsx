import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, Dumbbell, Building2, 
  MessageCircle, User, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import QRScannerModal from '../../components/QRScannerModal';
import PageLoader from '../../components/PageLoader';

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
        else if (user.active_role === 'gym_owner') endpoint = '/gym-owner/gyms';

        if (endpoint) {
          const res = await axios.get(`${API_URL}${endpoint}`, { timeout: 10000 });
          setData(res.data.data);
          
          if (user.active_role === 'gym_owner') {
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
      {/* Welcome Header */}
      <div className="p-10 relative overflow-hidden glass-card">
        <div className="absolute top-0 right-0 p-8 opacity-10 animate-float">
          {user?.active_role === 'user' ? <Dumbbell size={160} /> : 
           user?.active_role === 'trainer' ? <Users size={160} /> : <Building2 size={160} />}
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest">
            {user?.active_role?.replace('_', ' ')} MODE
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter uppercase italic">
            HELLO, {user?.full_name?.split(' ')[0] || user?.phone?.slice(-4) || 'MEMBER'}
          </h1>
          <p className="text-white/40 max-w-md">
            Welcome to your Gymmigo dashboard. Here is what is happening today.
          </p>
        </div>
      </div>

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
            className="glass-card p-6 flex items-center justify-between group overflow-hidden cursor-pointer hover:border-primary/50 transition-all border border-transparent"
          >
             <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all overflow-hidden relative">
                 {group.gym_logo_url ? (
                   <img src={group.gym_logo_url} alt="logo" className="w-full h-full object-cover" />
                 ) : (
                   <Building2 size={32} />
                 )}
               </div>
               <div>
                 <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{group.gym_name}</h4>
                 <div className="flex items-center gap-3 mt-1">
                   <p className="text-white/40 text-sm">{group.memberships.length} Enrolled Plan{group.memberships.length !== 1 && 's'}</p>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                      <Activity size={12} className={clsx(
                        "animate-pulse",
                        (group.current_occupancy / (group.max_capacity || 100)) > 0.8 ? "text-red-500" : 
                        (group.current_occupancy / (group.max_capacity || 100)) > 0.5 ? "text-orange-500" : "text-emerald-500"
                      )} />
                      <span className="text-[11px] font-black uppercase tracking-tighter text-white">
                        {group.current_occupancy} / {group.max_capacity || 100} <span className="text-white/40 font-bold">LIVE</span>
                      </span>
                    </div>

                 </div>
               </div>
             </div>
             <div className="text-right flex items-center gap-4">
               <div className="flex flex-col items-end gap-2">
                 <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${group.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>
                   {group.status}
                 </span>
               </div>
               <div className="text-white/20 group-hover:text-primary transition-colors ml-2">
                 <ArrowRight size={20} />
               </div>
             </div>
          </motion.div>
        )) : (
          <div className="glass-card p-12 text-center text-white/20">No memberships yet. Visit a gym to get started!</div>
        )}
      </div>

      <div className="space-y-8">
        <h3 className="text-xl font-bold">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-6 space-y-2 hover:bg-primary/5 transition-colors group">
            <p className="text-white/40 text-xs font-bold uppercase group-hover:text-primary/60 transition-colors">Visits</p>
            <p className="text-3xl font-black group-hover:text-primary transition-colors">{data?.total ?? 0}</p>
          </div>
          <div className="glass-card p-6 space-y-2 hover:bg-primary/5 transition-colors group border-primary/20">
            <p className="text-white/40 text-xs font-bold uppercase group-hover:text-primary/60 transition-colors">Rank</p>
            <p className="text-3xl font-black text-primary italic">#14</p>
          </div>
        </div>
        <div className="glass-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 space-y-4">
          <h4 className="font-bold">Next Session</h4>
          <div className="flex items-center gap-3 text-white/60">
            <Clock size={16} />
            <span className="text-sm">Tomorrow • 10:30 AM</span>
          </div>
          <button className="w-full btn-primary py-3">Book New Trainer</button>
        </div>
      </div>

      <QRScannerModal 
        isOpen={showQRScanner} 
        onClose={() => setShowQRScanner(false)} 
        onSuccess={() => {
          // Could refresh stats here if needed
        }}
      />
    </>
  );
};


const TrainerDashboardView = ({ data: _data }: { data: any }) => {
  const navigate = useNavigate();
  return (
    <div className="md:col-span-3 py-12 flex flex-col items-center justify-center text-center space-y-8 glass-card border-dashed">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
        <Users size={48} />
      </div>
      <div className="max-w-md space-y-4">
        <h3 className="text-3xl font-display font-black tracking-tighter italic uppercase">Trainer Suite Coming Soon</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          We are currently building a powerful suite of tools for trainers to manage clients, track progress, and grow their fitness business. Stay tuned for the ultimate coaching experience.
        </p>
      </div>
      <button 
        onClick={() => navigate('/app/discovery')}
        className="btn-primary py-3 px-8 flex items-center gap-2"
      >
        Explore Gyms & Trainers <ArrowRight size={18} />
      </button>
    </div>
  );
};

const OwnerDashboardView = ({ data, reviews }: { data: any, reviews: any[] }) => {
  const totalGyms = data?.length || 0;
  const totalMembers = data?.reduce((acc: number, item: any) => acc + (item.metrics?.active_members || 0), 0) || 0;
  const totalRevenue = data?.reduce((acc: number, item: any) => acc + (item.metrics?.monthly_revenue || 0), 0) || 0;

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
            <div className="absolute top-6 right-6">
              <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">ACTIVE</span>
            </div>
            
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
                <p className="text-2xl font-black text-white">{item.metrics?.active_members || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-end relative overflow-hidden">
                <TrendingUp size={60} className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">MTD Revenue</p>
                </div>
                <p className="text-2xl font-black text-white">₹{(item.metrics?.monthly_revenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </Link>
        )) : (
          <div className="glass-card p-12 text-center text-white/20">No gyms listed. Start growing your fitness empire!</div>
        )}

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
             <p className="text-3xl font-black">{totalMembers}</p>
          </div>
          <div className="glass-card p-6 border-b-2 border-b-green-500/50 relative overflow-hidden group hover:border-white/10 transition-colors">
             <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-green-500/5 group-hover:text-green-500/10 transition-all transform group-hover:scale-110" />
             <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 flex items-center gap-2"><TrendingUp size={14} className="text-green-500"/> Combined MTD Revenue</h4>
             <p className="text-3xl font-black">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
