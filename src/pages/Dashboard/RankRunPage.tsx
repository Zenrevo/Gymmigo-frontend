import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { 
  Trophy, Award, Crown, Flame, Users, Activity 
} from 'lucide-react';
import { clsx } from 'clsx';
import PageLoader from '../../components/PageLoader';

export default function RankRunPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompetition = useCallback(async () => {
    try {
      const res = await api.get(`/memberships/competition`);
      setData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch competition stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  if (loading) return <PageLoader message="Scanning Leaderboard..." />;
  if (!data) return null;

  const {
    current_score = 0,
    current_tier = 'Bronze',
    rank = 0,
    total_users = 0,
    streak = 0,
    leaderboard = [],
    point_rules = [],
    penalty_rules = []
  } = data;

  const tierColors: Record<string, string> = {
    'Bronze': 'text-[#CD7F32]',
    'Silver': 'text-[#C0C0C0]',
    'Gold': 'text-[#FFD700]',
    'Platinum': 'text-[#E5E4E2]',
    'Diamond': 'text-[#B9F2FF]'
  };

  const currentTierColor = tierColors[current_tier] || 'text-primary';

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 px-10 rounded-[3rem] bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent border border-white/5 overflow-hidden shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-primary/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Season 02: Ignite</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white italic">
              RANK RUN <span className="not-italic text-primary">⚡️</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs md:text-sm max-w-xl leading-relaxed">
              Every rep counts. Compete globally, earn points, and climb the ranks of the Gymmigo community.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
             <div className="glass-card px-8 py-6 text-center space-y-1 bg-white/[0.03] border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Global Rank</p>
                <p className="text-4xl font-black text-white italic tracking-tighter">#{rank}<span className="text-xs not-italic text-white/20 ml-1">/{total_users}</span></p>
             </div>
             <div className="glass-card px-8 py-6 text-center space-y-1 bg-white/[0.03] border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Score</p>
                <p className="text-4xl font-black text-primary italic tracking-tighter">{current_score}</p>
             </div>
             <div className="glass-card px-8 py-6 text-center space-y-1 bg-white/[0.03] border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Current Tier</p>
                <p className={clsx("text-4xl font-black italic tracking-tighter", currentTierColor)}>{current_tier}</p>
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Leaderboard */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
                <Trophy size={24} className="text-primary" />
                Global Leaderboard
              </h3>
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                 <Activity size={12} className="animate-pulse text-primary" />
                 LIVE
              </div>
           </div>

           <div className="space-y-4">
              {leaderboard.map((user: any, i: number) => {
                const isMe = user.is_me;
                const userRank = user.rank || (i + 1);
                
                return (
                  <motion.div
                    key={user.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(
                      "glass-card p-5 flex items-center justify-between group transition-all",
                      isMe ? "bg-primary/10 border-primary/30" : "bg-white/[0.02] border-white/5 hover:border-white/15"
                    )}
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-10 text-center">
                          {userRank === 1 ? <Crown size={24} className="text-yellow-400 mx-auto" /> :
                           userRank === 2 ? <Award size={22} className="text-slate-300 mx-auto" /> :
                           userRank === 3 ? <Award size={20} className="text-[#CD7F32] mx-auto" /> :
                           <span className="text-lg font-black text-white/20">#{userRank}</span>}
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all overflow-hidden shrink-0">
                            {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={20} />}
                          </div>
                          <div>
                             <h4 className={clsx("font-black text-lg tracking-tight", isMe ? "text-primary" : "text-white")}>
                               {user.full_name} {isMe && <span className="text-[10px] font-black bg-primary text-black px-1.5 rounded ml-2">YOU</span>}
                             </h4>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{user.tier || 'ROOKIE'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="text-right">
                       <p className="text-2xl font-black text-white italic tracking-tighter">{user.score || 0}</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Points</p>
                    </div>
                  </motion.div>
                );
              })}
           </div>
        </div>

        {/* Rules & Stats Sidebar */}
        <div className="space-y-8">
           <section className="glass-card p-8 space-y-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-white italic tracking-tighter flex items-center gap-2 uppercase">
                   <Flame size={18} className="text-amber-500" />
                   Streak Power
                </h4>
              </div>
              <div className="space-y-4">
                <div className="text-5xl font-black text-white italic tracking-tighter">{streak} Days</div>
                <p className="text-xs text-white/40 font-medium leading-relaxed">
                  Maintain your daily activity streak to multiply your points. Don't let the fire go out!
                </p>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500 rounded-full w-3/4 animate-pulse" />
                </div>
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-6">How to Score</h4>
              <div className="space-y-3">
                 {point_rules.map((rule: any, i: number) => (
                    <div key={i} className="glass-card p-4 bg-white/[0.02] border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-white uppercase tracking-tight">{rule.label}</p>
                          <p className="text-[10px] font-medium text-white/30">{rule.description}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-emerald-400">+{rule.max_points}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/40 mb-6">Penalties</h4>
              <div className="space-y-3">
                 {penalty_rules.map((rule: any, i: number) => (
                    <div key={i} className="glass-card p-4 bg-white/[0.02] border-white/5 flex items-center justify-between group hover:border-rose-500/20 transition-all">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-white/60 uppercase tracking-tight">{rule.label}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-rose-500">{rule.points}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
