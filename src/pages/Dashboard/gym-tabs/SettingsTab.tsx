import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Settings, MapPin, Building, Loader2, Image as ImageIcon, Map as MapIcon } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';
import MapPickerModal from '../../../components/MapPickerModal';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const SettingsTab = () => {
  const { gym, refetch, gymId } = useGym();
  const { showNotification } = useNotification();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Forms states
  const [basicInfo, setBasicInfo] = useState({
    name: gym?.gym?.name || '',
    description: gym?.gym?.description || '',
    established_year: gym?.gym?.established_year || '',
    contact_phone: gym?.gym?.contact_phone?.replace(/^\+91/, '') || '',
    contact_email: gym?.gym?.contact_email || '',
    website_url: gym?.gym?.website_url || ''
  });

  const primaryAddress = gym?.addresses?.find((a: any) => a.is_primary) || {};
  const [address, setAddress] = useState({
    address_line1: primaryAddress.address_line1 || '',
    address_line2: primaryAddress.address_line2 || '',
    city: primaryAddress.city || gym?.gym?.city || '',
    state: primaryAddress.state || gym?.gym?.state || '',
    pincode: primaryAddress.pincode || '',
    latitude: primaryAddress.latitude || undefined,
    longitude: primaryAddress.longitude || undefined
  });

  const [capacity, setCapacity] = useState({
    max_capacity: gym?.gym?.max_capacity || '',
    is_24_hours: gym?.gym?.is_24_hours || false
  });

  const [media, setMedia] = useState({
    logo_url: gym?.gym?.logo_url || '',
    cover_image_url: gym?.gym?.cover_image_url || ''
  });


  const handleBasicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...basicInfo,
        contact_phone: `+91${basicInfo.contact_phone.replace(/^\+91/, '')}`
      };
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/basic-info`, payload);
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

  const handleMediaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/gym-owner/gyms/${gymId}/media`, media);
      await refetch();
      showNotification('Gym media updated', 'success');
    } catch (err: any) { 
      console.error(err);
      showNotification('Failed to update media', 'error');
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
             <Building size={20} /> <h3 className="uppercase tracking-widest text-sm text-white">Basic Info</h3>
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
                   <div className="relative flex items-center">
                     <span className="absolute left-3 text-white/40 font-bold text-xs border-r border-white/10 pr-2">+91</span>
                     <input 
                       type="tel" 
                       value={basicInfo.contact_phone} 
                       onChange={e => setBasicInfo({...basicInfo, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                       maxLength={10}
                       className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-12 text-white focus:border-primary outline-none transition-all" 
                       placeholder="10-digit number"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-white/60 mb-2">Established</label>
                   <input type="number" value={basicInfo.established_year} onChange={e => setBasicInfo({...basicInfo, established_year: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="YYYY" />
                 </div>
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-6 text-xs">{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}</button></div>
           </form>
        </section>

        {/* GYM MEDIA */}
        <section className="glass-card p-8">
           <div className="flex items-center gap-2 text-primary font-bold mb-6 border-b border-white/5 pb-4">
             <ImageIcon size={20} /> <h3 className="uppercase tracking-widest text-sm text-white">Gym Media</h3>
           </div>
           
           <form onSubmit={handleMediaSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <ImageUpload 
                   label="Gym Logo"
                   initialUrl={media.logo_url}
                   onUploadComplete={(url) => setMedia({...media, logo_url: url})}
                   aspectRatio="square"
                 />
                 <ImageUpload 
                   label="Cover Image"
                   initialUrl={media.cover_image_url}
                   onUploadComplete={(url) => setMedia({...media, cover_image_url: url})}
                   aspectRatio="video"
                 />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-6 text-xs transition-all">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Update Branding'}
                </button>
              </div>
           </form>
        </section>

        {/* ADDRESS */}
        <section className="glass-card p-8">
           <div className="flex items-center gap-2 text-blue-500 font-bold mb-6 border-b border-white/5 pb-4">
             <MapPin size={20} /> <h3 className="uppercase tracking-widest text-sm text-white">Location</h3>
           </div>

           <form onSubmit={handleAddressSave} className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <MapIcon size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/40">Current Pin Location</span>
                      <span className="block text-sm font-bold text-white leading-tight">
                        {address.address_line1 || 'No location set yet'}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsMapOpen(true)}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20"
                  >
                    Open Map
                  </button>
                </div>

                {address.address_line1 && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div>
                      <span className="block text-[8px] font-bold text-white/20 uppercase mb-0.5">City & State</span>
                      <span className="text-[10px] font-bold text-white/60">{address.city}, {address.state}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-white/20 uppercase mb-0.5">Pincode</span>
                      <span className="text-[10px] font-bold text-blue-400">{address.pincode}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !address.address_line1} 
                  className="btn-primary py-3 px-8 text-xs bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Update Location'}
                </button>
              </div>
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

      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialCenter={address.latitude && address.longitude ? { lat: address.latitude, lng: address.longitude } : undefined}
        onConfirm={(result) => {
          setAddress({
            ...address,
            address_line1: result.address_line1,
            city: result.city,
            state: result.state,
            pincode: result.pincode,
            latitude: result.latitude,
            longitude: result.longitude
          });
          setIsMapOpen(false);
        }}
      />
    </div>
  );
};

export default SettingsTab;
