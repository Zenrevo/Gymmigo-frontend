import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageCircle, BellRing, Star, Zap, UserX, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';

export default function GymOwnerInsights({ gyms }: { gyms?: any[] }) {
  const { showNotification } = useNotification();
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gyms && gyms.length > 0 && !selectedGymId) {
      setSelectedGymId(gyms[0].gym.id);
    }
  }, [gyms, selectedGymId]);

  useEffect(() => {
    if (!selectedGymId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/gym-owner/gyms/${selectedGymId}/dashboard-analytics`);
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch gym analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedGymId]);

  const handleAction = (action: string) => {
    showNotification(`${action} executed successfully.`, 'success');
  };

  if (!gyms || gyms.length === 0) return null;

  // Real data
  const footfall = data?.footfall || [];
  const revenueBreakdown = data?.revenue_breakdown || [];
  const totalRevenue = revenueBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
  const atRiskMembers = data?.at_risk || [];
  const momGrowth = data?.mom_growth || 0;
  const topStaff = data?.top_staff || [];

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black italic tracking-tighter uppercase">Gym Analytics</h2>
        {gyms.length > 1 && (
          <select 
            value={selectedGymId || ''} 
            onChange={(e) => setSelectedGymId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-primary transition-colors"
          >
            {gyms.map((g: any) => (
              <option key={g.gym.id} value={g.gym.id}>{g.gym.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
      <>
        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Live Occupancy Chart */}
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ActivityIcon className="text-primary" />
                  Live Footfall & Peak Hours
                </h3>
                <p className="text-xs text-white/40">Today's estimated traffic flow</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Live</span>
              </div>
            </div>
            
            <div className="h-48 flex items-end gap-2 pb-4 border-b border-white/5 relative">
              {/* Chart bars */}
              <div className="flex-1 flex items-end justify-between gap-1 h-full">
                {footfall.map((slot: any, i: number) => (
                  <div key={i} className="w-full flex flex-col items-center gap-2 group relative">
                    <div 
                      className={clsx(
                        "w-full rounded-t-sm transition-all duration-1000",
                        slot.percentage > 70 ? "bg-primary" : slot.percentage > 30 ? "bg-primary/50" : "bg-white/10"
                      )} 
                      style={{ height: `${Math.max(slot.percentage, 5)}%` }} 
                    />
                    <span className="text-[9px] text-white/40 font-bold opacity-0 group-hover:opacity-100 absolute -top-6 bg-black/80 px-2 py-1 rounded z-10 whitespace-nowrap">
                      {slot.count} check-ins
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase mt-2">
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  Revenue Intelligence
                </h3>
                <p className="text-xs text-white/40">Month-to-date breakdown</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">₹{totalRevenue.toLocaleString()}</span>
                <div className={clsx("text-[10px] font-bold tracking-widest uppercase flex items-center justify-end gap-1", momGrowth >= 0 ? "text-emerald-500" : "text-red-500")}>
                  <TrendingUp size={10} className={momGrowth < 0 ? "rotate-180" : ""} /> {momGrowth > 0 ? '+' : ''}{momGrowth}% MoM
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {revenueBreakdown.length > 0 ? revenueBreakdown.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-white/80 capitalize">{item.type} Plans ({item.percentage}%)</span>
                    <span className={clsx(i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-emerald-500" : "text-blue-500")}>
                      ₹{item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} className={clsx("h-full rounded-full", i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-emerald-500" : "bg-blue-500")} transition={{ duration: 1, delay: i * 0.2 }} />
                  </div>
                </div>
              )) : (
                <div className="text-sm text-white/40 text-center py-4">No revenue data for this month yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Operations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* At-Risk CRM */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserX size={18} className="text-red-500" />
                  At-Risk Members (CRM)
                </h3>
                <p className="text-xs text-white/40">Take action to prevent churn</p>
              </div>
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {atRiskMembers.length} Action Needed
              </span>
            </div>
            
            <div className="space-y-3">
              {atRiskMembers.length > 0 ? atRiskMembers.map((member: any) => (
                <div key={member.membership_id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white/60">
                      {member.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{member.name}</h4>
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {member.issue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(`Promo Sent to ${member.name}`)}
                      className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-lg transition-colors border border-primary/20"
                      title="Send Promo Offer"
                    >
                      <Zap size={16} />
                    </button>
                    {member.phone && (
                      <a 
                        href={`https://wa.me/${member.phone}`}
                        target="_blank" rel="noreferrer"
                        onClick={() => handleAction(`WhatsApp opened for ${member.name}`)}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors border border-emerald-500/20"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-white/40 text-center py-4">All members are active and engaged!</div>
              )}
            </div>
          </div>

          {/* Quick Actions & Staff */}
          <div className="space-y-6 flex flex-col">
            {/* Command Center */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b border-white/5 pb-2">
                <Zap size={16} className="text-amber-500" />
                Command Center
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction('Broadcast UI opened')}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                  <BellRing size={20} className="text-white/40 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Broadcast</span>
                </button>
                <button 
                  onClick={() => handleAction('Flash Sale UI opened')}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                  <TrendingUp size={20} className="text-white/40 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Flash Sale</span>
                </button>
              </div>
            </div>

            {/* Staff Leaderboard */}
            <div className="glass-card p-6 flex-1">
              <h3 className="font-bold flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                <Star size={16} className="text-primary" />
                Top Staff
              </h3>
              <div className="space-y-4">
                {topStaff.map((staff: any, i: number) => (
                  <div key={staff.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-orange-600/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{staff.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold flex items-center gap-1 justify-end">
                        {staff.rating} <Star size={10} className="fill-primary text-primary" />
                      </p>
                      <p className="text-[10px] text-white/40">{staff.sessions} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </>
      )}
    </div>
  );
}

// Activity Icon helper
function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

