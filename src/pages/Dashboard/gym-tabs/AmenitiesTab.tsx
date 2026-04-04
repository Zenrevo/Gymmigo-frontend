import { useState } from 'react';
import { useGym } from '../../../context/GymContext';
import { Wifi, Plus, X, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
      await axios.post(`${API_URL}/gym-owner/gyms/${gymId}/amenities`, { name: name.trim() });
      await refetch();
      if (name === customName) setCustomName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAmenity = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/gym-owner/gyms/${gymId}/amenities/${id}`);
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
          <h2 className="text-3xl font-display font-black tracking-tight italic flex items-center gap-3">
             <Wifi className="text-primary" size={32} /> AMENITIES
          </h2>
          <p className="text-white/40 text-sm">Add perks and conveniences available to all members.</p>
        </div>
      </div>

      <div className="glass-card p-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Active Amenities</h3>
        
        {gym?.amenities?.length > 0 ? (
          <div className="flex flex-wrap gap-3">
             {gym.amenities.map((amenity: any) => (
               <div key={amenity.id} className="flex items-center gap-2 pl-4 pr-1 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary group">
                 <span className="font-bold text-sm tracking-wide">{amenity.name}</span>
                 <button 
                  onClick={(e) => removeAmenity(amenity.id, e)}
                  disabled={isSubmitting}
                  className="p-1 rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary transition-colors disabled:opacity-50"
                 >
                   <X size={14} />
                 </button>
               </div>
             ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-white/40 text-sm">
            No amenities added yet. Select from presets below or add a custom one.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custom Add */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Add Custom</h3>
           <form onSubmit={(e) => { e.preventDefault(); addAmenity(customName); }} className="relative">
             <input 
               type="text" 
               value={customName}
               onChange={e => setCustomName(e.target.value)}
               placeholder="e.g. DJ Sound System"
               className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-5 pr-32 text-white focus:border-primary outline-none transition-colors"
             />
             <button 
               type="submit" 
               disabled={!customName.trim() || isSubmitting}
               className="absolute right-2 top-2 bottom-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest px-4 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
             >
               Add <Plus size={14} />
             </button>
           </form>
        </div>

        {/* Presets */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
             <Search size={14} /> Quick Suggestions
           </h3>
           <div className="flex flex-wrap gap-2">
             {availablePresets.map(preset => (
               <button
                 key={preset}
                 onClick={() => addAmenity(preset)}
                 disabled={isSubmitting}
                 className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/20 rounded-full text-xs font-bold text-white/60 hover:text-white transition-all disabled:opacity-50"
               >
                 + {preset}
               </button>
             ))}
             {availablePresets.length === 0 && (
               <p className="text-xs text-white/20 italic">All presets used.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AmenitiesTab;
