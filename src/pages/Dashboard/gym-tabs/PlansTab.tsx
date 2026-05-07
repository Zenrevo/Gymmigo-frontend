import { useState, useRef, useEffect } from 'react';
import { useGym } from '../../../context/GymContext';
import { CreditCard, Plus, CheckCircle2, MoreVertical, Edit3, Trash2, Clock, Package, X } from 'lucide-react';
import api from '../../../utils/api';
import { useNotification } from '../../../context/NotificationContext';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';

const PlansTab = () => {
  const { gym, refetch, gymId } = useGym();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');
  
  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Addon Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isAddonConfirmOpen, setIsAddonConfirmOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plan Form State
  const [planFormData, setPlanFormData] = useState({
    name: '',
    slot_name: '',
    duration_type: 'month',
    duration_days: '30',
    price: '',
    discounted_price: '',
    entry_fee: '',
    description: '',
    benefits: '',
    is_popular: false,
  });
  const [timeSlots, setTimeSlots] = useState<{start: string; end: string}[]>([{ start: '06:00', end: '22:00' }]);

  // Slot name combobox state
  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const slotDropdownRef = useRef<HTMLDivElement>(null);

  // Derive unique existing slot names from plans
  const existingSlotNames = Array.from(new Set(
    (gym?.membership_plans || []).map((p: any) => p.slot_name).filter(Boolean)
  )) as string[];

  // Filtered suggestions based on current input
  const slotSuggestions = existingSlotNames.filter(
    s => s.toLowerCase().includes((planFormData.slot_name || '').toLowerCase()) &&
         s.toLowerCase() !== (planFormData.slot_name || '').toLowerCase()
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slotDropdownRef.current && !slotDropdownRef.current.contains(e.target as Node) &&
          slotInputRef.current && !slotInputRef.current.contains(e.target as Node)) {
        setIsSlotDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper: get time slots from plan (new field first, fallback to legacy)
  const getTimeSlotsFromPlan = (plan: any): {start: string; end: string}[] => {
    if (plan.access_time_slots?.length) return plan.access_time_slots;
    if (plan.access_start_time && plan.access_end_time) return [{ start: plan.access_start_time, end: plan.access_end_time }];
    return [{ start: '06:00', end: '22:00' }];
  };

  // Helper: format time for display ("06:00" -> "6:00 AM")
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };


  // Addon Form State
  const [addonFormData, setAddonFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_type: 'month' // 'day'|'week'|'month'|'fixed'
  });

  // --- Plan Logic ---
  const openAddPlanModal = () => {
    setPlanFormData({
      name: '', slot_name: 'Full Access', duration_type: 'month', duration_days: '30', price: '', discounted_price: '', entry_fee: '', description: '', benefits: '', is_popular: false,
    });
    setTimeSlots([{ start: '06:00', end: '22:00' }]);
    setSelectedPlan(null);
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan: any) => {
    setPlanFormData({
      name: plan.name,
      slot_name: plan.slot_name || 'Full Access',
      duration_type: plan.duration_type || 'month',
      duration_days: plan.duration_days ? plan.duration_days.toString() : '',
      price: plan.price.toString(),
      discounted_price: plan.discounted_price ? plan.discounted_price.toString() : '',
      entry_fee: plan.entry_fee ? plan.entry_fee.toString() : '',
      description: plan.description || '',
      benefits: plan.benefits ? (Array.isArray(plan.benefits) ? plan.benefits.join(', ') : '') : '',
      is_popular: plan.is_popular,
    });
    setTimeSlots(getTimeSlotsFromPlan(plan));
    setSelectedPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handlePlanSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...planFormData,
      price: parseInt(planFormData.price),
      discounted_price: planFormData.discounted_price ? parseInt(planFormData.discounted_price) : null,
      entry_fee: planFormData.entry_fee ? parseInt(planFormData.entry_fee) : 0,
      duration_days: planFormData.duration_days ? parseInt(planFormData.duration_days) : null,
      benefits: planFormData.benefits.split(',').map(b => b.trim()).filter(b => b.length > 0),
      access_time_slots: timeSlots.filter(s => s.start && s.end),
      // legacy fields for backward compat
      access_start_time: timeSlots[0]?.start || '06:00',
      access_end_time: timeSlots[timeSlots.length - 1]?.end || '22:00',
    };
    try {
      if (selectedPlan) {
        await api.patch(`/gym-owner/gyms/${gymId}/plans/${selectedPlan.id}`, payload);
        showNotification('Plan updated successfully', 'success');
      } else {
        await api.post(`/gym-owner/gyms/${gymId}/plans`, payload);
        showNotification('Plan created successfully', 'success');
      }
      await refetch();
      setIsPlanModalOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.error?.message || 'Failed to save plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/plans/${selectedPlan.id}`);
      showNotification('Plan deleted', 'success');
      await refetch();
      setIsPlanConfirmOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.error?.message || 'Failed to delete plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Addon Logic ---
  const openAddAddonModal = () => {
    setAddonFormData({ name: '', description: '', price: '', duration_type: 'month' });
    setSelectedAddon(null);
    setIsAddonModalOpen(true);
  };

  const openEditAddonModal = (addon: any) => {
    setAddonFormData({
      name: addon.name,
      description: addon.description || '',
      price: addon.price.toString(),
      duration_type: addon.duration_type || 'month'
    });
    setSelectedAddon(addon);
    setIsAddonModalOpen(true);
  };

  const handleAddonSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...addonFormData,
      price: parseInt(addonFormData.price)
    };
    try {
      if (selectedAddon) {
        await api.patch(`/gym-owner/gyms/${gymId}/addons/${selectedAddon.id}`, payload);
        showNotification('Add-on updated successfully', 'success');
      } else {
        await api.post(`/gym-owner/gyms/${gymId}/addons`, payload);
        showNotification('Add-on created successfully', 'success');
      }
      await refetch();
      setIsAddonModalOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.error?.message || 'Failed to save add-on', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddonDelete = async () => {
    if (!selectedAddon) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/addons/${selectedAddon.id}`);
      showNotification('Add-on deleted', 'success');
      await refetch();
      setIsAddonConfirmOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.error?.message || 'Failed to delete add-on', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group plans by slot_name
  const groupedPlans = (gym?.membership_plans || []).reduce((acc: any, plan: any) => {
    const slot = plan.slot_name || 'Uncategorized';
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(plan);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight italic">MEMBERSHIP & SERVICES</h2>
          <p className="text-white/40 text-sm">Configure your time-slots, pricing, and add-ons.</p>
          
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setActiveTab('plans')}
              className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-white/40 hover:text-white'}`}
            >
              Membership Plans
            </button>
            <button 
              onClick={() => setActiveTab('addons')}
              className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === 'addons' ? 'border-primary text-primary' : 'border-transparent text-white/40 hover:text-white'}`}
            >
              Add-ons (Lockers, Parking, etc.)
            </button>
          </div>
        </div>
        
        <button 
          onClick={activeTab === 'plans' ? openAddPlanModal : openAddAddonModal} 
          className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm whitespace-nowrap self-start md:self-auto"
        >
          <Plus size={16} /> {activeTab === 'plans' ? 'Add Plan' : 'Add Service'}
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div className="space-y-12">
          {!gym?.membership_plans?.length ? (
            <EmptyState
              icon={CreditCard}
              title="No Membership Plans"
              description="Create pricing slots like 'Morning Warrior' or 'Evening Prime' with different durations."
              action={<button onClick={openAddPlanModal} className="text-primary hover:underline font-bold text-sm">Create First Plan</button>}
            />
          ) : (
            Object.keys(groupedPlans).map(slotName => (
              <div key={slotName} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <Clock size={14} className="text-primary" />
                    <span className="text-sm font-black uppercase tracking-widest">{slotName}</span>
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedPlans[slotName].map((plan: any) => (
                    <div key={plan.id} className="glass-card p-6 relative flex flex-col h-full group overflow-hidden border-white/5 hover:border-primary/30 transition-all">
                      {plan.is_popular && (
                        <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest z-10 shadow-lg">
                          Most Popular
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xl font-bold uppercase italic tracking-tight">{plan.name}</h4>
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-tighter">
                              {plan.duration_type} ACCESS • {plan.duration_days} DAYS
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {getTimeSlotsFromPlan(plan).map((slot, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[9px] font-bold text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                                  <Clock size={8} />
                                  {formatTime(slot.start)} - {formatTime(slot.end)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="group/menu relative">
                            <button className="p-1 text-white/20 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                              <MoreVertical size={14} />
                            </button>
                            <div className="absolute right-0 top-8 w-32 bg-[#111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all overflow-hidden z-20">
                              <button onClick={() => openEditPlanModal(plan)} className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5">
                                <Edit3 size={14} /> Edit
                              </button>
                              <button onClick={() => { setSelectedPlan(plan); setIsPlanConfirmOpen(true); }} className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-1">
                          <span className="text-white/40 text-sm">₹</span>
                          <span className="text-3xl font-black text-primary">{plan.discounted_price || plan.price}</span>
                          {plan.discounted_price && plan.discounted_price < plan.price && (
                            <span className="text-white/20 line-through text-xs ml-2">₹{plan.price}</span>
                          )}
                        </div>
                        
                        {plan.entry_fee > 0 && (
                          <div className="text-[10px] text-white/50 font-bold uppercase tracking-tight -mt-2">
                            + ₹{plan.entry_fee} Entry Fee <span className="text-primary/70 scale-90 inline-block">(New Members)</span>
                          </div>
                        )}

                        {plan.description && (
                          <p className="text-xs text-white/60 line-clamp-2">{plan.description}</p>
                        )}

                        <div className="space-y-2 pt-4 border-t border-white/5">
                          {(Array.isArray(plan.benefits) ? plan.benefits : []).slice(0, 3).map((benefit: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-white/50">
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!gym?.addons?.length ? (
            <EmptyState
              icon={Package}
              title="No Add-on Services"
              description="Offer extra services like Lockers, Private Parking, or Personal Training top-ups."
              action={<button onClick={openAddAddonModal} className="text-primary hover:underline font-bold text-sm">Create First Service</button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gym.addons.map((addon: any) => (
                <div key={addon.id} className="glass-card p-5 relative border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-white uppercase tracking-tight">{addon.name}</h4>
                       <div className="group/menu relative">
                          <button className="p-1 text-white/20 hover:text-white">
                            <MoreVertical size={14} />
                          </button>
                          <div className="absolute right-0 top-6 w-28 bg-[#111] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <button onClick={() => openEditAddonModal(addon)} className="w-full text-left px-3 py-2 text-[10px] flex items-center gap-2 hover:bg-white/5 uppercase font-bold">
                              <Edit3 size={12} /> Edit
                            </button>
                            <button onClick={() => { setSelectedAddon(addon); setIsAddonConfirmOpen(true); }} className="w-full text-left px-3 py-2 text-[10px] flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors uppercase font-bold">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 mb-3">{addon.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] text-white/40">₹</span>
                      <span className="text-xl font-black text-primary">{addon.price}</span>
                      <span className="text-[8px] text-white/40 ml-1 uppercase">/{addon.duration_type}</span>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${addon.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {addon.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Plan Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={selectedPlan ? "Edit Membership Plan" : "New Membership Plan"}>
        <form onSubmit={handlePlanSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1 relative">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Slot/Category Name *</label>
              <input
                ref={slotInputRef}
                required
                type="text"
                value={planFormData.slot_name}
                onChange={e => {
                  setPlanFormData({...planFormData, slot_name: e.target.value});
                  setIsSlotDropdownOpen(true);
                }}
                onFocus={() => setIsSlotDropdownOpen(true)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                placeholder="e.g. Gym Access"
                autoComplete="off"
              />
              {isSlotDropdownOpen && (slotSuggestions.length > 0 || (planFormData.slot_name && !existingSlotNames.includes(planFormData.slot_name))) && (
                <div ref={slotDropdownRef} className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                  {slotSuggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setPlanFormData({...planFormData, slot_name: name});
                        setIsSlotDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors"
                    >
                      <Clock size={12} className="text-primary shrink-0" />
                      <span className="font-bold uppercase tracking-tight">{name}</span>
                      <span className="text-[9px] text-white/20 ml-auto">existing</span>
                    </button>
                  ))}
                  {planFormData.slot_name && !existingSlotNames.includes(planFormData.slot_name) && (
                    <button
                      type="button"
                      onClick={() => setIsSlotDropdownOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-primary/10 transition-colors border-t border-white/5"
                    >
                      <Plus size={12} className="text-primary shrink-0" />
                      <span className="font-bold text-primary">Create "{planFormData.slot_name}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Plan Title *</label>
              <input required type="text" value={planFormData.name} onChange={e => setPlanFormData({...planFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none" placeholder="e.g. 1 Month Pro" />
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Access Time Slots</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeSlots([...timeSlots, { start: '', end: '' }])}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
                >
                  <Plus size={12} /> Add Slot
                </button>
             </div>
             {timeSlots.map((slot, idx) => (
               <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                 <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Start</label>
                   <input
                     type="time"
                     value={slot.start}
                     onChange={e => {
                       const updated = [...timeSlots];
                       updated[idx] = { ...updated[idx], start: e.target.value };
                       setTimeSlots(updated);
                     }}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">End</label>
                   <input
                     type="time"
                     value={slot.end}
                     onChange={e => {
                       const updated = [...timeSlots];
                       updated[idx] = { ...updated[idx], end: e.target.value };
                       setTimeSlots(updated);
                     }}
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                   />
                 </div>
                 <button
                   type="button"
                   onClick={() => {
                     if (timeSlots.length > 1) setTimeSlots(timeSlots.filter((_, i) => i !== idx));
                   }}
                   disabled={timeSlots.length <= 1}
                   className={`p-2 rounded-lg border transition-colors mb-[1px] ${
                     timeSlots.length <= 1
                       ? 'border-white/5 text-white/10 cursor-not-allowed'
                       : 'border-red-500/20 text-red-500 hover:bg-red-500/10'
                   }`}
                 >
                   <X size={14} />
                 </button>
               </div>
             ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Duration Type *</label>
              <select value={planFormData.duration_type} onChange={e => setPlanFormData({...planFormData, duration_type: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm text-white outline-none">
                <option value="day">Day Pass</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="half_year">Half Yearly</option>
                <option value="year">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Duration (Days) *</label>
              <select 
                required 
                value={planFormData.duration_days} 
                onChange={e => setPlanFormData({...planFormData, duration_days: e.target.value})} 
                className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select Days</option>
                <option value="1">1 Day</option>
                <option value="7">7 Days (1 Week)</option>
                <option value="30">30 Days (1 Month)</option>
                <option value="180">180 Days (6 Months)</option>
                <option value="360">360 Days (1 Year)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Reg. Price (₹) *</label>
              <input required type="number" value={planFormData.price} onChange={e => setPlanFormData({...planFormData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary" placeholder="1500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Discount Price (₹)</label>
              <input type="number" value={planFormData.discounted_price} onChange={e => setPlanFormData({...planFormData, discounted_price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary" placeholder="Optional" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Entry Fee (₹)</label>
              <input type="number" value={planFormData.entry_fee} onChange={e => setPlanFormData({...planFormData, entry_fee: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary" placeholder="Optional" />
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Benefits (Comma separated)</label>
             <textarea value={planFormData.benefits} onChange={e => setPlanFormData({...planFormData, benefits: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none custom-scrollbar" placeholder="Cardio Access, Locker Room" />
          </div>
          
          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <input type="checkbox" checked={planFormData.is_popular} onChange={e => setPlanFormData({...planFormData, is_popular: e.target.checked})} className="w-4 h-4 accent-primary rounded bg-black/50 border-white/20" />
            <span className="text-xs font-bold uppercase tracking-wider">Highlight as Popular</span>
          </label>

          <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2">
             {isSubmitting ? 'Processing...' : (selectedPlan ? 'Save Changes' : 'Publish Plan')}
          </button>
        </form>
      </Modal>

      {/* Addon Modal */}
      <Modal isOpen={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} title={selectedAddon ? "Edit Add-on Service" : "New Add-on Service"}>
        <form onSubmit={handleAddonSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Service Name *</label>
            <input required type="text" value={addonFormData.name} onChange={e => setAddonFormData({...addonFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none" placeholder="e.g. Locker Rent" />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={addonFormData.description} onChange={e => setAddonFormData({...addonFormData, description: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none custom-scrollbar" placeholder="Brief details about the service" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Price (₹) *</label>
              <input required type="number" value={addonFormData.price} onChange={e => setAddonFormData({...addonFormData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm" placeholder="500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Billing Cycle *</label>
              <select value={addonFormData.duration_type} onChange={e => setAddonFormData({...addonFormData, duration_type: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm text-white outline-none">
                <option value="fixed">One-time / Visit</option>
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4">
             {isSubmitting ? 'Processing...' : (selectedAddon ? 'Update Service' : 'Add Service')}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isPlanConfirmOpen}
        onClose={() => setIsPlanConfirmOpen(false)}
        onConfirm={handlePlanDelete}
        title="Delete Plan"
        message={<>Delete <strong>{selectedPlan?.name}</strong>? Existing active memberships won't be affected.</>}
        isDangerous={true}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isAddonConfirmOpen}
        onClose={() => setIsAddonConfirmOpen(false)}
        onConfirm={handleAddonDelete}
        title="Delete Service"
        message={<>Remove <strong>{selectedAddon?.name}</strong> from your secondary offerings?</>}
        isDangerous={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default PlansTab;
