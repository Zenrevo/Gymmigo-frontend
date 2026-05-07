import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Clock, Activity, Loader2 } from 'lucide-react';
import api from '../../../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleTab = () => {
  const { gym, refetch, gymId } = useGym();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  
  // Hours Form State
  const [hoursForm, setHoursForm] = useState({ open_time: '06:00', close_time: '22:00', is_closed: false });

  // Busy Hours Form State
  const [busyDay, setBusyDay] = useState('monday');
  const [busyHour, setBusyHour] = useState('18');
  const [busyOcc, setBusyOcc] = useState('80');

  // === Operating Hours Methods ===
  const startEditing = (dayIndex: number) => {
    const existing = gym?.operating_hours?.find((h: any) => h.day_of_week === dayIndex);
    if (existing) {
      setHoursForm({
        open_time: existing.open_time || '06:00',
        close_time: existing.close_time || '22:00',
        is_closed: existing.is_closed
      });
    } else {
      setHoursForm({ open_time: '06:00', close_time: '22:00', is_closed: false });
    }
    setEditingDay(dayIndex);
  };

  const cancelEditing = () => setEditingDay(null);

  const saveHours = async (dayIndex: number) => {
    setIsSubmitting(true);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/hours`, {
        day_of_week: dayIndex,
        ...hoursForm
      });
      await refetch();
      setEditingDay(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Busy Hours Methods ===
  const saveBusyHour = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/busy-hours`, {
        day: busyDay,
        hour: parseInt(busyHour),
        occupancy_percentage: parseInt(busyOcc)
      });
      await refetch();
      // Optional: show toast
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight italic flex items-center gap-3">
             <Clock className="text-primary" size={32} /> TIMINGS
          </h2>
          <p className="text-white/40 text-sm">Manage your daily operating hours.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-white/5">
          {DAYS.map((day, index) => {
            const existing = gym?.operating_hours?.find((h: any) => h.day_of_week === index);
            const isEditing = editingDay === index;
            
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-white/5 transition-colors">
                <h4 className="font-bold w-32 uppercase tracking-widest text-sm">{day}</h4>
                
                {isEditing ? (
                  <div className="flex-1 flex flex-wrap items-center gap-4">
                     <label className="flex items-center gap-2 text-sm text-white/60">
                       <input type="checkbox" checked={hoursForm.is_closed} onChange={e => setHoursForm({...hoursForm, is_closed: e.target.checked})} className="accent-red-500 w-4 h-4 rounded" />
                       Closed entirely
                     </label>
                     {!hoursForm.is_closed && (
                       <div className="flex items-center gap-2">
                         <input type="time" value={hoursForm.open_time} onChange={e => setHoursForm({...hoursForm, open_time: e.target.value})} className="bg-[#111] border border-white/10 rounded-md px-3 py-1.5 text-sm" />
                         <span className="text-white/40">to</span>
                         <input type="time" value={hoursForm.close_time} onChange={e => setHoursForm({...hoursForm, close_time: e.target.value})} className="bg-[#111] border border-white/10 rounded-md px-3 py-1.5 text-sm" />
                       </div>
                     )}
                     <div className="flex items-center gap-2 ml-auto">
                        <button onClick={cancelEditing} className="px-3 py-1.5 text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => saveHours(index)} disabled={isSubmitting} className="btn-primary px-4 py-1.5 text-xs flex items-center gap-2">
                           {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                        </button>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       {existing?.is_closed ? (
                         <span className="px-3 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20">Closed</span>
                       ) : existing ? (
                         <span className="text-sm font-mono text-emerald-400 font-bold">{existing.open_time} - {existing.close_time}</span>
                       ) : (
                         <span className="text-sm text-white/20 italic">Not set</span>
                       )}
                     </div>
                     <button onClick={() => startEditing(index)} className="text-xs text-primary font-bold hover:underline">Edit</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-white/10">
        <h3 className="text-2xl font-black italic tracking-tight mb-6 flex items-center gap-3">
          <Activity className="text-emerald-500" /> BUSY PROFILING
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <form onSubmit={saveBusyHour} className="glass-card p-8 space-y-4 h-fit">
              <h4 className="font-bold text-sm uppercase tracking-widest text-white/60 mb-2">Update Traffic Estimate</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-white/40">Day of Week</label>
                   <select value={busyDay} onChange={e => setBusyDay(e.target.value)} className="w-full mt-1 bg-black border border-white/10 rounded-xl p-2.5 text-sm appearance-none">
                     {DAYS.map(d => <option key={d.toLowerCase()} value={d.toLowerCase()}>{d}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-white/40">Hour (0-23)</label>
                   <input type="number" min="0" max="23" value={busyHour} onChange={e => setBusyHour(e.target.value)} className="w-full mt-1 bg-black border border-white/10 rounded-xl p-2.5 text-sm" />
                 </div>
              </div>
              <div>
                <label className="flex justify-between text-xs font-bold text-white/40 mb-2">
                  <span>Occupancy Percentage</span>
                  <span className={parseInt(busyOcc) > 80 ? 'text-red-500' : 'text-emerald-500'}>{busyOcc}%</span>
                </label>
                <input type="range" min="0" max="100" value={busyOcc} onChange={e => setBusyOcc(e.target.value)} className="w-full accent-primary" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-2.5 text-sm">Update Forecast</button>
           </form>

           <div className="glass-card p-6 border-dashed opacity-50 flex items-center justify-center text-center">
              <div className="space-y-2 max-w-sm">
                <Activity className="mx-auto text-white/20" size={32} />
                <h4 className="font-bold">Traffic Heatmap Analysis</h4>
                <p className="text-xs text-white/40">A visual heatmap of {gym?.gym?.name}'s busy hours will render here. Map traffic to let members know the best time to workout.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;
