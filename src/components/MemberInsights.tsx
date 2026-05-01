import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Activity, Dumbbell, ArrowRight, CheckCircle2, Zap, Globe2, Target } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { WorkoutExerciseMediaGrid, type WorkoutExerciseMedia } from './WorkoutExerciseMediaGrid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

type ScoreComponents = {
  check_in?: number;
  workout_completion?: number;
  consistency?: number;
  nutrition?: number;
  goal_alignment?: number;
};

type HeatmapDay = {
  date: string;
  intensity: number;
};

type MemberAnalytics = {
  streak: number;
  current_level?: string;
  next_level?: string;
  progress_percent?: number;
  remaining_to_next?: number;
  heatmap?: HeatmapDay[];
  today_score?: number;
  global_rank?: number;
  global_rank_total?: number;
  week_active_days?: number;
  weekly_target_days?: number;
  daily_score?: {
    score?: number;
    coach_nudge?: string;
    components?: ScoreComponents;
  };
};

type TodaysPlan = {
  title: string;
  content?: string;
  is_completed?: boolean;
  structured_data?: {
    duration?: string | number;
    intensity?: string;
    exercises?: WorkoutExerciseMedia[];
  };
};

export default function MemberInsights() {
  const [data, setData] = useState<MemberAnalytics | null>(null);
  const [todaysPlan, setTodaysPlan] = useState<TodaysPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_URL}/memberships/dashboard-analytics`);
        if (res.data?.data) {
          setData(res.data.data);
        }
        const planRes = await axios.get(`${API_URL}/ai/todays-focus/detail?generate=true`);
        if (planRes.data?.data) {
          setTodaysPlan(planRes.data.data);
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

  const {
    streak,
    current_level = 'Bronze Tier',
    next_level = 'Silver Tier',
    progress_percent = 0,
    remaining_to_next = 0,
    heatmap = [],
  } = data;
  const dailyScore = data.daily_score?.score ?? data.today_score ?? 0;
  const scoreComponents = data.daily_score?.components ?? {};
  const coachNudge = data.daily_score?.coach_nudge ?? 'Log an activity today to move your score.';
  const globalRank = data.global_rank;
  const globalRankTotal = data.global_rank_total;
  const weekActiveDays = data.week_active_days ?? 0;
  const weeklyTargetDays = data.weekly_target_days ?? 4;
  const scoreTone =
    dailyScore >= 80
      ? { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' }
      : dailyScore >= 50
        ? { text: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/10' }
        : { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' };
  const planData = todaysPlan?.structured_data || {};
  const exercises = Array.isArray(planData.exercises) ? planData.exercises.slice(0, 4) : [];

  return (
    <div className="space-y-6">
      <div className={clsx("glass-card p-6 md:p-8 border relative overflow-hidden", scoreTone.border)}>
        <div className="absolute -right-12 -bottom-14 opacity-5 pointer-events-none">
          <Zap size={220} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-center">
          <div className="flex items-center justify-center">
            <div className={clsx("w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center bg-white/[0.03]", scoreTone.border)}>
              <span className={clsx("text-6xl font-black tracking-tighter leading-none", scoreTone.text)}>{dailyScore}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">out of 100</span>
            </div>
          </div>

          <div className="space-y-5 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={clsx("w-11 h-11 rounded-xl border flex items-center justify-center", scoreTone.bg, scoreTone.border, scoreTone.text)}>
                    <Zap size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Migo AI</p>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">Daily Fitness Score</h3>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/55 max-w-3xl leading-relaxed">{coachNudge}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sky-300 mb-1">
                    <Globe2 size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Global Rank</span>
                  </div>
                  <p className="text-2xl font-black">
                    {globalRank ? `#${globalRank}` : '--'}
                    {globalRankTotal ? <span className="text-xs text-white/30 font-bold"> / {globalRankTotal}</span> : null}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-violet-300 mb-1">
                    <Target size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Week Goal</span>
                  </div>
                  <p className="text-2xl font-black">{weekActiveDays}<span className="text-xs text-white/30 font-bold"> / {weeklyTargetDays}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                ['Check-in', scoreComponents.check_in ?? 0, 40],
                ['Workout', scoreComponents.workout_completion ?? 0, 25],
                ['Consistency', scoreComponents.consistency ?? 0, 20],
                ['Nutrition', scoreComponents.nutrition ?? 0, 10],
                ['Goal', scoreComponents.goal_alignment ?? 0, 10],
              ].map(([label, value, max]) => (
                <div key={String(label)} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/35 truncate">{label}</span>
                    <span className="text-[10px] font-black text-white/60">{String(value)}/{String(max)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full", dailyScore >= 80 ? 'bg-emerald-400' : dailyScore >= 50 ? 'bg-primary' : 'bg-rose-400')}
                      style={{ width: `${Math.min(100, (Number(value) / Number(max)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {todaysPlan && (
        <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-orange-500/10 via-white/[0.02] to-transparent border-orange-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 text-orange-500/5 pointer-events-none">
            <Dumbbell size={170} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
                  <Dumbbell size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/80">Today's Workout Plan</p>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">{todaysPlan.title}</h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {planData.duration && (
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50">
                    {planData.duration} min
                  </span>
                )}
                {planData.intensity && (
                  <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-300">
                    {planData.intensity}
                  </span>
                )}
                {todaysPlan.is_completed && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Logged
                  </span>
                )}
              </div>

              {exercises.length > 0 ? (
                <WorkoutExerciseMediaGrid exercises={exercises} compact />
              ) : (
                <p className="text-sm text-white/50 max-w-2xl line-clamp-3">
                  {todaysPlan.content?.replace(/\[METER:[^\]]+\]/g, '').replace(/[#*`]/g, '')}
                </p>
              )}
            </div>

            <Link
              to="/app/calendar"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Open Calendar <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
      
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
            {heatmap?.map((day, i) => (
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
