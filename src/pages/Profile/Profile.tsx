import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import api, { getApiErrorMessage } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Phone,
  MapPin,
  Save,
  Plus,
  Trash2,
  Shield,
  Mail,
  Calendar,
  UserCircle,
  Sparkles,
  X,
  User,
  Dumbbell,
  Building2,
  ChevronRight,
  CheckCircle2,
  Flame,
  Trophy,
} from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import { useNotification } from '../../context/NotificationContext';
import MapPickerModal from '../../components/MapPickerModal';

// ─── AI Personalization Constants ─────────────────────────────────────────────
const DIET_OPTIONS = [
  { key: 'veg', label: '🥦 Veg' },
  { key: 'non_veg', label: '🍗 Non-Veg' },
  { key: 'eggetarian', label: '🥚 Eggetarian' },
  { key: 'vegan', label: '🌱 Vegan' },
];

const GOAL_OPTIONS = [
  { key: 'weight_loss', label: 'Weight Loss' },
  { key: 'muscle_gain', label: 'Muscle Gain' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'flexibility', label: 'Flexibility' },
  { key: 'general_fitness', label: 'General Fitness' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'lightly_active', label: 'Lightly Active' },
  { key: 'moderately_active', label: 'Moderately Active' },
  { key: 'very_active', label: 'Very Active' },
  { key: 'extra_active', label: 'Extra Active' },
];

const EXPERIENCE_OPTIONS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

const ALLERGY_PRESETS = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Shellfish', 'Eggs'];
const INJURY_PRESETS = ['Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Ankle', 'Neck', 'Hip'];
const CONDITION_PRESETS = ['Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Asthma', 'Heart Condition'];
const DURATION_OPTIONS = [30, 45, 60, 90];
const DAYS_OPTIONS = [3, 4, 5, 6];

type SelectorOption = {
  key: string;
  label: string;
};

type AccountRole = {
  role: string;
  is_completed?: boolean;
};

type MemberProfile = {
  avatar_url?: string;
  full_name?: string;
  email?: string;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string;
  bio?: string;
  [key: string]: string | number | boolean | null | undefined;
};

type FitnessProfile = {
  primary_goal: string | null;
  activity_level: string | null;
  experience_level: string | null;
  height: number | null;
  current_weight: number | null;
  target_weight: number | null;
  dietary_preference: string | null;
  food_allergies: string[];
  injuries: string[];
  medical_conditions: string[];
  preferred_workout_duration: number | null;
  workout_days_per_week: number | null;
  notes_for_agent: string;
  [key: string]: string | number | string[] | null;
};

type AddressEntry = {
  id: string;
  label?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_primary?: boolean;
};

const ROLE_META = {
  user: {
    label: 'Member',
    description: 'Book gyms, follow plans, and build your FitCard progress.',
    icon: User,
    accent: 'border-blue-400/20 bg-blue-500/10 text-blue-300',
  },
  trainer: {
    label: 'Trainer',
    description: 'Coach members, manage sessions, and grow your training brand.',
    icon: Dumbbell,
    accent: 'border-orange-400/20 bg-orange-500/10 text-orange-300',
  },
  gym_owner: {
    label: 'Gym Owner',
    description: 'List gyms, manage members, and customize Gymmigo Clubs.',
    icon: Building2,
    accent: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  },
  gym_manager: {
    label: 'Gym Manager',
    description: 'Operate assigned gyms and manage day-to-day workflows.',
    icon: Shield,
    accent: 'border-purple-400/20 bg-purple-500/10 text-purple-300',
  },
};

const ADDABLE_ROLES = [
  {
    role: 'user',
    label: 'Add Member',
    description: 'Use the app as a gym member with plans, memberships, and clubs.',
    icon: User,
  },
  {
    role: 'gym_owner',
    label: 'Add Gym Owner',
    description: 'Create your owner profile and list or manage your gym.',
    icon: Building2,
  },
  {
    role: 'trainer',
    label: 'Add Trainer',
    description: 'Trainer onboarding is being prepared.',
    icon: Dumbbell,
    comingSoon: true,
  },
];


// ─── Sub-Components ───────────────────────────────────────────────────────────
const PillSelector = ({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: SelectorOption[];
  selected?: string | string[] | null;
  onSelect: (key: string) => void;
  multi?: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isActive = multi
        ? (Array.isArray(selected) ? selected : []).includes(opt.key)
        : selected === opt.key;
      return (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
            isActive 
              ? "bg-primary/20 border-primary text-primary" 
              : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const NumberPillSelector = ({
  options,
  selected,
  onSelect,
  suffix = '',
}: {
  options: number[];
  selected?: number | null;
  onSelect: (value: number) => void;
  suffix?: string;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((value) => {
      const isActive = selected === value;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap",
            isActive
              ? "bg-primary/20 border-primary text-primary"
              : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
          )}
        >
          {value}{suffix}
        </button>
      );
    })}
  </div>
);

const ChipMultiSelect = ({
  presets,
  selected,
  onChange,
  placeholder,
}: {
  presets: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) => {
  const [customText, setCustomText] = useState('');
  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter((s: string) => s !== item));
    else onChange([...selected, item]);
  };
  const addCustom = () => {
    if (customText.trim() && !selected.includes(customText.trim())) {
      onChange([...selected, customText.trim()]);
      setCustomText('');
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p: string) => (
          <button
            key={p} type="button" onClick={() => toggle(p)}
            className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
              selected.includes(p) ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-white/20")}>
            {p} {selected.includes(p) && <X size={10} />}
          </button>
        ))}
        {selected.filter((s) => !presets.includes(s)).map((s) => (
          <button
            key={s} type="button" onClick={() => toggle(s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border bg-primary/10 border-primary text-primary">
            {s} <X size={10} />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" value={customText} onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder={placeholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/50 transition-colors"
        />
        <button type="button" onClick={addCustom} className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary hover:bg-white/10">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, refreshUser, switchRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapIntent, setMapIntent] = useState<'profile_city' | 'address'>('profile_city');
  const [switchingRole, setSwitchingRole] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [clubSummary, setClubSummary] = useState<any>(null);
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile>({
    primary_goal: null,
    activity_level: null,
    experience_level: null,
    height: null,
    current_weight: null,
    target_weight: null,
    dietary_preference: null,
    food_allergies: [],
    injuries: [],
    medical_conditions: [],
    preferred_workout_duration: null,
    workout_days_per_week: null,
    notes_for_agent: '',
  });
  const { showNotification } = useNotification();
  const userRoles = (user?.roles || []) as AccountRole[];
  const ownedRoleIds = new Set(userRoles.map((role) => role.role));
  const addableRoles = ADDABLE_ROLES.filter(role => !ownedRoleIds.has(role.role));

  const fetchProfileData = useCallback(async () => {
    try {
      const [profRes, addrRes, fitRes, statsRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/profile/me/addresses'),
        api.get('/profile/fitness'),
        api.get('/memberships/dashboard-stats').catch(() => ({ data: { data: null } })),
      ]);
      setProfile(profRes.data.data);
      setAddresses(addrRes.data.data);
      if (fitRes.data?.data) {
        setFitnessProfile((prev) => ({ ...prev, ...fitRes.data.data }));
      }
      setDashboardStats(statsRes.data?.data || null);

      if (user?.active_role === 'user') {
        try {
          const membershipsRes = await api.get('/memberships/my');
          const activeMembership = (membershipsRes.data?.data?.memberships || [])
            .find((membership: any) => membership.status === 'active');
          if (activeMembership?.gym_id) {
            const fitcardRes = await api.get(`/clubs/fitcard/me?gym_id=${activeMembership.gym_id}`);
            setClubSummary(fitcardRes.data?.data || null);
          } else {
            setClubSummary(null);
          }
        } catch {
          setClubSummary(null);
        }
      } else {
        setClubSummary(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification, user?.active_role]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleUpdateFitnessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('AI Personalization');
    try {
      const payload: Record<string, unknown> = {};
      const fields = [
        'primary_goal', 'activity_level', 'experience_level',
        'height', 'current_weight', 'target_weight',
        'dietary_preference', 'food_allergies', 'injuries',
        'medical_conditions', 'preferred_workout_duration', 'workout_days_per_week',
        'notes_for_agent',
      ];
      fields.forEach((f) => {
        const val = fitnessProfile[f];
        if (val !== null && val !== undefined) {
          payload[f] = val;
        }
      });
      await api.post('/profile/fitness', payload);
      showNotification('AI preferences saved!', 'success');
    } catch (err: unknown) {
      console.error('Update failed:', err);
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const handleUpdateProfile = async (section: string, e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection(section);
    try {
      // Ensure date_of_birth is in YYYY-MM-DD format if present
      const payload = {
         ...(profile || {}),
         date_of_birth: profile?.date_of_birth || null,
         gender: profile?.gender || null,
      };
      await api.patch('/profile/me', payload);
      await refreshUser();
      showNotification(`${section} updated successfully`, 'success');
    } catch (err: unknown) {
      console.error('Update failed:', err);
      showNotification(getApiErrorMessage(err) || `Failed to update ${section}`, 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSwitchRole = async (role: string) => {
    if (role === user?.active_role || switchingRole) return;
    const isTrainer = role === 'trainer';
    if (isTrainer) {
      showNotification('Trainer switching is coming soon on web.', 'error');
      return;
    }

    setSwitchingRole(role);
    try {
      await switchRole(role);
      showNotification(`Switched to ${ROLE_META[role as keyof typeof ROLE_META]?.label || role}`, 'success');
      navigate('/app/dashboard');
    } catch (err) {
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setSwitchingRole('');
    }
  };

  const handleMapConfirm = async (location: {
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
  }) => {
    if (mapIntent === 'address') {
      setSavingSection('Address');
      try {
        await api.post('/profile/me/addresses', {
          label: addresses.length ? 'Saved location' : 'Home',
          address_line1: location.address_line1,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
          latitude: location.latitude,
          longitude: location.longitude,
          is_primary: addresses.length === 0,
          country: 'India',
        });
        showNotification('Address added', 'success');
        await fetchProfileData();
      } catch (err) {
        showNotification(getApiErrorMessage(err), 'error');
      } finally {
        setSavingSection(null);
        setIsMapOpen(false);
      }
      return;
    }

    setProfile({ ...(profile || {}), city: location.city });
    setIsMapOpen(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this saved address?')) return;
    setSavingSection(`delete-address-${addressId}`);
    try {
      await api.delete(`/profile/me/addresses/${addressId}`);
      setAddresses((items) => items.filter((address) => address.id !== addressId));
      showNotification('Address deleted', 'success');
    } catch (err) {
      showNotification(getApiErrorMessage(err), 'error');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) return <div className="animate-pulse glass-card p-12 h-96" />;

  const clubStreak = clubSummary?.fitcard?.current_streak || dashboardStats?.streak || 0;
  const clubCount = clubSummary?.clubs?.length || 0;
  const badgeCount = clubSummary?.badges?.length || 0;
  const fitcardPoints = clubSummary?.fitcard?.total_points || dashboardStats?.competition?.total_points || 0;
  const fitcardTitle = clubSummary?.clubs?.[0]?.name || clubSummary?.fitcard?.title || 'FitCard starter club';

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 md:space-y-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter">PROFILE</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-display uppercase tracking-widest">
          <Shield size={14} /> {user?.active_role} Account
        </div>
      </div>

      {user?.active_role === 'user' && (dashboardStats || clubSummary) && (
        <Link
          to="/app/clubs"
          className="group block rounded-2xl border border-primary/20 bg-primary/[0.07] p-5 sm:p-6 transition-all hover:border-primary/40 hover:bg-primary/10"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-primary">
                <Trophy size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">Gymmigo Clubs</h2>
                  {clubStreak > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase text-amber-300">
                      <Flame size={12} fill="currentColor" /> {clubStreak}D Streak
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-white/48">{fitcardTitle}</p>
                <p className="mt-3 max-w-2xl text-xs font-medium leading-5 text-white/45">
                  Your profile now carries the same Clubs, FitCard, badges, and real gym benefits shown in the mobile app.
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="hidden text-primary transition-transform group-hover:translate-x-1 sm:block" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-300/10 bg-slate-950/20 p-4">
              <p className="text-2xl font-black text-white">{clubCount}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">Clubs</p>
            </div>
            <div className="rounded-xl border border-slate-300/10 bg-slate-950/20 p-4">
              <p className="text-2xl font-black text-primary">{badgeCount}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">Badges</p>
            </div>
            <div className="rounded-xl border border-slate-300/10 bg-slate-950/20 p-4">
              <p className="text-2xl font-black text-emerald-400">{fitcardPoints}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">Points</p>
            </div>
          </div>
        </Link>
      )}

      <section className="glass-card p-5 sm:p-8 space-y-6 border-white/10 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Account roles</p>
            <h2 className="text-2xl font-black tracking-tight mt-2">Use Gymmigo your way</h2>
            <p className="text-sm text-white/40 mt-1 max-w-2xl">
              Add a role when you want to manage a gym or use member features from the same login.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {userRoles.map((role) => {
              const meta = ROLE_META[role.role as keyof typeof ROLE_META] || ROLE_META.user;
              const Icon = meta.icon;
              const isActive = role.role === user?.active_role;
              const isTrainer = role.role === 'trainer';
              const isSwitching = switchingRole === role.role;

              return (
                <button
                  key={role.role}
                  type="button"
                  onClick={() => handleSwitchRole(role.role)}
                  disabled={isActive || isTrainer || !!switchingRole}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                    meta.accent,
                    isActive && 'ring-1 ring-primary/40',
                    isTrainer ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/40',
                    !isActive && !isTrainer && 'hover:bg-primary/10'
                  )}
                >
                  <Icon size={13} />
                  {meta.label}
                  {isSwitching ? (
                    <span className="text-white/50">Switching</span>
                  ) : isActive ? (
                    <span className="text-white/50">Active</span>
                  ) : isTrainer ? (
                    <span className="text-white/50">Soon</span>
                  ) : (
                    <ChevronRight size={12} className="text-white/35" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {addableRoles.length > 0 ? (
            addableRoles.map((role) => {
              const Icon = role.icon;
              const cardClass = clsx(
                'group rounded-2xl border p-5 text-left transition-all',
                role.comingSoon
                  ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                  : 'border-white/10 bg-white/[0.04] hover:border-primary/40 hover:bg-primary/10'
              );
              const content = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                      <Icon size={20} />
                    </div>
                    {role.comingSoon ? (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/40">
                        Soon
                      </span>
                    ) : (
                      <ChevronRight size={18} className="text-white/20 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <h3 className="mt-5 text-base font-black tracking-tight">{role.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{role.description}</p>
                </>
              );

              if (role.comingSoon) {
                return (
                  <div key={role.role} className={cardClass}>
                    {content}
                  </div>
                );
              }

              return (
                <Link key={role.role} to={`/register-role?role=${role.role}`} className={cardClass}>
                  {content}
                </Link>
              );
            })
          ) : (
            <div className="md:col-span-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-5 text-sm text-emerald-200/70">
              All available roles are already connected to this account.
            </div>
          )}
        </div>
      </section>

      {/* AI Personalization Featured Card */}
      {user?.active_role === 'user' && (
        <form onSubmit={handleUpdateFitnessProfile} className="glass-card p-5 sm:p-8 lg:p-12 space-y-8 sm:space-y-12 border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent relative overflow-hidden group">
          <div className="absolute -right-40 -top-40 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700">
            <Sparkles size={500} className="text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-black shadow-2xl shadow-primary/30 transform group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={32} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white">INTELLIGENCE PROFILE</h3>
                <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Powering your personalized MigoAI experience</p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">MigoAI Core Engine</div>
              <div className="text-2xl font-display font-black text-white/10">v2.4.0</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" /> Primary Goal
              </label>
              <PillSelector 
                options={GOAL_OPTIONS} 
                selected={fitnessProfile.primary_goal} 
                onSelect={(key: string) => setFitnessProfile({...fitnessProfile, primary_goal: key})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" /> Activity Level
              </label>
              <PillSelector 
                options={ACTIVITY_LEVEL_OPTIONS} 
                selected={fitnessProfile.activity_level} 
                onSelect={(key: string) => setFitnessProfile({...fitnessProfile, activity_level: key})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" /> Diet Preference
              </label>
              <PillSelector 
                options={DIET_OPTIONS} 
                selected={fitnessProfile.dietary_preference} 
                onSelect={(key: string) => setFitnessProfile({...fitnessProfile, dietary_preference: key})}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" /> Experience
              </label>
              <PillSelector 
                options={EXPERIENCE_OPTIONS} 
                selected={fitnessProfile.experience_level} 
                onSelect={(key: string) => setFitnessProfile({...fitnessProfile, experience_level: key})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-4 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Height (cm)</label>
              <input 
                type="number" placeholder="170"
                value={fitnessProfile.height || ''} 
                onChange={(e) => setFitnessProfile({...fitnessProfile, height: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all font-display font-bold text-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Current Weight (kg)</label>
              <input 
                type="number" placeholder="70"
                value={fitnessProfile.current_weight || ''} 
                onChange={(e) => setFitnessProfile({...fitnessProfile, current_weight: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all font-display font-bold text-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Target Weight (kg)</label>
              <input 
                type="number" placeholder="65"
                value={fitnessProfile.target_weight || ''} 
                onChange={(e) => setFitnessProfile({...fitnessProfile, target_weight: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all font-display font-bold text-xl"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Food Allergies & Restrictions</label>
              <ChipMultiSelect 
                presets={ALLERGY_PRESETS} 
                selected={fitnessProfile.food_allergies || []}
                onChange={(items: string[]) => setFitnessProfile({...fitnessProfile, food_allergies: items})}
                placeholder="e.g. Lactose, Peanuts..."
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Injuries / Physical Limitations</label>
              <ChipMultiSelect 
                presets={INJURY_PRESETS} 
                selected={fitnessProfile.injuries || []}
                onChange={(items: string[]) => setFitnessProfile({...fitnessProfile, injuries: items})}
                placeholder="e.g. ACL tear, Sciatica..."
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Medical Conditions</label>
              <ChipMultiSelect
                presets={CONDITION_PRESETS}
                selected={fitnessProfile.medical_conditions || []}
                onChange={(items: string[]) => setFitnessProfile({...fitnessProfile, medical_conditions: items})}
                placeholder="e.g. Arthritis, Sleep apnea..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Workout Duration</label>
              <NumberPillSelector
                options={DURATION_OPTIONS}
                selected={fitnessProfile.preferred_workout_duration}
                onSelect={(value) => setFitnessProfile({...fitnessProfile, preferred_workout_duration: value})}
                suffix=" min"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Workout Days / Week</label>
              <NumberPillSelector
                options={DAYS_OPTIONS}
                selected={fitnessProfile.workout_days_per_week}
                onSelect={(value) => setFitnessProfile({...fitnessProfile, workout_days_per_week: value})}
                suffix=" days"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 relative z-10">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Additional Context for MigoAI</label>
            <textarea 
              rows={4}
              placeholder="Tell us anything else that will help MigoAI tailor your journey..."
              value={fitnessProfile.notes_for_agent || ''} 
              onChange={(e) => setFitnessProfile({...fitnessProfile, notes_for_agent: e.target.value})}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/10 custom-scrollbar text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-center pt-4 relative z-10">
            <button 
              type="submit" 
              disabled={savingSection === 'AI Personalization'} 
              className="group/btn relative px-10 py-5 rounded-2xl bg-primary text-black font-display font-black italic uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-primary/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <span className="relative flex items-center gap-3">
                {savingSection === 'AI Personalization' ? (
                  <>SYNCING INTELLIGENCE...</>
                ) : (
                  <>
                    <Sparkles size={20} fill="currentColor" /> 
                    Update AI Intelligence
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-3 gap-6 md:gap-12">
        {/* Personal Details */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={(e) => handleUpdateProfile('Basic Details', e)} className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              <ImageUpload 
                initialUrl={profile?.avatar_url}
                onUploadComplete={(url) => setProfile({ ...(profile || {}), avatar_url: url })}
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
                    onChange={(e) => setProfile({ ...(profile || {}), full_name: e.target.value })}
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
                    onChange={(e) => setProfile({ ...(profile || {}), email: e.target.value })}
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
                    onChange={(e) => setProfile({ ...(profile || {}), date_of_birth: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-white/80"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Gender</label>
                <select 
                  value={profile?.gender || ''} 
                  onChange={(e) => setProfile({ ...(profile || {}), gender: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-black">Select Gender</option>
                  <option value="male" className="bg-black">Male</option>
                  <option value="female" className="bg-black">Female</option>
                  <option value="other" className="bg-black">Other</option>
                  <option value="rather not say" className="bg-black">Rather not say</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">City Location</label>
                <div 
                  onClick={() => {
                    setMapIntent('profile_city');
                    setIsMapOpen(true);
                  }}
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



          <form onSubmit={(e) => handleUpdateProfile('Profile Bio', e)} className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Profile Bio</label>
              <textarea 
                rows={3}
                placeholder="Tell us about yourself..."
                value={profile?.bio || ''} 
                onChange={(e) => setProfile({ ...(profile || {}), bio: e.target.value })}
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
              <button
                type="button"
                onClick={() => {
                  setMapIntent('address');
                  setIsMapOpen(true);
                }}
                className="flex items-center gap-2 text-primary text-xs font-bold px-4 py-2 hover:bg-primary/10 rounded-full transition-all"
              >
                <Plus size={16} /> Add New
              </button>
            </div>
            <div className="grid gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="glass-card p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 group-hover:text-primary transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest">
                        {addr.label || 'Address'} {addr.is_primary && <span className="text-primary">(Primary)</span>}
                      </h4>
                      <p className="text-white/40 text-sm">{addr.address_line1 || [addr.city, addr.state].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    disabled={savingSection === `delete-address-${addr.id}`}
                    className="text-white/20 hover:text-red-400 p-2 transition-colors disabled:opacity-40"
                    title="Delete address"
                  >
                    {savingSection === `delete-address-${addr.id}` ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
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
        onConfirm={handleMapConfirm}
      />
    </div>
  );
};

export default Profile;
