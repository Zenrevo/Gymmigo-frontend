import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, Activity, ChevronRight, Dumbbell } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function MemberInsights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_URL}/memberships/dashboard-analytics`);
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch member analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const { streak, current_level, next_level, progress_percent, remaining_to_next, heatmap } = data;

  return (
    <div className="space-y-6">
      
      {/* Gamification Row: Milestone & Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Milestone Progress */}
        <div className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
            <Trophy size={150} />
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                Rank Progress
              </h3>
              <p className="text-xs text-white/40">Keep crushing it!</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{streak} Day Streak</span>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-white/60">{current_level}</span>
              <span className="text-primary">{next_level}</span>
            </div>
            
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress_percent}%` }} 
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full relative"
              >
                {/* Shine effect */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute top-0 bottom-0 w-10 bg-white/30 skew-x-12"
                />
              </motion.div>
            </div>
            
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-center">
              Only {remaining_to_next} more sessions to unlock {next_level}
            </p>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                Activity Heatmap
              </h3>
              <p className="text-xs text-white/40">Your last 28 days</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {heatmap?.map((day: any, i: number) => (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                key={i}
                className={clsx(
                  "w-6 h-6 sm:w-8 sm:h-8 rounded-md transition-colors border cursor-help relative group",
                  day.intensity === 0 ? "bg-white/5 border-white/5 hover:border-white/20" :
                  day.intensity === 1 ? "bg-primary/30 border-primary/20 hover:border-primary/50" :
                  day.intensity === 2 ? "bg-primary/60 border-primary/40 hover:border-primary/80" :
                  "bg-primary border-primary shadow-[0_0_10px_rgba(241,130,44,0.3)]"
                )}
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-[9px] font-bold tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 z-20">
                  {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {day.intensity > 0 ? ' • Active' : ' • Rest'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}

