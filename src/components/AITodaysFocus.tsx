import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Dumbbell, Utensils, ChevronRight, CheckCircle2, 
  Clock, BatteryMedium, Target, X, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

interface AITodaysFocusProps {
  refreshKey?: number;
}

export default function AITodaysFocus({ refreshKey }: AITodaysFocusProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFitnessProfile, setHasFitnessProfile] = useState<boolean | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinTime, setCheckinTime] = useState('45');
  const [checkinMotivation, setCheckinMotivation] = useState(3);
  const [generating, setGenerating] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get(`/ai/recommendations`, {
        params: { start_date: todayStr, end_date: todayStr }
      });
      if (res.data?.data) {
        setPlans(res.data.data.filter((p: any) => p.date_for === todayStr));
      }
    } catch (err) {
      console.error('Failed to fetch todays plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFitnessProfile = useCallback(async () => {
    try {
      const res = await api.get(`/profile/fitness`);
      if (res.data?.success && res.data?.data && res.data.data.primary_goal) {
        setHasFitnessProfile(true);
      } else {
        setHasFitnessProfile(false);
      }
    } catch (e) {
      setHasFitnessProfile(false);
    }
  }, []);

  useEffect(() => {
    checkFitnessProfile();
    fetchPlans();
  }, [refreshKey, checkFitnessProfile, fetchPlans]);

  const confirmGenerateRecommendation = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/ai/generate-workout`, {
        time_available: parseInt(checkinTime) || 45,
        motivation_level: checkinMotivation
      }, { timeout: 60000 });
      if (res.data?.data) {
        await fetchPlans();
        setShowCheckinModal(false);
      }
    } catch (e) {
      console.error('Failed to generate dynamic workout:', e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tighter">DAILY DROP</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your saved AI plans for today</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Migo AI</span>
        </div>
      </div>

      {hasFitnessProfile === false ? (
        <div className="glass-card p-10 flex flex-col items-center text-center gap-6 border-dashed border-primary/30">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Target size={32} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-white">Fitness Profile Required</h4>
            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
              Set up your profile so Migo AI can build personal drops for you.
            </p>
          </div>
          <Link
            to="/app/profile"
            className="btn-primary px-8 py-3 flex items-center gap-3 group"
          >
            <Dumbbell size={18} />
            <span>Setup Fitness Profile</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.length > 0 ? (
            <>
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -4 }}
                  className="glass-card overflow-hidden group border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className={clsx(
                    "h-1 w-full",
                    plan.type === 'workout' ? "bg-primary" : "bg-emerald-500"
                  )} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        plan.type === 'workout' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {plan.type === 'workout' ? (
                          <Dumbbell size={24} />
                        ) : (
                          <Utensils size={24} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={clsx(
                          "text-[10px] font-black uppercase tracking-widest block mb-1",
                          plan.type === 'workout' ? "text-primary" : "text-emerald-500"
                        )}>
                          {plan.type === 'workout' ? 'WORKOUT' : 'FUEL CHECK'}
                        </span>
                        <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">
                          {plan.structured_data?.focus || plan.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-white/40 text-sm line-clamp-2 leading-relaxed font-medium">
                      {plan.structured_data?.description || 'View your full tailored plan.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {(plan.structured_data?.duration || plan.duration) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                          <Clock size={12} className="text-white/40" />
                          <span className="text-[10px] font-black text-white/60 uppercase">{plan.structured_data?.duration || plan.duration} MIN</span>
                        </div>
                      )}
                      {(plan.structured_data?.intensity || plan.intensity) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                          <BatteryMedium size={12} className="text-primary" />
                          <span className="text-[10px] font-black text-primary uppercase">{plan.structured_data?.intensity || plan.intensity}</span>
                        </div>
                      )}
                      {plan.is_completed && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase">DONE</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <div 
              onClick={() => setShowCheckinModal(true)}
              className="md:col-span-3 glass-card p-12 flex flex-col items-center text-center gap-6 border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                <Zap size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-white">No Drop Yet</h4>
                <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                  Help Migo AI understand your energy levels to build today's tailored drop.
                </p>
              </div>
              <div className="btn-primary px-8 py-3 flex items-center gap-3">
                <Zap size={18} />
                <span>BUILD DROP</span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Checkin Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckinModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 space-y-8 shadow-2xl"
            >
              <button 
                onClick={() => setShowCheckinModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">QUICK CHECK-IN</h3>
                  <p className="text-sm text-white/40 font-medium">Help Migo AI build today's drop</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Time Available (mins)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="number"
                      value={checkinTime}
                      onChange={(e) => setCheckinTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-primary/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Motivation Level</label>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setCheckinMotivation(level)}
                        className={clsx(
                          "flex-1 py-4 rounded-2xl font-black transition-all border",
                          checkinMotivation === level 
                            ? "bg-primary border-primary text-black" 
                            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={confirmGenerateRecommendation}
                  disabled={generating}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-sm"
                >
                  {generating ? (
                    <Activity className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>BUILD DROP</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
