import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Settings, MapPin, Building, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const SettingsTab = () => {
  const { gym, refetch, gymId } = useGym();
  const { showNotification } = useNotification();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms states
  const [basicInfo, setBasicInfo] = useState({
    name: gym?.gym?.name || '',
    description: gym?.gym?.description || '',
    established_year: gym?.gym?.established_year || '',
    contact_phone: gym?.gym?.contact_phone || '',
    contact_email: gym?.gym?.contact_email || '',
    website_url: gym?.gym?.website_url || ''
  });

  const primaryAddress = gym?.addresses?.find((a: any) => a.is_primary) || {};
  const [address, setAddress] = useState({
    address_line1: primaryAddress.address_line1 || '',
    address_line2: primaryAddress.address_line2 || '',
    city: primaryAddress.city || gym?.gym?.city || '',
    state: primaryAddress.state || gym?.gym?.state || '',
    pincode: primaryAddress.pincode || ''
  });

  const [capacity, setCapacity] = useState({
    max_capacity: gym?.gym?.max_capacity || '',
    is_24_hours: gym?.gym?.is_24_hours || false
  });


  const handleBasicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/basic-info`, basicInfo);
      await refetch();
      showNotification('Basic info updated successfully', 'success');
    } catch (err: any) { 
      console.error(err); 
    } finally { setIsSubmitting(false); }
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (primaryAddress.id) {
        await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/addresses/${primaryAddress.id}`, address);
      } else {
        await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/addresses`, { ...address, is_primary: true });
      }
      await refetch();
      showNotification('Location updated', 'success');
    } catch (err: any) { 
      console.error(err); 
    } finally { setIsSubmitting(false); }
  };

  const handleCapacitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/capacity`, capacity);
      await refetch();
      showNotification('Operations updated', 'success');
    } catch (err: any) { 
      console.error(err); 
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-display font-black tracking-tight italic flex items-center gap-3">
           <Settings className="text-primary" size={32} /> GYM SETTINGS
         </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BASIC INFO */}
        <section className="glass-card p-8">
           <div className="flex items-center gap-2 text-primary font-bold mb-6 border-b border-white/5 pb-4">
             <Building size={20} /> <h3 className="uppercase tracking-widest text-sm">Basic Info</h3>
           </div>
           
           <form onSubmit={handleBasicSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">Gym Name</label>
                <input required type="text" value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">Description</label>
                <textarea rows={4} value={basicInfo.description} onChange={e => setBasicInfo({...basicInfo, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none custom-scrollbar" placeholder="Tell members what makes your gym special..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-white/60 mb-2">Contact Phone</label>
                   <input type="tel" value={basicInfo.contact_phone} onChange={e => setBasicInfo({...basicInfo, contact_phone: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-white/60 mb-2">Established</label>
                   <input type="number" value={basicInfo.established_year} onChange={e => setBasicInfo({...basicInfo, established_year: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="YYYY" />
                 </div>
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-6 text-xs">{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}</button></div>
           </form>
        </section>

        {/* ADDRESS */}
        <section className="glass-card p-8">
           <div className="flex items-center gap-2 text-blue-500 font-bold mb-6 border-b border-white/5 pb-4">
             <MapPin size={20} /> <h3 className="uppercase tracking-widest text-sm text-white">Location</h3>
           </div>

           <form onSubmit={handleAddressSave} className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-white/60 mb-2">Street Address</label>
                 <input type="text" value={address.address_line1} onChange={e => setAddress({...address, address_line1: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-white/60 mb-2">City</label>
                   <input type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-white/60 mb-2">State</label>
                   <input type="text" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                 </div>
              </div>
              <div className="w-1/2 pr-2">
                 <label className="block text-xs font-bold text-white/60 mb-2">PIN Code</label>
                 <input type="text" value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-6 text-xs bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.3)]">{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Update Location'}</button></div>
           </form>
        </section>

        {/* OPERATIONS & CAPACITY */}
        <section className="glass-card p-8 lg:col-span-2">
           <div className="flex items-center gap-2 text-emerald-500 font-bold mb-6 border-b border-white/5 pb-4">
             <Settings size={20} /> <h3 className="uppercase tracking-widest text-sm text-white">Operations & Capacity</h3>
           </div>
           
           <form onSubmit={handleCapacitySave} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <label className="block font-bold mb-1">Maximum Capacity</label>
                <p className="text-xs text-white/40 mb-4">Set the absolute maximum number of members allowed in the facility at once.</p>
                <input required type="number" min="1" value={capacity.max_capacity} onChange={e => setCapacity({...capacity, max_capacity: e.target.value})} className="w-full max-w-[200px] bg-black border border-white/20 rounded-xl p-3 text-white text-xl font-bold font-mono focus:border-emerald-500 outline-none" />
             </div>
             
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                   <label className="block font-bold mb-1">24/7 Operations</label>
                   <p className="text-xs text-white/40 mb-4">Toggle if your gym is open 24 hours a day, 7 days a week. This overrides manual schedule settings.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={capacity.is_24_hours} onChange={e => setCapacity({...capacity, is_24_hours: e.target.checked})} className="w-6 h-6 accent-emerald-500 cursor-pointer" />
                  <span className="font-bold text-emerald-400">Yes, Gym is 24/7</span>
                </label>
             </div>

             <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-8 bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(5,150,105,0.3)] text-sm">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Operational Changes'}</button>
             </div>
           </form>
        </section>

      </div>
    </div>
  );
};

export default SettingsTab;
