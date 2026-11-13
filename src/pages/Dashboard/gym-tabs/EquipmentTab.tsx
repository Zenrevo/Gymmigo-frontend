import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Dumbbell, Target, Plus, Trash2, Edit3 } from 'lucide-react';
import api from '../../../utils/api';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';

const EquipmentTab = () => {
  const { gym, refetch, gymId } = useGym();
  
  // Equipment State
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isEqConfirmOpen, setIsEqConfirmOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<any>(null);
  
  // Facility State
  const [isFacModalOpen, setIsFacModalOpen] = useState(false);
  const [isFacConfirmOpen, setIsFacConfirmOpen] = useState(false);
  const [selectedFac, setSelectedFac] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [eqFormData, setEqFormData] = useState({ name: '', brand: '', quantity: '1', category: 'cardio' });
  const [facFormData, setFacFormData] = useState({ name: '', description: '', is_included: true, quantity: '1' });

  // === Equipment Handlers ===
  const openEqAdd = () => {
    setEqFormData({ name: '', brand: '', quantity: '1', category: 'cardio' });
    setSelectedEq(null);
    setIsEqModalOpen(true);
  };
  const openEqEdit = (eq: any) => {
    setEqFormData({ name: eq.name, brand: eq.brand || '', quantity: eq.quantity?.toString() || '1', category: eq.category || 'cardio' });
    setSelectedEq(eq);
    setIsEqModalOpen(true);
  };
  const confirmEqDelete = (eq: any) => { setSelectedEq(eq); setIsEqConfirmOpen(true); };

  const handleEqSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...eqFormData, quantity: parseInt(eqFormData.quantity) };
    try {
      if (selectedEq) await api.patch(`/gym-owner/gyms/${gymId}/equipment/${selectedEq.id}`, payload);
      else await api.post(`/gym-owner/gyms/${gymId}/equipment`, payload);
      await refetch();
      setIsEqModalOpen(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };
  
  const handleEqDelete = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/equipment/${selectedEq.id}`);
      await refetch();
      setIsEqConfirmOpen(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  // === Facility Handlers ===
  const openFacAdd = () => {
    setFacFormData({ name: '', description: '', is_included: true, quantity: '1' });
    setSelectedFac(null);
    setIsFacModalOpen(true);
  };
  const openFacEdit = (fac: any) => {
    setFacFormData({ name: fac.name, description: fac.description || '', is_included: fac.is_included, quantity: fac.quantity?.toString() || '1' });
    setSelectedFac(fac);
    setIsFacModalOpen(true);
  };
  const confirmFacDelete = (fac: any) => { setSelectedFac(fac); setIsFacConfirmOpen(true); };

  const handleFacSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...facFormData, quantity: parseInt(facFormData.quantity) };
    try {
      if (selectedFac) await api.patch(`/gym-owner/gyms/${gymId}/facilities/${selectedFac.id}`, payload);
      else await api.post(`/gym-owner/gyms/${gymId}/facilities`, payload);
      await refetch();
      setIsFacModalOpen(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleFacDelete = async () => {
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/facilities/${selectedFac.id}`);
      await refetch();
      setIsFacConfirmOpen(false);
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Equipment Column (Takes 2/3) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between bg-surface-raised p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-3 pl-2">
            <Dumbbell className="text-accent-text" />
            <h3 className="text-xl font-bold tracking-tight">EQUIPMENT</h3>
          </div>
          <button onClick={openEqAdd} className="p-2 bg-surface-sunken hover:bg-surface-sunken rounded-xl transition-colors text-ink"><Plus size={20} /></button>
        </div>

        {!gym?.equipment?.length ? (
          <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center text-ink-muted border-dashed">No equipment added yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gym.equipment.map((eq: any) => (
              <div key={eq.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-5 group hover:border-accent-border transition-all flex justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-ink-muted group-hover:text-accent-text transition-colors">
                    <Dumbbell size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold truncate max-w-[150px]">{eq.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ink-muted uppercase font-black">{eq.category}</span>
                      {eq.brand && <span className="text-[10px] text-ink-subtle">• {eq.brand}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEqEdit(eq)} className="p-1.5 text-ink-muted hover:text-ink rounded-md hover:bg-surface-sunken"><Edit3 size={14} /></button>
                    <button onClick={() => confirmEqDelete(eq)} className="p-1.5 text-ink-muted hover:text-danger rounded-md hover:bg-danger-soft"><Trash2 size={14} /></button>
                  </div>
                  <p className="text-2xl font-black text-accent-text mt-1 pr-1">x{eq.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facilities Column (Takes 1/3) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-surface-raised p-4 rounded-2xl border border-border">
           <div className="flex items-center gap-3 pl-2">
             <Target className="text-success" />
             <h3 className="text-xl font-bold tracking-tight">FACILITIES</h3>
           </div>
           <button onClick={openFacAdd} className="p-2 bg-surface-sunken hover:bg-surface-sunken rounded-xl transition-colors text-ink"><Plus size={20} /></button>
        </div>

        {!gym?.facilities?.length ? (
           <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center text-ink-muted border-dashed text-sm">No special facilities added.</div>
        ) : (
           <div className="space-y-4">
             {gym.facilities.map((fac: any) => (
               <div key={fac.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-5 group hover:border-success/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="pr-4">
                      <h5 className="font-bold flex items-center gap-2">
                        {fac.name}
                        {fac.quantity > 1 && <span className="text-ink-muted text-xs font-mono">x{fac.quantity}</span>}
                      </h5>
                      <span className={`text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-sm mt-1 inline-block ${fac.is_included ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                        {fac.is_included ? 'Included in pass' : 'Extra Charge'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openFacEdit(fac)} className="p-1.5 text-ink-muted hover:text-ink rounded-md hover:bg-surface-sunken"><Edit3 size={14} /></button>
                      <button onClick={() => confirmFacDelete(fac)} className="p-1.5 text-ink-muted hover:text-danger rounded-md hover:bg-danger-soft"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {fac.description && <p className="text-xs text-ink-muted mt-3">{fac.description}</p>}
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Equipment Modal */}
      <Modal isOpen={isEqModalOpen} onClose={() => setIsEqModalOpen(false)} title={selectedEq ? "Edit Equipment" : "Add Equipment"}>
        <form onSubmit={handleEqSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Item Name *</label>
            <input required type="text" value={eqFormData.name} onChange={e => setEqFormData({...eqFormData, name: e.target.value})} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="e.g. Incline Bench Press" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Category *</label>
              <select value={eqFormData.category} onChange={e => setEqFormData({...eqFormData, category: e.target.value})} className="w-full bg-surface border border-border rounded-xl p-3 text-ink focus:border-accent outline-none appearance-none">
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="free_weights">Free Weights</option>
                <option value="functional">Functional</option>
                <option value="stretching">Stretching</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Quantity *</label>
              <input required type="number" min="1" value={eqFormData.quantity} onChange={e => setEqFormData({...eqFormData, quantity: e.target.value})} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Brand (Optional)</label>
            <input type="text" value={eqFormData.brand} onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="e.g. Life Fitness" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-3 mt-4">Save Equipment</button>
        </form>
      </Modal>

      {/* Facility Modal */}
      <Modal isOpen={isFacModalOpen} onClose={() => setIsFacModalOpen(false)} title={selectedFac ? "Edit Facility" : "Add Facility"}>
        <form onSubmit={handleFacSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Facility Name *</label>
            <input required type="text" disabled={!!selectedFac} value={facFormData.name} onChange={e => setFacFormData({...facFormData, name: e.target.value})} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none disabled:opacity-50" placeholder="e.g. Sauna, Swimming Pool" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Quantity</label>
            <input required type="number" min="1" value={facFormData.quantity} onChange={e => setFacFormData({...facFormData, quantity: e.target.value})} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" />
          </div>
          <div>
             <label className="block text-xs font-bold text-ink-muted uppercase mb-2">Description</label>
             <textarea value={facFormData.description} onChange={e => setFacFormData({...facFormData, description: e.target.value})} rows={2} className="w-full bg-surface-raised border border-border rounded-xl p-3 text-ink focus:border-accent outline-none custom-scrollbar" placeholder="Brief details about the facility" />
          </div>
          <label className="flex items-center gap-3 p-4 bg-surface-raised rounded-xl border border-border cursor-pointer hover:bg-surface-sunken transition-colors">
            <input type="checkbox" checked={facFormData.is_included} onChange={e => setFacFormData({...facFormData, is_included: e.target.checked})} className="w-5 h-5 accent-emerald-500 rounded bg-surface-sunken border-border-strong" />
            <div className="space-y-1">
               <span className="text-sm font-bold text-success">Included in standard membership</span>
               <p className="text-xs text-ink-muted">Uncheck if members must pay extra to use this.</p>
            </div>
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-3 mt-4">Save Facility</button>
        </form>
      </Modal>

      {/* Confirmations */}
      <ConfirmDialog isOpen={isEqConfirmOpen} onClose={() => setIsEqConfirmOpen(false)} onConfirm={handleEqDelete} title="Remove Equipment" message={`Remove ${selectedEq?.name} from inventory?`} isDangerous />
      <ConfirmDialog isOpen={isFacConfirmOpen} onClose={() => setIsFacConfirmOpen(false)} onConfirm={handleFacDelete} title="Remove Facility" message={`Delete ${selectedFac?.name}?`} isDangerous />
    </div>
  );
};

export default EquipmentTab;
