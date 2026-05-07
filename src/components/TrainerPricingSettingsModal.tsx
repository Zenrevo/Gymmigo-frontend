import { useState, useEffect } from 'react';
import api from '../utils/api';
import { DollarSign, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

interface TrainerPricingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrainerPricingSettingsModal({ isOpen, onClose, onSuccess }: TrainerPricingSettingsModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hourly_rate: '',
    single_session_charges: '',
    monthly_charges: '',
    session_duration_mins: 60,
    charges_negotiable: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trainer/full`);
      const profile = res.data.data.profile;
      
      setFormData({
        hourly_rate: profile.hourly_rate?.toString() || '',
        single_session_charges: profile.single_session_charges?.toString() || '',
        monthly_charges: profile.monthly_charges?.toString() || '',
        session_duration_mins: profile.session_duration_mins || 60,
        charges_negotiable: profile.charges_negotiable || false,
      });
    } catch (err) {
      console.error('Failed to fetch pricing profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate.toString()) : null,
        single_session_charges: formData.single_session_charges ? parseInt(formData.single_session_charges.toString()) : null,
        monthly_charges: formData.monthly_charges ? parseInt(formData.monthly_charges.toString()) : null,
        session_duration_mins: parseInt(formData.session_duration_mins.toString()),
        charges_negotiable: formData.charges_negotiable,
      };

      await api.patch(`/trainer`, payload);
      showNotification('Pricing updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update pricing:', err);
      showNotification(err.response?.data?.message || 'Failed to update pricing', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pricing & Service Info" maxWidth="max-w-md">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
          <Loader2 size={32} className="animate-spin mb-4" />
          <span className="text-xs tracking-widest uppercase font-bold">Loading...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Hourly Rate (₹)</label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-emerald-400 font-bold placeholder-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Single Session (₹)</label>
              <input
                type="number"
                name="single_session_charges"
                value={formData.single_session_charges}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-emerald-400 font-bold placeholder-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Monthly Base (₹)</label>
              <input
                type="number"
                name="monthly_charges"
                value={formData.monthly_charges}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-emerald-400 font-bold placeholder-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Session Dur. (mins) *</label>
              <input
                type="number"
                name="session_duration_mins"
                value={formData.session_duration_mins}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
            <input
              type="checkbox"
              name="charges_negotiable"
              checked={formData.charges_negotiable}
              onChange={handleChange}
              className="w-5 h-5 rounded-md border-white/20 text-primary focus:ring-primary focus:ring-offset-zinc-900 bg-white/10"
            />
            <div>
              <p className="font-bold text-sm">Rates are negotiable</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Allow clients to discuss customized pricing</p>
            </div>
          </div>

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
              disabled={saving}
              className={clsx(
                "flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                saving 
                  ? "bg-primary/50 text-black/50 cursor-not-allowed" 
                  : "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><DollarSign size={16} /> Save Pricing</>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
