import { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Utensils, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ArrowRight,
  Info,
  Zap,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { WorkoutExerciseMediaGrid, type WorkoutExerciseMedia } from '../../components/WorkoutExerciseMediaGrid';
import api, { getApiErrorMessage } from '../../utils/api';

type CalendarPlan = {
  id: string;
  type: string;
  title: string;
  content: string;
  structured_data?: {
    calendar_tag?: string;
    exercises?: WorkoutExerciseMedia[];
  } | null;
  date_for: string;
  generation_count: number;
  is_completed: boolean;
};

const normalizePlanDate = (dateFor?: string) => {
  if (!dateFor) return '';
  return dateFor.slice(0, 10);
};

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plans, setPlans] = useState<CalendarPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CalendarPlan | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');
  const [syncingWeek, setSyncingWeek] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({
      start: startDate,
      end: endDate
    });
  }, [currentMonth]);

  useEffect(() => {
    if (calendarDays.length > 0) {
      fetchPlansForRange(calendarDays[0], calendarDays[calendarDays.length - 1]);
    }
  }, [calendarDays]);

  const fetchPlansForRange = async (start: Date, end: Date) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/ai/recommendations', {
        params: {
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd')
        }
      });
      if (Array.isArray(res.data?.data)) {
        setPlans(res.data.data as CalendarPlan[]);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setErrorMessage(getApiErrorMessage(err));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshVisiblePlans = () => {
    if (calendarDays.length > 0) {
      fetchPlansForRange(calendarDays[0], calendarDays[calendarDays.length - 1]);
    }
  };

  const plansByDate = useMemo(() => {
    return plans.reduce<Record<string, CalendarPlan[]>>((acc, plan) => {
      const key = normalizePlanDate(plan.date_for);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    }, {});
  }, [plans]);

  const selectedDatePlans = plansByDate[format(selectedDate, 'yyyy-MM-dd')] || [];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleRegenerate = async () => {
    if (!selectedPlan) return;
    setRegenerating(selectedPlan.id);
    setFeedbackModalVisible(false);
    setErrorMessage('');
    try {
      const res = await api.post(`/ai/recommendations/${selectedPlan.id}/regenerate`, {
        feedback: feedback.trim() || undefined
      });
      if (res.data?.data) {
        setFeedback('');
        refreshVisiblePlans();
        setSelectedPlan(res.data.data);
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setRegenerating(null);
    }
  };

  const handleComplete = async () => {
    if (!selectedPlan) return;
    setCompleting(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/ai/recommendations/${selectedPlan.id}/complete`, {
        feedback: undefined
      });
      if (res.data?.data) {
        refreshVisiblePlans();
        setSelectedPlan(res.data.data);
      }
    } catch (err) {
      console.error('Failed to complete:', err);
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  };

  const syncWeeklySchedule = async () => {
    setSyncingWeek(true);
    setWeeklyModalVisible(false);
    setErrorMessage('');
    try {
      const res = await api.post('/ai/weekly-schedule', {
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        days: 7,
        force: false,
        user_instructions: userInstructions.trim() || undefined,
      }, {
        timeout: 180000,
      });
      if (res.data?.data) {
        setUserInstructions('');
        refreshVisiblePlans();
      }
    } catch (err) {
      console.error('Failed to sync weekly schedule:', err);
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setSyncingWeek(false);
    }
  };

  const resetUpcomingSchedule = async () => {
    const confirmed = window.confirm('Reset all upcoming uncompleted workouts? This cannot be undone.');
    if (!confirmed) return;

    setResetting(true);
    setErrorMessage('');
    try {
      await api.delete('/ai/recommendations/upcoming');
      setSelectedPlan(null);
      refreshVisiblePlans();
    } catch (err) {
      console.error('Failed to reset schedule:', err);
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const selectedPlanExercises = Array.isArray(selectedPlan?.structured_data?.exercises)
    ? selectedPlan.structured_data.exercises
    : [];

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-8 space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.05] overflow-hidden shadow-2xl p-5 sm:p-8 lg:px-10"
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[1px] w-8 bg-primary/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Schedule Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white italic">FITNESS CALENDAR</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mt-1">Precision scheduling with MigoAI</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setWeeklyModalVisible(true)}
              disabled={syncingWeek || resetting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {syncingWeek ? (
                <span className="h-4 w-4 rounded-full border-2 border-black/25 border-t-black animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {syncingWeek ? 'Building...' : 'Build Week'}
            </button>
            <button
              type="button"
              onClick={resetUpcomingSchedule}
              disabled={syncingWeek || resetting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              {resetting ? (
                <span className="h-4 w-4 rounded-full border-2 border-red-300/25 border-t-red-300 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {resetting ? 'Resetting...' : 'Reset'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Card */}
        <div className="lg:col-span-8 space-y-8 w-full">
          <div className="glass-card p-4 md:p-10 bg-white/[0.01] border-white/10 w-full overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-black text-white italic tracking-tight">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={prevMonth}
                  className="flex-1 sm:flex-none p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all text-white/60 hover:text-white flex justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setSelectedDate(today);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all text-center"
                >
                  Today
                </button>
                <button 
                  onClick={nextMonth}
                  className="flex-1 sm:flex-none p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all text-white/60 hover:text-white flex justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div 
              className="grid gap-1 mb-2"
              style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/20 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div 
              className="grid gap-1 md:gap-2"
              style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const dayPlans = plansByDate[format(day, 'yyyy-MM-dd')] || [];
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={clsx(
                      "relative aspect-square rounded-xl md:rounded-[2rem] border p-1 md:p-2 transition-all duration-500 flex flex-col items-center justify-center md:items-start md:justify-start group min-h-[45px] md:min-h-[90px]",
                      !isCurrentMonth ? "opacity-10 pointer-events-none scale-90" : "opacity-100",
                      isSelected 
                        ? "bg-primary border-primary shadow-[0_0_30px_rgba(255,107,0,0.3)] z-10 scale-105" 
                        : isTodayDate 
                          ? "bg-primary/10 border-primary/40 text-primary shadow-inner" 
                          : "bg-white/[0.03] border-white/5 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]"
                    )}
                  >
                    <span className={clsx(
                      "text-xs md:text-sm font-black italic",
                      isSelected ? "text-white" : isTodayDate ? "text-primary" : "text-white/60 group-hover:text-white"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    {isTodayDate && !isSelected && (
                      <div className="absolute top-1 right-1 md:top-2 md:right-2 w-1 md:w-1.5 h-1 md:h-1.5 bg-primary rounded-full animate-pulse" />
                    )}

                    {dayPlans.length > 0 && (
                      <div className="absolute left-1 right-1 bottom-1 md:left-2 md:right-2 md:bottom-2 space-y-1 pointer-events-none">
                        <div className="flex justify-center md:justify-start gap-1 md:hidden">
                          {dayPlans.slice(0, 3).map((plan) => (
                            <span
                              key={plan.id}
                              className={clsx(
                                "w-1.5 h-1.5 rounded-full",
                                plan.type === 'workout' ? "bg-orange-400" : "bg-emerald-400"
                              )}
                            />
                          ))}
                        </div>
                        <div className="hidden md:flex md:flex-col gap-1">
                          {dayPlans.slice(0, 2).map((plan) => (
                            <span
                              key={plan.id}
                              className={clsx(
                                "truncate rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight border",
                                plan.type === 'workout'
                                  ? "bg-orange-500/15 text-orange-300 border-orange-500/20"
                                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                              )}
                              title={plan.structured_data?.calendar_tag || plan.title}
                            >
                              {plan.structured_data?.calendar_tag || plan.title}
                            </span>
                          ))}
                          {dayPlans.length > 2 && (
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                              +{dayPlans.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 md:p-6 flex items-start gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-black text-white italic tracking-tight mb-1">MIGO INSIGHT</h4>
              <p className="text-[10px] md:text-xs text-white/60 leading-relaxed">
                Consistency is the key to longevity. Complete your {format(selectedDate, 'EEEE')} session to maintain your fitness streak and reach your goals faster!
              </p>
            </div>
          </div>
        </div>

        {/* Selected Date Plans */}
        <div className="lg:col-span-4 space-y-6 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white italic tracking-tight">
              PLANS FOR {format(selectedDate, 'MMM dd').toUpperCase()}
            </h3>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
              {loading ? 'Updating...' : `${selectedDatePlans.length} Found`}
            </div>
          </div>

          <div className="space-y-4">
            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-200 flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-300" />
                <div className="min-w-0">
                  <p className="font-black uppercase tracking-widest text-[10px] text-red-300">Calendar sync failed</p>
                  <p className="mt-1 text-red-100/70 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="glass-card p-6 border-white/5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/5 rounded" />
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDatePlans.length > 0 ? (
              selectedDatePlans.map((plan) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="glass-card p-5 md:p-6 border-white/5 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                >
                  {plan.is_completed && (
                    <div className="absolute top-0 right-0 p-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      plan.type === 'workout' 
                        ? "bg-orange-500/10 text-orange-500 border border-orange-500/20 group-hover:bg-orange-500/20" 
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500/20"
                    )}>
                      {plan.type === 'workout' ? <Dumbbell size={24} /> : <Utensils size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">
                        {plan.type} Focus
                      </p>
                      <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight">
                        {plan.title}
                      </h4>
                      <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">
                        {plan.content.replace(/\[METER:[^\]]+\]/g, '').replace(/[#*`]/g, '')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                        v{plan.generation_count}.0
                      </span>
                      {plan.is_completed && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Logged
                        </span>
                      )}
                    </div>
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-12 text-center border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-2">
                  <Dumbbell size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/40">No plans for this day</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Ask MigoAI to generate a plan</p>
                </div>
                <button 
                  onClick={() => window.location.href = `/app/assistant?initialPrompt=Plan my fitness for ${format(selectedDate, 'MMMM dd, yyyy')}`}
                  className="mt-4 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  Generate Plan
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Info size={14} className="text-primary" /> Pro Tip
            </h4>
            <p className="text-xs text-white/40 leading-relaxed">
              You can ask MigoAI to "Update my workout for today" if you're feeling tired or have a specific injury. Your calendar will sync automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Modal Background Gradient */}
              <div className={clsx(
                "absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-br",
                selectedPlan.type === 'workout' ? "from-orange-500 to-transparent" : "from-emerald-500 to-transparent"
              )} />

              <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-white/10 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center relative z-10 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                    selectedPlan.type === 'workout' 
                      ? "bg-orange-500/20 text-orange-500 border-orange-500/30" 
                      : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                  )}>
                    {selectedPlan.type === 'workout' ? <Dumbbell size={24} /> : <Utensils size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight">{selectedPlan.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {format(new Date(selectedPlan.date_for), 'MMMM dd, yyyy')}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {selectedPlan.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {selectedPlan.type === 'workout' && selectedPlanExercises.length > 0 && (
                  <div className="mb-8">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-orange-300/80">Exercise Demos</p>
                    <WorkoutExerciseMediaGrid exercises={selectedPlanExercises} />
                  </div>
                )}
                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={selectedPlan.content} />
                </div>
              </div>
              
              <div className="p-5 sm:p-6 border-t border-white/10 bg-black/80 backdrop-blur-md flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end relative z-10">
                {!selectedPlan.is_completed ? (
                  <>
                    <button
                      onClick={() => setFeedbackModalVisible(true)}
                      disabled={regenerating !== null}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white/60 border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={regenerating === selectedPlan.id ? "animate-spin" : ""} />
                      Modify Plan
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {completing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Log Session
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <span className="text-sm font-black text-emerald-500 uppercase tracking-widest italic">Great work! Session Completed.</span>
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Logged on {format(new Date(), 'MMM dd')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modify Feedback Modal */}
      <AnimatePresence>
        {feedbackModalVisible && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setFeedbackModalVisible(false)} className="text-white/20 hover:text-white"><X size={20}/></button>
              </div>
              <h3 className="text-2xl font-black text-white italic tracking-tight mb-2">MODIFY PLAN</h3>
              <p className="text-[10px] text-white/40 mb-8 font-black uppercase tracking-[0.2em]">Tell MigoAI what to change</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Specific Feedback</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all min-h-[150px] resize-none"
                    placeholder="e.g. Focus more on strength today, or my back is a bit sore..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setFeedbackModalVisible(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRegenerate}
                    className="flex-[2] btn-primary py-4 rounded-2xl text-xs"
                  >
                    Regenerate Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {weeklyModalVisible && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight text-white">WEEKLY DROP</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/45">
                    MigoAI will build seven days from {format(selectedDate, 'MMMM dd')}. Add any focus, injury, or time limit.
                  </p>
                </div>
                <button onClick={() => setWeeklyModalVisible(false)} className="text-white/25 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <textarea
                className="mt-6 min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none transition focus:border-primary/50 placeholder:text-white/20"
                placeholder="e.g. Focus chest and arms, keep under 40 mins, avoid heavy squats..."
                value={userInstructions}
                onChange={(event) => setUserInstructions(event.target.value)}
              />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setWeeklyModalVisible(false)}
                  className="flex-1 rounded-2xl bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-white/45 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={syncWeeklySchedule}
                  disabled={syncingWeek}
                  className="flex-[2] rounded-2xl bg-primary px-5 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  Generate Week
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
