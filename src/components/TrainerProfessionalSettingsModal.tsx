import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Briefcase, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

interface TrainerProfessionalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrainerProfessionalSettingsModal({ isOpen, onClose, onSuccess }: TrainerProfessionalSettingsModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    experience_years: '',
    experience_level: 'intermediate',
    languages_spoken: '',
    bio: '',
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
      
      // We also need bio, which might come from profile or we use fallback
      setFormData({
        experience_years: profile.experience_years?.toString() || '',
        experience_level: profile.experience_level || 'intermediate',
        languages_spoken: profile.languages_spoken ? profile.languages_spoken.join(', ') : '',
        bio: profile.bio || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        experience_level: formData.experience_level,
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
        bio: formData.bio,
      };

      await api.patch(`/trainer`, payload);
      showNotification('Professional details updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update professional details:', err);
      showNotification(err.response?.data?.message || 'Failed to validate updates', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Professional Details" maxWidth="max-w-md">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
          <Loader2 size={32} className="animate-spin mb-4" />
          <span className="text-xs tracking-widest uppercase font-bold">Loading...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest text-ink-muted uppercase mb-2">Years of Experience</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink placeholder:text-ink-subtle"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black tracking-widest text-ink-muted uppercase mb-2">Level</label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink appearance-none cursor-pointer"
              >
                <option value="beginner" className="bg-surface">Beginner</option>
                <option value="intermediate" className="bg-surface">Intermediate</option>
                <option value="advanced" className="bg-surface">Advanced</option>
                <option value="expert" className="bg-surface">Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-ink-muted uppercase mb-2">Languages Spoken</label>
            <input
              type="text"
              name="languages_spoken"
              value={formData.languages_spoken}
              onChange={handleChange}
              placeholder="English, Hindi, Marathi (comma separated)"
              className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink placeholder:text-ink-subtle"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-ink-muted uppercase mb-2">Brief Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell clients about your methodology and approach..."
              rows={4}
              className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-ink placeholder:text-ink-subtle resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-surface-raised border border-border text-ink rounded-xl font-black text-xs uppercase tracking-widest hover:bg-surface-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={clsx(
                "flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                saving 
                  ? "bg-accent/50 text-on-accent/70 cursor-not-allowed" 
                  : "bg-accent text-on-accent hover:bg-accent-pressed hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Briefcase size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
