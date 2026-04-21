import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Droplets, Target, Activity, ChevronRight, TrendingUp, Dumbbell } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotification } from '../context/NotificationContext';

export default function MemberInsights() {
  const { showNotification } = useNotification();
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [chartView, setChartView] = useState<'weight' | 'muscle'>('weight');

  // Mock Data
  const streak = 4;
  const currentLevel = "Silver Tier";
  const nextLevel = "Gold Tier";
  const progressPercent = 75; // 75% to next level

  // Generate heatmap mock data (last 4 weeks)
  const heatmapData = Array.from({ length: 28 }).map((_, i) => ({
    date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000),
    intensity: Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0, // 0-3
  }));

  // Simple SVG Line Chart Data
  const weightData = [75, 74.5, 74.2, 73.8, 73.1, 72.5, 72.0];
  const muscleData = [32, 32.2, 32.5, 32.8, 33.1, 33.4, 33.8];
  
  const currentChartData = chartView === 'weight' ? weightData : muscleData;
  const chartMin = Math.min(...currentChartData) - 1;
  const chartMax = Math.max(...currentChartData) + 1;
  
  const handleDrinkWater = () => {
    if (waterGlasses < 8) {
      setWaterGlasses(prev => prev + 1);
      if (waterGlasses + 1 === 8) {
        showNotification("Daily hydration goal reached! 🌊", "success");
      }
    }
  };

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
              <span className="text-white/60">{currentLevel}</span>
              <span className="text-primary">{nextLevel}</span>
            </div>
            
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progressPercent}%` }} 
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
              Only 4 more sessions to unlock Gold Tier
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
            {heatmapData.map((day, i) => (
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
                  {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {day.intensity > 0 ? ' • Active' : ' • Rest'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
      </div>

      {/* Utility Row: Metrics & Daily Routine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Body Metrics Chart */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                Body Metrics
              </h3>
              <p className="text-xs text-white/40">Visual progress tracker</p>
            </div>
            
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button 
                onClick={() => setChartView('weight')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                  chartView === 'weight' ? "bg-primary text-black" : "text-white/40 hover:text-white"
                )}
              >
                Weight
              </button>
              <button 
                onClick={() => setChartView('muscle')}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                  chartView === 'muscle' ? "bg-emerald-500 text-black" : "text-white/40 hover:text-white"
                )}
              >
                Muscle Mass
              </button>
            </div>
          </div>
          
          {/* Custom SVG Line Chart */}
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={`M ${currentChartData.map((val, i) => {
                  const x = (i / (currentChartData.length - 1)) * 400;
                  const y = 100 - ((val - chartMin) / (chartMax - chartMin)) * 100;
                  return `${x},${y}`;
                }).join(' L ')}`}
                fill="none"
                stroke={chartView === 'weight' ? "#F1822C" : "#10B981"}
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              
              {/* Data points */}
              {currentChartData.map((val, i) => {
                const x = (i / (currentChartData.length - 1)) * 400;
                const y = 100 - ((val - chartMin) / (chartMax - chartMin)) * 100;
                return (
                  <motion.circle
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={chartView === 'weight' ? "#F1822C" : "#10B981"}
                    stroke="#000"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-[6px] transition-all"
                  />
                );
              })}
            </svg>
            
            <div className="absolute inset-0 flex justify-between items-end pb-[-20px] pointer-events-none text-[8px] text-white/30 font-bold uppercase translate-y-6">
              <span>Wk 1</span>
              <span>Wk 2</span>
              <span>Wk 3</span>
              <span>Wk 4</span>
              <span>Wk 5</span>
              <span>Wk 6</span>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* Daily Widgets */}
        <div className="space-y-6 flex flex-col">
          
          {/* Today's Focus */}
          <div className="glass-card p-6 flex-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={80} />
            </div>
            <h3 className="font-bold flex items-center gap-2 border-b border-white/5 pb-2 mb-4 relative z-10">
              <Dumbbell size={16} className="text-primary" />
              Today's Focus
            </h3>
            
            <div className="relative z-10 space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors group/item">
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Scheduled Session</p>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">Chest & Triceps</h4>
                  <ChevronRight size={16} className="text-white/20 group-hover/item:text-primary transition-colors group-hover/item:translate-x-1 transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Hydration Tracker */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Droplets size={16} className="text-blue-500" />
                Hydration
              </h3>
              <span className="text-xs font-bold">{waterGlasses} / 8</span>
            </div>
            
            <div className="flex items-center justify-between gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  disabled={i < waterGlasses}
                  onClick={handleDrinkWater}
                  className={clsx(
                    "flex-1 h-12 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group",
                    i < waterGlasses ? "bg-blue-500/20 border-blue-500/30" : "bg-white/5 border-white/10 hover:border-blue-500/50"
                  )}
                >
                  <AnimatePresence>
                    {i < waterGlasses && (
                      <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        className="absolute inset-0 bg-blue-500/40"
                      />
                    )}
                  </AnimatePresence>
                  <Droplets size={14} className={clsx("relative z-10", i < waterGlasses ? "text-blue-400 fill-blue-400" : "text-white/20 group-hover:text-blue-500/50")} />
                </button>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
