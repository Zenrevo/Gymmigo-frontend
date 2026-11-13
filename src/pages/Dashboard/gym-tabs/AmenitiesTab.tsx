import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Wifi, Plus, X, Search } from 'lucide-react';
import api from '../../../utils/api';

// Some predefined icons mapped to amenity names
const PRESETS = [
  'Air Conditioning', 'Free WiFi', 'Parking', 'Locker Room', 
  'Showers', 'Cafe / Juice Bar', 'Fingerprint Access', 'CCTV Security',
  'Water Cooler', 'Towels Provided', 'Steam Room', 'Changing Room'
];

const AmenitiesTab = () => {
  const { gym, refetch, gymId } = useGym();
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out presets that the gym already has
  const availablePresets = PRESETS.filter(p => !gym?.amenities?.some((a: any) => a.name.toLowerCase() === p.toLowerCase()));

  const addAmenity = async (name: string) => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/gym-owner/gyms/${gymId}/amenities`, { name: name.trim() });
      await refetch();
      if (name === customName) setCustomName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAmenity = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/gym-owner/gyms/${gymId}/amenities/${id}`);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight flex items-center gap-3">
             <Wifi className="text-accent-text" size={32} /> AMENITIES
          </h2>
          <p className="text-ink-muted text-sm">Add perks and conveniences available to all members.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-6">Active Amenities</h3>
        
        {gym?.amenities?.length > 0 ? (
          <div className="flex flex-wrap gap-3">
             {gym.amenities.map((amenity: any) => (
               <div key={amenity.id} className="flex items-center gap-2 pl-4 pr-1 py-1 bg-accent-soft border border-accent-border rounded-full text-accent-text group">
                 <span className="font-bold text-sm tracking-wide">{amenity.name}</span>
                 <button 
                  onClick={(e) => removeAmenity(amenity.id, amenity.name, e)}
                  disabled={isSubmitting}
                  className="p-1 rounded-full hover:bg-accent-soft text-accent-text hover:text-accent-text transition-colors disabled:opacity-50"
                 >
                   <X size={14} />
                 </button>
               </div>
             ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border rounded-xl text-center text-ink-muted text-sm">
            No amenities added yet. Select from presets below or add a custom one.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custom Add */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Add Custom</h3>
           <form onSubmit={(e) => { e.preventDefault(); addAmenity(customName); }} className="relative">
             <input 
               type="text" 
               value={customName}
               onChange={e => setCustomName(e.target.value)}
               placeholder="e.g. DJ Sound System"
               className="w-full bg-surface-sunken border border-border rounded-xl py-4 pl-5 pr-32 text-ink focus:border-accent outline-none transition-colors"
             />
             <button 
               type="submit" 
               disabled={!customName.trim() || isSubmitting}
               className="absolute right-2 top-2 bottom-2 bg-surface-raised hover:bg-surface-sunken text-ink font-bold text-xs uppercase tracking-widest px-4 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
             >
               Add <Plus size={14} />
             </button>
           </form>
        </div>

        {/* Presets */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
             <Search size={14} /> Quick Suggestions
           </h3>
           <div className="flex flex-wrap gap-2">
             {availablePresets.map(preset => (
               <button
                 key={preset}
                 onClick={() => addAmenity(preset)}
                 disabled={isSubmitting}
                 className="px-4 py-2 bg-surface-raised border border-border hover:border-border-strong rounded-full text-xs font-bold text-ink-muted hover:text-ink transition-all disabled:opacity-50"
               >
                 + {preset}
               </button>
             ))}
             {availablePresets.length === 0 && (
               <p className="text-xs text-ink-subtle ">All presets used.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AmenitiesTab;
