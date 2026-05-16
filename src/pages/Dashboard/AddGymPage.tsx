import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../utils/api';
import { 
  Building2, ArrowLeft, ArrowRight, Check, 
  MapPin, Phone, Mail, Info,
  Loader2, Plus, Trash2, Shield, 
  Wifi, Zap, Wind, Coffee, Car, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapPickerModal from '../../components/MapPickerModal';

const PRESET_AMENITIES = [
  { id: 'wifi', name: 'Free WiFi', icon: Wifi },
  { id: 'ac', name: 'Air Conditioning', icon: Wind },
  { id: 'parking', name: 'Parking space', icon: Car },
  { id: 'cafe', name: 'Cafe / Juice Bar', icon: Coffee },
  { id: 'lockers', name: 'Lockers', icon: Lock },
  { id: 'showers', name: 'Showers', icon: Zap },
];

const EQUIPMENT_CATEGORIES = ["cardio", "strength", "free_weights", "functional", "stretching", "other"];

const AddGymPage = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    established_year: '',
    contact_phone: '',
    contact_email: '',
    website_url: '',
    max_capacity: '',
    city: '',
    state: '',
    pincode: '',
    address_line1: '',
    address_line2: '',
    is_24_hours: false,
    contact_person_name: '',
    amenities: [] as string[],
    facilities: [] as { name: string; description: string; is_included: boolean; quantity: number }[],
    equipment: [] as { name: string; brand: string; quantity: number; category: string }[],
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [isMapOpen, setIsMapOpen] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleAmenity = (name: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name) 
        ? prev.amenities.filter(a => a !== name) 
        : [...prev.amenities, name]
    }));
  };

  const addFacility = () => {
    setFormData(prev => ({
      ...prev,
      facilities: [...prev.facilities, { name: '', description: '', is_included: true, quantity: 1 }]
    }));
  };

  const removeFacility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
  };

  const updateFacility = (index: number, field: string, value: any) => {
    const newFacilities = [...formData.facilities];
    newFacilities[index] = { ...newFacilities[index], [field]: value };
    setFormData({ ...formData, facilities: newFacilities });
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipment: [...prev.equipment, { name: '', brand: '', quantity: 1, category: 'cardio' }]
    }));
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const updateEquipment = (index: number, field: string, value: any) => {
    const newEquipment = [...formData.equipment];
    newEquipment[index] = { ...newEquipment[index], [field]: value };
    setFormData({ ...formData, equipment: newEquipment });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        established_year: parseInt(formData.established_year) || undefined,
        contact_phone: formData.contact_phone.startsWith('+91') ? formData.contact_phone : `+91${formData.contact_phone}`,
        contact_email: formData.contact_email,
        website_url: formData.website_url || undefined,
        max_capacity: parseInt(formData.max_capacity) || undefined,
        city: formData.city,
        state: formData.state,
        is_24_hours: formData.is_24_hours,
        contact_person_name: formData.contact_person_name || undefined,
        addresses: [
          {
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || undefined,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            country: 'India',
            is_primary: true
          }
        ],
        amenities: formData.amenities.map(a => ({ name: a })),
        facilities: formData.facilities.filter(f => f.name),
        equipment: formData.equipment.filter(eq => eq.name)
      };

      await api.post(`/gym-owner/gyms`, payload);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: 'Core Info', icon: Info },
    { title: 'Location', icon: MapPin },
    { title: 'Amenities', icon: Shield },
    { title: 'Equipment', icon: Building2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <button 
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group self-start"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className={`flex items-center gap-2 ${step === i + 1 ? 'text-primary' : 'text-white/20'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step === i + 1 ? 'border-primary' : 'border-white/10'}`}>
                   {i + 1}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-white/5" />}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tighter italic text-primary">
          LIST YOUR GYM
        </h1>
        <p className="text-white/40 max-w-lg">
          Complete the steps below to create a high-quality listing that attracts its first members today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-card p-6 sm:p-10 space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Gym Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input 
                      type="text"
                      placeholder="e.g. Iron Paradise Gym"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-xl font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">About the Gym</label>
                  <textarea 
                    placeholder="Tell your future members what makes your gym special..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:border-primary outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Contact Person Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none"
                      value={formData.contact_person_name}
                      onChange={(e) => setFormData({...formData, contact_person_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Established Year</label>
                    <input 
                      type="number"
                      placeholder="2024"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none"
                      value={formData.established_year}
                      onChange={(e) => setFormData({...formData, established_year: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Contact Phone</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <Phone className="text-white/20" size={18} />
                        <span className="text-white/60 font-bold text-sm border-r border-white/10 pr-2">+91</span>
                      </div>
                      <input 
                        type="tel"
                        placeholder="10-digit number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-[5.5rem] pr-4 focus:border-primary outline-none transition-all"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="email"
                        placeholder="contact@gymname.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 focus:border-primary outline-none"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!formData.name || !formData.description || !formData.contact_phone}
                  className="btn-primary py-4 px-10 flex items-center gap-3 disabled:opacity-50"
                >
                  Next Step
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 sm:p-10 space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Gym Location</label>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <MapPin size={24} />
                      </div>
                      <div className="text-left space-y-1">
                        <span className={`block font-bold transition-colors ${formData.address_line1 ? 'text-white text-lg' : 'text-white/20'}`}>
                          {formData.address_line1 || 'Pin your gym location on map'}
                        </span>
                        {formData.address_line1 ? (
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black tracking-widest uppercase">Verified Location</span>
                             <span className="text-[10px] text-white/40">{formData.city}, {formData.pincode}</span>
                           </div>
                        ) : (
                           <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">100% Accurate Pincode Identification</span>
                        )}
                      </div>
                    </div>
                    <div className="btn-primary py-2 px-4 text-[10px] h-fit">
                      {formData.address_line1 ? 'CHANGE' : 'OPEN MAP'}
                    </div>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Max Capacity</label>
                    <input 
                      type="number"
                      placeholder="50"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({...formData, max_capacity: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                     <button
                      type="button"
                      onClick={() => setFormData({...formData, is_24_hours: !formData.is_24_hours})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_24_hours ? 'bg-primary' : 'bg-white/10'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_24_hours ? 'left-7' : 'left-1'}`} />
                     </button>
                     <span className="text-sm font-bold uppercase tracking-wider">OPEN 24 HOURS</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 py-8 rounded-b-3xl">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary py-4 px-10 flex items-center gap-3">
                  Amenities & Facilities <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="glass-card p-6 sm:p-10 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold italic tracking-tight">AMENITIES</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {PRESET_AMENITIES.map((amenity) => (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.name)}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          formData.amenities.includes(amenity.name)
                            ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                            : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                        }`}
                      >
                        <amenity.icon size={28} />
                        <span className="text-xs font-bold uppercase tracking-widest">{amenity.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold italic tracking-tight">FACILITIES</h3>
                    <button type="button" onClick={addFacility} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                      <Plus size={14} /> Add Facility
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.facilities.map((fac, idx) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="glass-card p-6 space-y-4 relative border-white/5 hover:border-white/10 transition-colors">
                        <button type="button" onClick={() => removeFacility(idx)} className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 size={18} />
                        </button>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Facility Name</label>
                            <input 
                              placeholder="e.g. Swimming Pool"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none"
                              value={fac.name}
                              onChange={(e) => updateFacility(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quantity</label>
                            <input 
                              type="number"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none"
                              value={fac.quantity}
                              onChange={(e) => updateFacility(idx, 'quantity', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Short Description</label>
                          <input 
                            placeholder="e.g. Olympic-sized 25m pool with 4 lanes"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none placeholder:text-white/10"
                            value={fac.description}
                            onChange={(e) => updateFacility(idx, 'description', e.target.value)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-8 rounded-3xl border border-white/5">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary py-4 px-12 flex items-center gap-3">
                  Step 4: Equipment <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="glass-card p-6 sm:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-black italic tracking-tighter">EQUIPMENT INVENTORY</h3>
                  <button type="button" onClick={addEquipment} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                    <Plus size={14} /> Add Equipment
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.equipment.map((eq, idx) => (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key={idx} className="glass-card p-6 grid sm:grid-cols-4 gap-4 relative">
                      <button type="button" onClick={() => removeEquipment(idx)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10">
                        <Trash2 size={14} />
                      </button>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Machine Name</label>
                        <input 
                          placeholder="e.g. Curved Treadmill"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none"
                          value={eq.name}
                          onChange={(e) => updateEquipment(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none"
                          value={eq.category}
                          onChange={(e) => updateEquipment(idx, 'category', e.target.value)}
                        >
                          {EQUIPMENT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-black">{cat.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quantity</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none"
                          value={eq.quantity}
                          onChange={(e) => updateEquipment(idx, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                    </motion.div>
                  ))}
                  {formData.equipment.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-white/10 italic">
                      No specific equipment records added yet.
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-4 rounded-2xl border border-red-500/20">{error}</p>}

              <div className="flex justify-between items-center bg-white/5 p-10 rounded-3xl border border-white/5">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest">
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary py-5 px-16 flex items-center gap-3 font-display italic text-lg"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <>
                      FINAL SUBMISSION
                      <Check size={24} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <MapPickerModal 
        isOpen={isMapOpen}
        initialCenter={formData.latitude !== undefined && formData.longitude !== undefined 
          ? { lat: formData.latitude, lng: formData.longitude } 
          : undefined}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(result) => {
          setFormData(prev => ({
            ...prev,
            address_line1: result.address_line1,
            city: result.city,
            state: result.state,
            pincode: result.pincode,
            latitude: result.latitude,
            longitude: result.longitude
          }));
          setIsMapOpen(false);
        }}
      />
    </div>
  );
};

export default AddGymPage;
