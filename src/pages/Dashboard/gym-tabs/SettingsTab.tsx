import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Settings, MapPin, Building, Loader2, Image as ImageIcon, Map as MapIcon } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';
import MapPickerModal from '../../../components/MapPickerModal';
import api, { getApiErrorMessage } from '../../../utils/api';
import { useNotification } from '../../../context/NotificationContext';
import { getGoogleMapsUrl } from '../../../utils/navigation';

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
    is_24_hours: gym?.gym?.is_24_hours || false,
    show_stats: gym?.gym?.show_stats ?? true
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
      await api.patch(`/gym-owner/gyms/${gymId}/basic-info`, payload);
      await refetch();
      showNotification('Basic info updated successfully', 'success');
    } catch (err: unknown) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (primaryAddress.id) {
        await api.patch(`/gym-owner/gyms/${gymId}/addresses/${primaryAddress.id}`, address);
      } else {
        await api.post(`/gym-owner/gyms/${gymId}/addresses`, { ...address, is_primary: true });
      }
      await refetch();
      showNotification('Location updated', 'success');
    } catch (err: unknown) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleCapacitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/gym-owner/gyms/${gymId}/capacity`, capacity);
      await refetch();
      showNotification('Operations updated', 'success');
    } catch (err: unknown) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleMediaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/gym-owner/gyms/${gymId}/media`, media);
      await refetch();
      showNotification('Gym media updated', 'success');
    } catch (err: unknown) {
      console.error(err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-12 pb-12">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
           <Settings className="text-accent-text" size={32} /> GYM SETTINGS
         </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BASIC INFO */}
        <section className="bg-surface border border-border rounded-gm-xl shadow-card p-8">
           <div className="flex items-center gap-2 text-accent-text font-bold mb-6 border-b border-border pb-4">
             <Building size={20} /> <h3 className="uppercase tracking-widest text-sm text-ink">Basic Info</h3>
           </div>
           
           <form onSubmit={handleBasicSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Gym Name</label>
                <input required type="text" value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Description</label>
                <textarea rows={4} value={basicInfo.description} onChange={e => setBasicInfo({...basicInfo, description: e.target.value})} className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-ink focus:border-accent outline-none custom-scrollbar" placeholder="Tell members what makes your gym special..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-ink-muted mb-2">Contact Phone</label>
                   <div className="relative flex items-center">
                     <span className="absolute left-3 text-ink-muted font-bold text-xs border-r border-border pr-2">+91</span>
                     <input 
                       type="tel" 
                       value={basicInfo.contact_phone} 
                       onChange={e => setBasicInfo({...basicInfo, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                       maxLength={10}
                       className="w-full bg-surface-sunken border border-border rounded-xl p-3 pl-12 text-ink focus:border-accent outline-none transition-all" 
                       placeholder="10-digit number"
                     />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-ink-muted mb-2">Established</label>
                   <input type="number" value={basicInfo.established_year} onChange={e => setBasicInfo({...basicInfo, established_year: e.target.value})} className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-ink focus:border-accent outline-none" placeholder="YYYY" />
                 </div>
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2 px-6 text-xs">{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}</button></div>
           </form>
        </section>

        {/* GYM MEDIA */}
        <section className="bg-surface border border-border rounded-gm-xl shadow-card p-8">
           <div className="flex items-center gap-2 text-accent-text font-bold mb-6 border-b border-border pb-4">
             <ImageIcon size={20} /> <h3 className="uppercase tracking-widest text-sm text-ink">Gym Media</h3>
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
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2 px-6 text-xs transition-all">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Update Branding'}
                </button>
              </div>
           </form>
        </section>

        {/* ADDRESS */}
        <section className="bg-surface border border-border rounded-gm-xl shadow-card p-8">
           <div className="flex items-center gap-2 text-info font-bold mb-6 border-b border-border pb-4">
             <MapPin size={20} /> <h3 className="uppercase tracking-widest text-sm text-ink">Location</h3>
           </div>

           <form onSubmit={handleAddressSave} className="space-y-6">
              <div className="bg-surface-raised border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-info-soft flex items-center justify-center text-info">
                      <MapIcon size={20} />
                    </div>
                    <a 
                      href={getGoogleMapsUrl(address.address_line1, address.latitude, address.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/addr"
                    >
                      <span className="block text-[10px] font-black uppercase tracking-widest text-ink-muted group-hover/addr:text-primary transition-colors">Current Pin Location</span>
                      <span className="block text-sm font-bold text-ink leading-tight group-hover/addr:text-primary group-hover/addr:underline underline-offset-2 transition-all">
                        {address.address_line1 || 'No location set yet'}
                      </span>
                    </a>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsMapOpen(true)}
                    className="px-4 py-2 bg-info-soft hover:bg-info text-info hover:text-on-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-info/30"
                  >
                    Open Map
                  </button>
                </div>

                {address.address_line1 && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <span className="block text-[8px] font-bold text-ink-subtle uppercase mb-0.5">City & State</span>
                      <span className="text-[10px] font-bold text-ink-muted">{address.city}, {address.state}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-ink-subtle uppercase mb-0.5">Pincode</span>
                      <span className="text-[10px] font-bold text-info">{address.pincode}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !address.address_line1} 
                  className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-3 px-8 text-xs bg-info hover:bg-info shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Update Location'}
                </button>
              </div>
           </form>
        </section>

        {/* OPERATIONS & CAPACITY */}
        <section className="bg-surface border border-border rounded-gm-xl shadow-card p-8 lg:col-span-2">
           <div className="flex items-center gap-2 text-success font-bold mb-6 border-b border-border pb-4">
             <Settings size={20} /> <h3 className="uppercase tracking-widest text-sm text-ink">Operations & Capacity</h3>
           </div>
           
           <form onSubmit={handleCapacitySave} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div className="bg-surface-raised p-6 rounded-2xl border border-border">
                <label className="block font-bold mb-1">Maximum Capacity</label>
                <p className="text-xs text-ink-muted mb-4">Set the absolute maximum number of members allowed in the facility at once.</p>
                <input required type="number" min="1" value={capacity.max_capacity} onChange={e => setCapacity({...capacity, max_capacity: e.target.value})} className="w-full max-w-[200px] bg-surface border border-border-strong rounded-xl p-3 text-ink text-xl font-bold font-mono focus:border-success outline-none" />
             </div>
             
             <div className="bg-surface-raised p-6 rounded-2xl border border-border flex flex-col justify-between">
                <div>
                   <label className="block font-bold mb-1">24/7 Operations</label>
                   <p className="text-xs text-ink-muted mb-4">Toggle if your gym is open 24 hours a day, 7 days a week.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={capacity.is_24_hours} onChange={e => setCapacity({...capacity, is_24_hours: e.target.checked})} className="w-6 h-6 accent-emerald-500 cursor-pointer" />
                  <span className="font-bold text-success">Yes, Gym is 24/7</span>
                </label>
             </div>

             <div className="bg-surface-raised p-6 rounded-2xl border border-border flex flex-col justify-between border-accent-border bg-accent-soft">
                <div>
                   <label className="block font-bold mb-1">Performance Stats</label>
                   <p className="text-xs text-ink-muted mb-4">Show or hide revenue and member count statistics on your dashboard.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={capacity.show_stats} onChange={e => setCapacity({...capacity, show_stats: e.target.checked})} className="w-6 h-6 accent-accent cursor-pointer" />
                  <span className="font-bold text-accent-text">Show Dashboard Stats</span>
                </label>
             </div>

             <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-gm-lg bg-accent px-5 py-3 font-semibold text-on-accent transition-colors hover:bg-accent-pressed disabled:opacity-50 py-2 px-8 bg-success hover:bg-success shadow-[0_0_15px_rgba(5,150,105,0.3)] text-sm">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Operational Changes'}</button>
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
