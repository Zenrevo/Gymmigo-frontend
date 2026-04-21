import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
      const res = await axios.get(`${API_URL}/trainer/full`);
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

      await axios.post(`${API_URL}/trainer/availability`, payload);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Weekly Schedule" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Day of Week */}
        <div>
          <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Day of Week</label>
          <select
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
          >
            {DAY_NAMES.map((day, idx) => (
              <option key={idx} value={idx} className="bg-zinc-900 text-white">{day}</option>
            ))}
          </select>
        </div>

        {/* Is Available Checkbox */}
        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-5 h-5 rounded-md border-white/20 text-primary focus:ring-primary focus:ring-offset-zinc-900 bg-white/10"
          />
          <div>
            <p className="font-bold text-sm">Available on this day</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Uncheck to mark as day off</p>
          </div>
        </div>

        {formData.is_available && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase">Time Slots</label>
              <button 
                type="button" 
                onClick={addSlot}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                  <div className="text-white/20 pb-2 text-xs">to</div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                  {formData.slots.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeSlot(index)}
                      className="p-2 mb-1 text-white/20 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Session Availability</label>
              <select
                name="session_type"
                value={formData.session_type}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
              >
                <option value="both" className="bg-zinc-900 text-white">Online & In-Person</option>
                <option value="online" className="bg-zinc-900 text-white">Online Only</option>
                <option value="offline" className="bg-zinc-900 text-white">In-Person Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              loading 
                ? "bg-primary/50 text-black/50 cursor-not-allowed" 
                : "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
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
    </Modal>
  );
}
