import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Phone, MapPin, Save, Plus, Trash2, Shield, Mail, Calendar, UserCircle } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import { useNotification } from '../../context/NotificationContext';
import MapPickerModal from '../../components/MapPickerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { showNotification } = useNotification();

  const fetchProfileData = async () => {
    try {
      const [profRes, addrRes] = await Promise.all([
        axios.get(`${API_URL}/profile/me`),
        axios.get(`${API_URL}/profile/me/addresses`),
      ]);
      setProfile(profRes.data.data);
      setAddresses(addrRes.data.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (section: string, e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection(section);
    try {
      // Ensure date_of_birth is in YYYY-MM-DD format if present
      const payload = {
         ...profile,
         date_of_birth: profile.date_of_birth || null,
         gender: profile.gender || null,
      };
      await axios.patch(`${API_URL}/profile/me`, payload);
      await refreshUser();
      showNotification(`${section} updated successfully`, 'success');
    } catch (err: any) {
      console.error('Update failed:', err);
      showNotification(err.response?.data?.error?.message || `Failed to update ${section}`, 'error');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) return <div className="animate-pulse glass-card p-12 h-96" />;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-5xl font-display font-black tracking-tighter">PROFILE</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-display uppercase tracking-widest">
          <Shield size={14} /> {user?.active_role} Account
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {/* Personal Details */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={(e) => handleUpdateProfile('Basic Details', e)} className="glass-card p-10 space-y-8">
            <div className="flex items-center gap-8">
              <ImageUpload 
                initialUrl={profile?.avatar_url}
                onUploadComplete={(url) => setProfile({...profile, avatar_url: url})}
                className="w-32 md:w-48 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-2xl font-black italic tracking-tight">{profile?.full_name || 'SET YOUR NAME'}</h3>
                <p className="text-white/40 text-sm flex items-center gap-2 font-medium">
                  <Phone size={14} className="text-primary" /> {user?.phone}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    value={profile?.full_name || ''} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    value={profile?.email || ''} 
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Date of Birth</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="date" 
                    value={profile?.date_of_birth || ''} 
                    onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-white/80"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Gender</label>
                <select 
                  value={profile?.gender || ''} 
                  onChange={(e) => setProfile({...profile, gender: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-black">Select Gender</option>
                  <option value="male" className="bg-black">Male</option>
                  <option value="female" className="bg-black">Female</option>
                  <option value="other" className="bg-black">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">City Location</label>
                <div 
                  onClick={() => setIsMapOpen(true)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl py-3 px-4 hover:border-primary transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="text-white/20 group-hover:text-primary transition-colors" size={18} />
                    <span className={profile?.city ? "text-white" : "text-white/20"}>
                      {profile?.city || 'Pick location on Map'}
                    </span>
                  </div>
                  <div className="text-primary text-[10px] uppercase font-bold tracking-widest bg-primary/10 px-2 py-1 rounded">
                    Change
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={savingSection === 'Basic Details'} className="btn-primary w-fit min-w-[200px] flex items-center justify-center gap-3">
              {savingSection === 'Basic Details' ? 'SAVING...' : <><Save size={18} /> Update Basic Details</>}
            </button>
          </form>

          <form onSubmit={(e) => handleUpdateProfile('Profile Bio', e)} className="glass-card p-10 space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Profile Bio</label>
              <textarea 
                rows={3}
                placeholder="Tell us about yourself..."
                value={profile?.bio || ''} 
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all placeholder:text-white/20 custom-scrollbar"
              />
            </div>

            <button type="submit" disabled={savingSection === 'Profile Bio'} className="btn-primary w-fit min-w-[200px] flex items-center justify-center gap-3">
              {savingSection === 'Profile Bio' ? 'SAVING...' : <><Save size={18} /> Save Bio</>}
            </button>
          </form>

          {/* Addresses */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase tracking-widest font-display">Your Addresses</h3>
              <button className="flex items-center gap-2 text-primary text-xs font-bold px-4 py-2 hover:bg-primary/10 rounded-full transition-all">
                <Plus size={16} /> Add New
              </button>
            </div>
            <div className="grid gap-4">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="glass-card p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 group-hover:text-primary transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest">{addr.label || 'Address'}</h4>
                      <p className="text-white/40 text-sm">{addr.city}, {addr.state}</p>
                    </div>
                  </div>
                  <button className="text-white/20 hover:text-red-400 p-2 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {addresses.length === 0 && <div className="glass-card p-12 text-center text-white/20 italic">No addresses saved.</div>}
            </div>
          </div>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-8 bg-primary/5 border-primary/10 space-y-6">
            <h3 className="font-bold uppercase tracking-widest font-display text-sm">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/40 text-sm">Verified</span>
                <span className="text-emerald-500 font-bold text-xs uppercase tracking-tighter">YES</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-white/40 text-sm">Joined</span>
                <span className="text-white/60 font-bold text-xs uppercase tracking-tighter">
                  {new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="pt-4">
              <p className="text-[10px] text-white/20 italic leading-relaxed text-center">
                Your account is managed by Zenrevo authentication systems. 
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Picker Modal */}
      <MapPickerModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(location) => {
          setProfile({ ...profile, city: location.city });
          setIsMapOpen(false);
        }}
      />
    </div>
  );
};

export default Profile;
