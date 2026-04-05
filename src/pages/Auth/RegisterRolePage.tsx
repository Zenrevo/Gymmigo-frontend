import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, Dumbbell, Building2, Check, ArrowRight, Loader2, Briefcase, FileText, Mail, UserCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../../components/BrandLogo';
import { clsx } from 'clsx';
import MapPickerModal from '../../components/MapPickerModal';
const roles = [
  {
    id: 'user',
    name: 'Member',
    description: 'Find gyms, book trainers, and track your fitness journey.',
    icon: User,
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    id: 'trainer',
    name: 'Trainer',
    description: 'Manage clients, schedules, and build your professional brand.',
    icon: Dumbbell,
    color: 'from-primary/20 to-orange-600/20',
    comingSoon: true,
  },
  {
    id: 'gym_owner',
    name: 'Gym Owner',
    description: 'List your gym, manage memberships, and grow your business.',
    icon: Building2,
    color: 'from-orange-500/20 to-orange-600/20',
  },
];

const RegisterRolePage = () => {
  const [step, setStep] = useState<'role' | 'profile'>('role');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [error, setError] = useState('');

  // Shared Profile Form States (Mandatory for all professional roles)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    business_name: '',
    gstin: '',
    pan_number: '',
    experience_years: '',
    specializations: '',
    // Address Fields (Primarily for Member onboarding)
    address_line1: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const { user, login, switchRole, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Handle map confirmation
  const handleMapConfirm = (result: any) => {
    setFormData(prev => ({
      ...prev,
      address_line1: result.address_line1,
      city: result.city,
      state: result.state,
      pincode: result.pincode,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
    setIsMapOpen(false);
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    // Check if user already has this role and if it's completed
    const existingRole = user?.roles?.find((r: any) => r.role === selectedRole);

    if (existingRole) {
      if (existingRole.is_completed) {
        setIsLoading(true);
        try {
          await switchRole(selectedRole);
          showNotification(`Switched to ${selectedRole} mode`, 'success');
          navigate('/app/dashboard');
        } catch (err) {
          setError('Failed to switch role.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setStep('profile');
      }
      return;
    }

    // Role selection registration
    setIsLoading(true);
    setError('');
    try {
      const endpoint = user?.roles?.length ? '/auth/add-role' : '/auth/register-role';
      const response = await axios.post(`${API_URL}${endpoint}`, { role: selectedRole });

      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        const { access_token, refresh_token } = tokens;
        login(access_token, refresh_token, userData);
        showNotification(`${selectedRole} registered!`, 'success');
        setStep('profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to set role.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let endpoint = '';
      let payload = {};

      if (selectedRole === 'user') {
        // 1. Update Personal Profile
        endpoint = '/profile/me';
        payload = {
          full_name: formData.full_name,
          email: formData.email,
          city: formData.city || undefined
        };
        await axios.patch(`${API_URL}${endpoint}`, payload);

        // 2. Create Address
        if (formData.address_line1) {
          const addressPayload = {
            address_line1: formData.address_line1,
            landmark: formData.landmark || undefined,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            country: 'India',
            label: 'home',
            is_primary: true
          };
          await axios.post(`${API_URL}/profile/me/addresses`, addressPayload);
        }
      } else if (selectedRole === 'trainer') {
        // Backend TrainerProfileCreate requires expertises list
        endpoint = '/trainer/profile/create';
        payload = {
          full_name: formData.full_name,
          bio: `Professional trainer with ${formData.experience_years} years experience.`,
          experience_years: parseInt(formData.experience_years) || 0,
          expertises: formData.specializations.split(',').map(s => s.trim()).filter(s => s)
        };
        await axios.post(`${API_URL}${endpoint}`, payload);
      } else if (selectedRole === 'gym_owner') {
        // Backend GymOwnerProfileCreate requires full_name and email
        endpoint = '/gym-owner/profile/create';
        payload = {
          full_name: formData.full_name,
          email: formData.email,
          business_name: formData.business_name,
          gstin: formData.gstin || undefined,
          pan_number: formData.pan_number || undefined
        };
        await axios.post(`${API_URL}${endpoint}`, payload);
      }

      // Refresh user to sync completed state
      await refreshUser();
      showNotification('Profile completed!', 'success');
      navigate('/app/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Verification failed. Please check required fields.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-12 py-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <BrandLogo size={80} className="mb-2 animate-float" />
            </div>
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">
              {step === 'role' ? 'Choose your path' : 'Complete your profile'}
            </h2>
            <p className="text-white/40">
              {step === 'role'
                ? 'Select the role that best fits your needs on Gymmigo.'
                : 'Tell us a bit more about you to get started.'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {roles.map((role, index) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => !role.comingSoon && setSelectedRole(role.id)}
                      disabled={role.comingSoon}
                      className={clsx(
                        "group relative text-left p-8 glass-card transition-all duration-500 overflow-hidden",
                        isSelected ? "border-primary ring-1 ring-primary" : "hover:border-white/20",
                        role.comingSoon && "opacity-60 cursor-not-allowed grayscale-[0.5]"
                      )}
                    >
                      <div className={clsx(
                        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
                        role.color,
                        isSelected || !role.comingSoon ? "opacity-10" : "opacity-0 group-hover:opacity-100"
                      )} />
                      
                      {role.comingSoon && (
                        <div className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-primary/30 z-20">
                          Coming Soon
                        </div>
                      )}

                      <div className="relative z-10 space-y-6">
                        <div className={clsx(
                          "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-500",
                          isSelected ? "text-primary bg-primary/10 border-primary" : "text-white/40 group-hover:text-white group-hover:border-primary/50",
                          !isSelected && !role.comingSoon && "group-hover:scale-110"
                        )}>
                          <role.icon size={28} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">{role.name}</h3>
                          <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && !role.comingSoon && (
                        <div className="absolute top-4 right-4 text-primary">
                          <Check size={24} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-6">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  disabled={!selectedRole || isLoading}
                  onClick={handleRoleSelection}
                  className="btn-primary bg-primary w-full max-w-sm py-5 flex items-center justify-center gap-3 font-display transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <>
                      Continue to Profile
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto glass-card p-8"
            >
              <form onSubmit={handleProfileSubmit} className="space-y-6">

                {/* ── SHARED FIELDS for ALL ROLES ── */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 ml-1">Full Name</label>
                    <div className="relative">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5 my-6" />

                {/* ── MEMBER SPECIFIC: ADDRESS SECTION ── */}
                {selectedRole === 'user' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                       <MapPin className="text-primary" size={18} />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Location Details</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Location Selection</label>
                      <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-4 px-4 hover:border-primary transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <MapPin size={20} />
                          </div>
                          <div className="text-left">
                            <span className={clsx("block text-sm font-bold", formData.address_line1 ? "text-white" : "text-white/20")}>
                              {formData.address_line1 || 'Pick your address on Map'}
                            </span>
                            {formData.address_line1 && (
                              <span className="text-[10px] text-primary font-black uppercase tracking-widest">Pin Dropped Correctly</span>
                            )}
                          </div>
                        </div>
                        <div className="text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-lg">
                          {formData.address_line1 ? 'Change' : 'Open Map'}
                        </div>
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">Landmark (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Near HDFC Bank"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all"
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">City</label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">State</label>
                        <input
                          type="text"
                          placeholder="Maharashtra"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">Pin Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="400001"
                          className={clsx(
                            "w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all",
                            formData.pincode && !/^[1-9][0-9]{5}$/.test(formData.pincode) && "border-red-500/50 focus:border-red-500"
                          )}
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                          required
                        />
                        {formData.pincode && !/^[1-9][0-9]{5}$/.test(formData.pincode) && (
                          <p className="text-[10px] text-red-400 mt-1 ml-1 uppercase font-bold tracking-tighter">Enter a valid 6-digit Indian pincode</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full h-px bg-white/5 my-6" />

                {/* ── ROLE SPECIFIC FIELDS ── */}
                {selectedRole === 'trainer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Years of Experience</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                          type="number"
                          placeholder="5"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
                          value={formData.experience_years}
                          onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Specializations (comma separated)</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                          type="text"
                          placeholder="weight_loss, muscle_gain, cardio"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
                          value={formData.specializations}
                          onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                          required
                        />
                        <p className="text-[10px] text-white/20 mt-1 ml-1 uppercase tracking-wider font-bold">
                          Options: yoga, crossfit, bodybuilding, cardio, strength...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'gym_owner' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 ml-1">Business Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                          type="text"
                          placeholder="Gymmigo Fitness Center"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">GSTIN (Optional)</label>
                        <input
                          type="text"
                          placeholder="22AAAAA0000A1Z5"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/60 ml-1">PAN Number</label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:border-primary outline-none transition-all"
                          value={formData.pan_number}
                          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('role')}
                    className="flex-1 px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-display transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] btn-primary bg-primary py-4 flex items-center justify-center gap-3 font-display transition-all"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        Complete Profile
                        <Check size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <MapPickerModal 
          isOpen={isMapOpen}
          initialCenter={formData.latitude !== undefined && formData.longitude !== undefined 
            ? { lat: formData.latitude, lng: formData.longitude } 
            : undefined}
          onClose={() => setIsMapOpen(false)}
          onConfirm={handleMapConfirm}
        />
      </div>
    </div>
  );
};

export default RegisterRolePage;
