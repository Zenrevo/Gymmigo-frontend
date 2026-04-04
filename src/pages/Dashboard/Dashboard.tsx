import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, Dumbbell, Building2, 
  TrendingUp, Clock, Star, Plus, ArrowRight, ScanLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRScannerModal from '../../components/QRScannerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
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
        let endpoint = '';
        if (user.active_role === 'user') endpoint = '/memberships/my';
        else if (user.active_role === 'trainer') endpoint = '/trainer/full';
        else if (user.active_role === 'gym_owner') endpoint = '/gym-owner/gyms';

        if (endpoint) {
          const res = await axios.get(`${API_URL}${endpoint}`);
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.active_role]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-primary animate-pulse font-display text-2xl">
      LOADING YOUR HUB...
    </div>
  );

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
          <h1 className="text-5xl font-display font-black tracking-tighter">
            HELLO, {user?.phone?.slice(-4) || 'MEMBER'}
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
          <OwnerDashboardView data={data} />
        )}
      </div>
    </div>
  );
};

import MembershipDetailView from './MembershipDetailView';

const UserDashboardView = ({ data }: { data: any }) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  if (selectedMembership) {
    return (
      <div className="md:col-span-3">
        <MembershipDetailView membership={selectedMembership} onBack={() => setSelectedMembership(null)} />
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
        {data?.memberships?.length ? data.memberships.map((m: any, index: number) => (
          <motion.div 
            key={m.id || index} 
            whileHover={{ scale: 1.01 }} 
            onClick={() => setSelectedMembership(m)}
            className="glass-card p-6 flex items-center justify-between group overflow-hidden cursor-pointer hover:border-primary/50 transition-all border border-transparent"
          >
             <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                 <Building2 size={32} />
               </div>
               <div>
                 <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{m.gym_name}</h4>
                 <p className="text-white/40 text-sm">{m.plan_name} • Expires {new Date(m.end_date).toLocaleDateString()}</p>
               </div>
             </div>
             <div className="text-right flex items-center gap-4">
               <div className="flex flex-col items-end gap-2">
                 <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/20'}`}>
                   {m.status}
                 </span>
                 <p className="text-white/20 text-[10px] font-mono">{m.id?.slice(0, 8)}</p>
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
  return (
    <>
      <div className="md:col-span-2 space-y-6">
        <h3 className="text-xl font-bold">Active Clients</h3>
        <div className="glass-card p-12 text-center text-white/20">
          Client roster will appear here. No active clients yet.
        </div>
      </div>
      <div className="space-y-8">
        <h3 className="text-xl font-bold">Earnings</h3>
        <div className="glass-card p-10 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <TrendingUp className="text-emerald-500 mb-4" />
          <p className="text-white/40 text-xs font-bold uppercase">Total Earned</p>
          <p className="text-4xl font-black">₹0.00</p>
        </div>
      </div>
    </>
  );
};

const OwnerDashboardView = ({ data }: { data: any }) => {
  return (
    <>
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">Your Gyms</h3>
          <Link 
            to="/gym-owner/add-gym" 
            className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-2"
          >
            <Plus size={14} /> List New Gym
          </Link>
        </div>
        {data?.length ? data.map((item: any, index: number) => (
          <Link 
            key={item.gym?.id || index} 
            to={`/gym-owner/gyms/${item.gym?.id}`}
            className="glass-card p-6 flex items-center justify-between group hover:border-primary/50 transition-all active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="font-bold group-hover:text-primary transition-colors">{item.gym?.name}</h4>
                <p className="text-xs text-white/40">{item.gym?.description?.slice(0, 50) || 'No description available'}...</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">ACTIVE</span>
              <div className="text-white/20 group-hover:text-primary transition-colors">
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        )) : (
          <div className="glass-card p-12 text-center text-white/20">No gyms listed. Start growing your fitness empire!</div>
        )}
      </div>
      <div className="space-y-8">
        <h3 className="text-xl font-bold">Overview</h3>
        <div className="glass-card p-8 border-primary/20">
          <TrendingUp className="text-primary mb-4" />
          <h4 className="font-bold">Occupancy</h4>
          <p className="text-4xl font-black mt-2">0%</p>
          <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
             <div className="bg-primary w-[0%] h-full transition-all" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
