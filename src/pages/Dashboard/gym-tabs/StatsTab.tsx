import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Zap, Loader2, Activity } from 'lucide-react';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const StatsTab = () => {
  const { gymId } = useParams();
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeStatDay, setActiveStatDay] = useState('Monday');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const authHeader = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
        const res = await axios.get(`${API_URL}/gyms/${gymId}/workout-stats`, { headers: authHeader });
        setWorkoutStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (gymId) fetchStats();
  }, [gymId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black italic uppercase tracking-tight">Gym Analytics</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Historical occupancy and workout patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 glass-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Weekly Check-in Activity
            </h4>
          </div>

          {loadingStats ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Analyzing 90-day history...</p>
            </div>
          ) : !workoutStats ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-white/10">
              <Activity size={48} />
              <p className="text-xs font-black uppercase tracking-widest">No workout data available yet</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-3 pt-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const vals = Object.values(workoutStats.weekly_stats || {}) as number[];
                const maxCount = Math.max(1, ...(vals.length > 0 ? vals : [1]));
                const count = workoutStats.weekly_stats?.[day] || 0;
                const heightPct = Math.max(5, (count / maxCount) * 100);
                const isActive = activeStatDay === day;
                
                return (
                  <button 
                    key={day} 
                    onClick={() => setActiveStatDay(day)}
                    className="flex-1 flex flex-col items-center gap-4 group"
                  >
                    <div className="w-full h-full flex items-end bg-white/[0.02] rounded-t-2xl overflow-hidden hover:bg-white/[0.05] transition-all border border-white/[0.05] p-1">
                      <div 
                        className={clsx(
                          "w-full rounded-t-xl transition-all duration-700 relative group-hover:brightness-125",
                          isActive ? "bg-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]" : "bg-white/10"
                        )} 
                        style={{ height: `${heightPct}%` }}
                      >
                        {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className={clsx(
                        "text-[10px] font-black uppercase transition-colors tracking-tighter",
                        isActive ? "text-primary" : "text-white/20"
                      )}>
                        {day.substring(0,3)}
                      </span>
                      {count > 0 && (
                        <span className="text-[8px] font-bold text-white/10 group-hover:text-white/40 transition-colors">
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Time Analysis */}
        <div className="glass-card p-8 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Zap size={200} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/20">Insights</h4>
            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
                <Zap size={24} fill="currentColor" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Best time for {activeStatDay}</p>
                <h4 className="text-xl font-display font-black italic uppercase tracking-tighter text-white">
                  {workoutStats?.hourly_distribution?.[activeStatDay]?.best_time || "Checking..."}
                </h4>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5 pb-4">Hourly Distribution</p>
            <div className="space-y-3 pr-2 custom-scrollbar">
              {loadingStats ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 opacity-10 blur-sm">
                    <div className="w-20 h-2 bg-white rounded" />
                    <div className="flex-1 h-3 bg-white rounded" />
                  </div>
                ))
              ) : Object.entries(workoutStats?.hourly_distribution?.[activeStatDay] || {})
                .filter(([k]) => k !== 'best_time')
                .map(([timeRange, count]: [string, any]) => {
                  const isBest = timeRange === workoutStats?.hourly_distribution?.[activeStatDay]?.best_time;
                  const hourlyVals = Object.entries(workoutStats?.hourly_distribution?.[activeStatDay] || {}).filter(([k]) => k !== 'best_time').map(([_, v]) => v as number);
                  const hourlyMax = Math.max(1, ...(hourlyVals.length > 0 ? hourlyVals : [1]));
                  const widthPct = Math.max(2, (count / hourlyMax) * 100);
                  
                  return (
                    <div key={timeRange} className="flex items-center gap-4 group">
                      <span className="w-24 text-[10px] font-black uppercase tracking-tighter text-white/40 group-hover:text-white/60 transition-colors italic">{timeRange}</span>
                      <div className="flex-1 h-6 bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.05] p-0.5">
                        <div 
                          className={clsx(
                            "h-full rounded-lg transition-all duration-1000 relative",
                            isBest ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5"
                          )} 
                          style={{ width: `${widthPct}%` }}
                        >
                          {isBest && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        </div>
                      </div>
                      <span className="w-12 text-right text-[10px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/40 transition-colors">
                        {count > 0 ? count + ' ck' : ''}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
             <p className="text-[9px] font-bold text-white/30 leading-relaxed italic uppercase tracking-tight">
               * Data is aggregated from last 90 days of check-in records. Best time represents the 2-hour window with lowest average occupancy.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
