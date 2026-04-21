import { useState } from 'react';
import axios from 'axios';
import { Award, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCertificationModal({ isOpen, onClose, onSuccess }: AddCertificationModalProps) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    issued_by: '',
    issue_year: new Date().getFullYear(),
    expiry_year: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.issued_by || !formData.issue_year) {
      showNotification('error', 'Please fill in the required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        issued_by: formData.issued_by,
        issue_year: parseInt(formData.issue_year.toString()),
      };
      
      if (formData.expiry_year) {
        payload.expiry_year = parseInt(formData.expiry_year.toString());
      }

      await axios.post(`${API_URL}/trainer/certifications`, payload);
      showNotification('success', 'Certification added successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add certification:', err);
      showNotification('error', err.response?.data?.message || 'Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Certification" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div>
          <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Certification Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. NASM Certified Personal Trainer"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
            required
          />
        </div>

        {/* Issued By */}
        <div>
          <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Issuing Organization *</label>
          <input
            type="text"
            name="issued_by"
            value={formData.issued_by}
            onChange={handleChange}
            placeholder="e.g. National Academy of Sports Medicine"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Issue Year */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Issue Year *</label>
            <input
              type="number"
              name="issue_year"
              min="1980"
              max={new Date().getFullYear()}
              value={formData.issue_year}
              onChange={handleChange}
              placeholder="YYYY"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
              required
            />
          </div>
          
          {/* Expiry Year */}
          <div>
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Expiry Year (Optional)</label>
            <input
              type="number"
              name="expiry_year"
              min={formData.issue_year}
              value={formData.expiry_year}
              onChange={handleChange}
              placeholder="YYYY"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-white/20"
            />
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
            disabled={loading}
            className={clsx(
              "flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              loading 
                ? "bg-primary/50 text-black/50 cursor-not-allowed" 
                : "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Adding...</>
            ) : (
              <><Award size={16} /> Add Certification</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
