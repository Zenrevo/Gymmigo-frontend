import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calendar, Loader2 } from 'lucide-react';
import { Sheet } from './kit';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

interface TrainerScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TrainerScheduleModal({ isOpen, onClose, onSuccess }: TrainerScheduleModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    is_available: true,
    session_type: 'both',
    slots: [{ start_time: '06:00', end_time: '20:00' }],
  });

  useEffect(() => {
    if (isOpen) {
      fetchDayAvailability(formData.day_of_week);
    }
  }, [isOpen, formData.day_of_week]);

  const fetchDayAvailability = async (day: number) => {
    try {
      const res = await api.get(`/trainer/full`);
      const allAvail = res.data.availability || [];
      const daySlots = allAvail.filter((a: any) => a.day_of_week === day);
      
      if (daySlots.length > 0) {
        setFormData(prev => ({
          ...prev,
          day_of_week: day,
          is_available: daySlots[0].is_available,
          session_type: daySlots[0].session_type,
          slots: daySlots.map((s: any) => ({
            start_time: s.start_time,
            end_time: s.end_time
          }))
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          day_of_week: day,
          is_available: true,
          slots: [{ start_time: '06:00', end_time: '20:00' }]
        }));
      }
    } catch (err) {
      console.error('Failed to fetch day availability:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    const name = e.target.name;
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlotChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSlots = [...formData.slots];
    newSlots[index][field] = value;
    setFormData(prev => ({ ...prev, slots: newSlots }));
  };

  const addSlot = () => {
    setFormData(prev => ({
      ...prev,
      slots: [...prev.slots, { start_time: '09:00', end_time: '12:00' }]
    }));
  };

  const removeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.is_available && formData.slots.length === 0) {
      showNotification('Please add at least one time slot if available.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        day_of_week: parseInt(formData.day_of_week.toString()),
      };

      await api.post(`/trainer/availability`, payload);
      showNotification('Availability updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update availability:', err);
      showNotification(err.response?.data?.message || 'Failed to update schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onClose={onClose} title="Manage Weekly Schedule" size="sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Day of Week */}
        <div>
          <label className="block text-[10px] font-bold tracking-widest text-ink-muted uppercase mb-2">Day of Week</label>
          <select
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink appearance-none cursor-pointer"
          >
            {DAY_NAMES.map((day, idx) => (
              <option key={idx} value={idx} className="bg-surface text-ink">{day}</option>
            ))}
          </select>
        </div>

        {/* Is Available Checkbox */}
        <div className="flex items-center gap-3 bg-surface-raised p-4 rounded-xl border border-border">
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-5 h-5 rounded-md border-border-strong text-accent-text focus:ring-accent focus:ring-offset-zinc-900 bg-surface-sunken"
          />
          <div>
            <p className="font-bold text-sm">Available on this day</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-widest">Uncheck to mark as day off</p>
          </div>
        </div>

        {formData.is_available && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold tracking-widest text-ink-muted uppercase">Time Slots</label>
              <button 
                type="button" 
                onClick={addSlot}
                className="text-[10px] font-bold text-accent-text uppercase tracking-widest hover:text-ink transition-colors"
               >+ Add Range</button>
            </div>
            
            <div className="space-y-3">
              {formData.slots.map((slot, index) => (
                <div key={index} className="flex gap-2 items-end group">
                  <div className="flex-1">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent transition-all text-ink"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                  <div className="text-ink-subtle pb-2 text-xs">to</div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent transition-all text-ink"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                  {formData.slots.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeSlot(index)}
                      className="p-2 mb-1 text-ink-subtle hover:text-danger transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-ink-muted uppercase mb-2">Session Availability</label>
              <select
                name="session_type"
                value={formData.session_type}
                onChange={handleChange}
                className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink appearance-none cursor-pointer"
              >
                <option value="both" className="bg-surface text-ink">Online & In-Person</option>
                <option value="online" className="bg-surface text-ink">Online Only</option>
                <option value="offline" className="bg-surface text-ink">In-Person Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-surface-raised border border-border text-ink rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-sunken transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "flex-[2] py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              loading 
                ? "bg-accent/50 text-on-accent/70 cursor-not-allowed" 
                : "bg-accent text-on-accent hover:bg-accent-pressed hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Calendar size={16} /> Save Slots</>
            )}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
