import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { CreditCard, Plus, CheckCircle2, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const PlansTab = () => {
  const { gym, refetch, gymId } = useGym();
  const { showNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    duration_type: 'month',
    duration_days: '30',
    price: '',
    discounted_price: '',
    description: '',
    benefits: '',
    is_popular: false
  });

  const openAddModal = () => {
    setFormData({
      name: '', duration_type: 'month', duration_days: '30', price: '', discounted_price: '', description: '', benefits: '', is_popular: false
    });
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setFormData({
      name: plan.name,
      duration_type: plan.duration_type || 'month',
      duration_days: plan.duration_days ? plan.duration_days.toString() : '',
      price: plan.price.toString(),
      discounted_price: plan.discounted_price ? plan.discounted_price.toString() : '',
      description: plan.description || '',
      benefits: plan.benefits ? plan.benefits.join(', ') : '',
      is_popular: plan.is_popular
    });
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const confirmDelete = (plan: any) => {
    setSelectedPlan(plan);
    setIsConfirmOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      price: parseInt(formData.price),
      discounted_price: formData.discounted_price ? parseInt(formData.discounted_price) : null,
      duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
      benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b.length > 0)
    };

    try {
      if (selectedPlan) {
        await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/plans/${selectedPlan.id}`, payload);
        showNotification('Plan updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/plans`, payload);
        showNotification('Plan created successfully', 'success');
      }
      await refetch();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save plan', err);
      showNotification(err.response?.data?.error?.message || 'Failed to save plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/gym-owner/gyms/${gymId}/plans/${selectedPlan.id}`);
      showNotification('Plan deleted', 'success');
      await refetch();
      setIsConfirmOpen(false);
    } catch (err: any) {
      console.error('Failed to delete plan', err);
      showNotification(err.response?.data?.error?.message || 'Failed to delete plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight italic">MEMBERSHIP PLANS</h2>
          <p className="text-white/40 text-sm">Create and manage your pricing tiers.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm max-w-xs justify-center">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {!gym?.membership_plans?.length ? (
        <EmptyState
          icon={CreditCard}
          title="No Membership Plans"
          description="You haven't created any pricing plans yet. Add your first plan to start monetizing your gym."
          action={<button onClick={openAddModal} className="text-primary hover:underline font-bold text-sm">Create a Plan</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gym.membership_plans.map((plan: any) => (
            <div key={plan.id} className="glass-card p-8 relative flex flex-col h-full group overflow-hidden">
              {plan.is_popular && (
                <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              
              <div className="flex-1 space-y-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-2xl font-bold uppercase italic tracking-tight">{plan.name}</h4>
                    <p className="text-white/40 text-xs capitalize">{plan.duration_type} Access</p>
                  </div>
                  <div className="group/menu relative">
                    <button className="p-2 -mr-2 text-white/20 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                    <div className="absolute right-0 top-10 w-32 bg-[#222] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all overflow-hidden z-20">
                      <button onClick={() => openEditModal(plan)} className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button onClick={() => confirmDelete(plan)} className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-white/40 text-lg">₹</span>
                  <span className="text-4xl font-black text-primary">{plan.discounted_price || plan.price}</span>
                  {plan.discounted_price && plan.discounted_price < plan.price && (
                    <span className="text-white/20 line-through text-sm ml-2">₹{plan.price}</span>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-white/60">{plan.description}</p>
                )}

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {plan.benefits?.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-white/70">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPlan ? "Edit Plan" : "New Membership Plan"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Plan Name *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="e.g. Monthly Pro" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Duration Type *</label>
              <select value={formData.duration_type} onChange={e => setFormData({...formData, duration_type: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none">
                <option value="day">Day Pass</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="half_year">Half Yearly</option>
                <option value="year">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Duration (Days)</label>
              <input type="number" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="e.g. 30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Regular Price (₹) *</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="1500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Discount Price (₹)</label>
              <input type="number" value={formData.discounted_price} onChange={e => setFormData({...formData, discounted_price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Optional" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Description</label>
             <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none custom-scrollbar" placeholder="Brief description of the plan" />
          </div>

          <div>
             <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Benefits (Comma separated)</label>
             <textarea value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none custom-scrollbar" placeholder="Cardio Access, Locker Room, Free Wifi" />
          </div>
          
          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" checked={formData.is_popular} onChange={e => setFormData({...formData, is_popular: e.target.checked})} className="w-5 h-5 accent-primary rounded bg-black/50 border-white/20" />
            <span className="text-sm font-bold">Mark as Most Popular</span>
          </label>

          <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4">
             {selectedPlan ? 'Save Changes' : 'Create Plan'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={<>Are you sure you want to delete <strong>{selectedPlan?.name}</strong>? Members currently subscribed to this plan will not be affected, but no new members can purchase it. This action cannot be undone.</>}
        isDangerous={true}
        confirmLabel="Delete Plan"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default PlansTab;
