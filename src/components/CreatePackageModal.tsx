import { useState } from 'react';
import axios from 'axios';
import { Package, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PACKAGE_TYPES = ['single', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];

export default function CreatePackageModal({ isOpen, onClose, onSuccess }: CreatePackageModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    package_type: 'monthly',
    total_sessions: 12,
    session_duration_mins: 60,
    validity_days: 30,
    price: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.total_sessions || !formData.validity_days) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        package_type: formData.package_type,
        total_sessions: parseInt(formData.total_sessions.toString()),
        session_duration_mins: parseInt(formData.session_duration_mins.toString()),
        validity_days: parseInt(formData.validity_days.toString()),
        price: parseInt(formData.price.toString()),
        description: formData.description,
      };

      await axios.post(`${API_URL}/trainer/packages`, payload);
      showNotification('success', 'Package created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create package:', err);
      showNotification('error', err.response?.data?.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Service Package" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Package Name */}
        <div>
          <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Package Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. 1 Month Elite Transformation"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Package Type */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Package Type</label>
            <div className="relative">
              <select
                name="package_type"
                value={formData.package_type}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
              >
                {PACKAGE_TYPES.map(type => (
                  <option key={type} value={type} className="bg-zinc-900 text-white">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Price */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-emerald-400 placeholder-white/20 font-bold"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Total Sessions */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Total Sessions *</label>
            <input
              type="number"
              name="total_sessions"
              value={formData.total_sessions}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
              required
            />
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Duration (mins) *</label>
            <input
              type="number"
              name="session_duration_mins"
              value={formData.session_duration_mins}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
              required
            />
          </div>

          {/* Validity */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Validity (days) *</label>
            <input
              type="number"
              name="validity_days"
              value={formData.validity_days}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what's included in this package..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20 resize-none"
          />
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
            disabled={loading}
            className={clsx(
              "flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              loading 
                ? "bg-primary/50 text-black/50 cursor-not-allowed" 
                : "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating...</>
            ) : (
              <><Package size={16} /> Create Package</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
