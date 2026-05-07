import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface ConsistencyHeatmapProps {
  heatmapData: any[];
  loading?: boolean;
}

export default function ConsistencyHeatmap({ heatmapData, loading }: ConsistencyHeatmapProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Activity className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const activeDays = (heatmapData || []).filter((day: any) => Number(day.count ?? day.intensity ?? 0) > 0).length;

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tighter">GRIND MAP</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active-day rhythm over the last 28 days</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{activeDays}/28 ACTIVE</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(heatmapData && heatmapData.length > 0 ? heatmapData : Array.from({ length: 28 }).map((_, i) => ({ intensity: 0, date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000).toISOString() }))).map((day: any, i: number) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.01 }}
            className={clsx(
              "w-8 h-8 rounded-lg border transition-all cursor-help relative group",
              day.intensity === 0 ? "bg-white/5 border-white/5 hover:border-white/20" :
              day.intensity === 1 ? "bg-primary/30 border-primary/20 hover:border-primary/50" :
              day.intensity === 2 ? "bg-primary/60 border-primary/40 hover:border-primary/80" :
              "bg-primary border-primary shadow-[0_0_15px_rgba(241,130,44,0.2)]"
            )}
          >
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/95 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-white/10 z-20 shadow-2xl">
              {day.date ? new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Day ' + (i + 1)}
              {day.intensity > 0 ? ' • Active' : ' • Rest'}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Less</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded bg-white/5 border border-white/5" />
          <div className="w-3 h-3 rounded bg-primary/30 border border-primary/20" />
          <div className="w-3 h-3 rounded bg-primary/60 border border-primary/40" />
          <div className="w-3 h-3 rounded bg-primary border border-primary" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">More</span>
      </div>
    </div>
  );
}
