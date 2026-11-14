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
        <h2 className="text-xl font-bold tracking-tight">Gym Analytics</h2>
        {gyms.length > 1 && (
          <select 
            value={selectedGymId || ''} 
            onChange={(e) => setSelectedGymId(e.target.value)}
            className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-bold text-ink outline-none focus:border-accent transition-colors"
          >
            {gyms.map((g: any) => (
              <option key={g.gym.id} value={g.gym.id}>{g.gym.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
      <>
        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Live Occupancy Chart */}
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ActivityIcon className="text-accent-text" />
                  Live Footfall & Peak Hours
                </h3>
                <p className="text-xs text-ink-muted">Today's estimated traffic flow</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-success-soft border border-success/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-success uppercase">Live</span>
              </div>
            </div>
            
            <div className="h-48 flex items-end gap-2 pb-4 border-b border-border relative">
              {/* Chart bars */}
              <div className="flex-1 flex items-end justify-between gap-1 h-full">
                {footfall.map((slot: any, i: number) => (
                  <div key={i} className="w-full flex flex-col items-center gap-2 group relative">
                    <div 
                      className={clsx(
                        "w-full rounded-t-sm transition-all duration-1000",
                        slot.percentage > 70 ? "bg-accent" : slot.percentage > 30 ? "bg-accent/50" : "bg-surface-sunken"
                      )} 
                      style={{ height: `${Math.max(slot.percentage, 5)}%` }} 
                    />
                    <span className="text-[9px] text-ink-muted font-bold opacity-0 group-hover:opacity-100 absolute -top-6 bg-overlay px-2 py-1 rounded z-10 whitespace-nowrap">
                      {slot.count} check-ins
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-ink-muted font-bold uppercase mt-2">
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-success" />
                  Revenue Intelligence
                </h3>
                <p className="text-xs text-ink-muted">Month-to-date breakdown</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</span>
                <div className={clsx("text-[10px] font-bold tracking-widest uppercase flex items-center justify-end gap-1", momGrowth >= 0 ? "text-success" : "text-danger")}>
                  <TrendingUp size={10} className={momGrowth < 0 ? "rotate-180" : ""} /> {momGrowth > 0 ? '+' : ''}{momGrowth}% MoM
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {revenueBreakdown.length > 0 ? revenueBreakdown.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-ink-muted capitalize">{item.type} Plans ({item.percentage}%)</span>
                    <span className={clsx(i % 3 === 0 ? "text-accent-text" : i % 3 === 1 ? "text-success" : "text-info")}>
                      ₹{item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} className={clsx("h-full rounded-full", i % 3 === 0 ? "bg-accent" : i % 3 === 1 ? "bg-success" : "bg-info")} transition={{ duration: 1, delay: i * 0.2 }} />
                  </div>
                </div>
              )) : (
                <div className="text-sm text-ink-muted text-center py-4">No revenue data for this month yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Operations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* At-Risk CRM */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-gm-xl shadow-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserX size={18} className="text-danger" />
                  At-Risk Members (CRM)
                </h3>
                <p className="text-xs text-ink-muted">Take action to prevent churn</p>
              </div>
              <span className="bg-danger-soft text-danger border border-danger/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {atRiskMembers.length} Action Needed
              </span>
            </div>
            
            <div className="space-y-3">
              {atRiskMembers.length > 0 ? atRiskMembers.map((member: any) => (
                <div key={member.membership_id} className="flex items-center justify-between p-4 bg-surface-raised border border-border rounded-xl hover:border-border transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center font-bold text-sm text-ink-muted">
                      {member.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{member.name}</h4>
                      <p className="text-[10px] text-danger font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {member.issue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(`Promo Sent to ${member.name}`)}
                      className="p-2 bg-accent-soft text-accent-text hover:bg-accent hover:text-on-accent rounded-lg transition-colors border border-accent-border"
                      title="Send Promo Offer"
                    >
                      <Zap size={16} />
                    </button>
                    {member.phone && (
                      <a 
                        href={`https://wa.me/${member.phone}`}
                        target="_blank" rel="noreferrer"
                        onClick={() => handleAction(`WhatsApp opened for ${member.name}`)}
                        className="p-2 bg-success-soft text-success hover:bg-success hover:text-on-accent rounded-lg transition-colors border border-success/30"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-ink-muted text-center py-4">All members are active and engaged!</div>
              )}
            </div>
          </div>

          {/* Quick Actions & Staff */}
          <div className="space-y-6 flex flex-col">
            {/* Command Center */}
            <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2">
                <Zap size={16} className="text-warning" />
                Command Center
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction('Broadcast UI opened')}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-all group"
                >
                  <BellRing size={20} className="text-ink-muted group-hover:text-accent-text transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Broadcast</span>
                </button>
                <button 
                  onClick={() => handleAction('Flash Sale UI opened')}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-all group"
                >
                  <TrendingUp size={20} className="text-ink-muted group-hover:text-success transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Flash Sale</span>
                </button>
              </div>
            </div>

            {/* Staff Leaderboard */}
            <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex-1">
              <h3 className="font-bold flex items-center gap-2 border-b border-border pb-4 mb-4">
                <Star size={16} className="text-accent-text" />
                Top Staff
              </h3>
              <div className="space-y-4">
                {topStaff.map((staff: any, i: number) => (
                  <div key={staff.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full from-accent/20 to-warning/20 border border-accent-border flex items-center justify-center text-xs font-bold text-accent-text">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{staff.name}</p>
                        <p className="text-[10px] text-ink-muted uppercase tracking-widest">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold flex items-center gap-1 justify-end">
                        {staff.rating} <Star size={10} className="fill-accent text-accent-text" />
                      </p>
                      <p className="text-[10px] text-ink-muted">{staff.sessions} sessions</p>
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

