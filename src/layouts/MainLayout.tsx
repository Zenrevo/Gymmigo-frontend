import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Search, User, LogOut, Shield, ChevronDown,
  Settings, Bell, Users, Check as LucideCheck, Bot, Calendar, Trophy, UserPlus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';
import { useGeoLocation } from '../context/LocationContext';
import type { AddressResult } from '../context/LocationContext';
import MapPickerModal from '../components/MapPickerModal';
import InfoModal from '../components/InfoModal';
import { Sparkles, MapPin } from 'lucide-react';
import { getGoogleMapsUrl } from '../utils/navigation';
import api from '../utils/api';

type NavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

type UserRoleInfo = {
  role: string;
  is_completed?: boolean;
};

const MainLayout = () => {
  const { user, logout, switchRole } = useAuth();
  const { selectedLocation, updateSelectedLocation, isMismatch, currentGPS, isLoaded } = useGeoLocation();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [gymBranding, setGymBranding] = useState<{id: string; name: string; logo?: string | null} | null>(null);

  // Auto-sync states
  const [detectedAddr, setDetectedAddr] = useState<AddressResult | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const syncAttempted = useRef(false);

  const gymMatch = location.pathname.match(/\/app\/gym-owner\/gyms\/([^/\s]+)/);
  const activeGymId = gymMatch ? gymMatch[1] : null;
  const visibleGymBranding = gymBranding?.id === activeGymId ? gymBranding : null;

  // Auto-load gym branding if in a gym-specific route
  useEffect(() => {
    if (!activeGymId) return;

    let isMounted = true;
    api.get(`/gym-owner/gyms/${activeGymId}`)
      .then(res => {
        if (isMounted && res.data.data?.name) {
          setGymBranding({
            id: activeGymId,
            name: res.data.data.name,
            logo: res.data.data.logo_url
          });
        }
      })
      .catch(err => console.error("Sidebar branding failed", err));

    return () => {
      isMounted = false;
    };
  }, [activeGymId]);

  // Auto-Sync Location Logic
  useEffect(() => {
    if (!isLoaded || selectedLocation || !currentGPS || syncAttempted.current) return;
    
    syncAttempted.current = true;
    
    // Use Google Geocoder to resolve current GPS
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat: currentGPS.lat, lng: currentGPS.lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const result = results[0];
        const comps = result.address_components;
        const getComp = (type: string) => comps.find(c => c.types.includes(type))?.long_name || '';
        
        const newAddr = {
          latitude: currentGPS.lat,
          longitude: currentGPS.lng,
          address_line1: result.formatted_address,
          city: getComp('locality') || getComp('postal_town') || getComp('administrative_area_level_2'),
          state: getComp('administrative_area_level_1'),
          pincode: getComp('postal_code')
        };
        
        setDetectedAddr(newAddr);
        setIsSyncModalOpen(true);
      }
    });
  }, [currentGPS, selectedLocation, isLoaded]);

  let navItems: NavItem[] = [
    { name: 'Home', path: '/app/dashboard', icon: Home },
    { name: 'Explore', path: '/app/discovery', icon: Search },
    { name: 'MigoAI', path: '/app/assistant', icon: Bot },
    { name: 'Profile', path: '/app/profile', icon: User },
  ];

  if (user?.active_role === 'user') {
    navItems = [
      { name: 'Home', path: '/app/dashboard', icon: Home },
      { name: 'Explore', path: '/app/discovery', icon: Search },
      { name: 'Clubs', path: '/app/clubs', icon: Trophy },
      { name: 'Calendar', path: '/app/calendar', icon: Calendar },
      { name: 'MigoAI', path: '/app/assistant', icon: Bot },
      { name: 'Profile', path: '/app/profile', icon: User },
    ];
  } else if (user?.active_role === 'trainer') {
    navItems = [
      { name: 'Home', path: '/app/dashboard', icon: Home },
      { name: 'Explore', path: '/app/discovery', icon: Search },
      { name: 'MigoAI', path: '/app/assistant', icon: Bot },
      { name: 'Profile', path: '/app/profile', icon: User },
    ];
  } else if (user?.active_role === 'gym_owner') {
    if (activeGymId) {
      navItems = [
        { name: 'Home', path: '/app/dashboard', icon: Home },
        { name: 'Members', path: `/app/gym-owner/gyms/${activeGymId}/members`, icon: Users },
        { name: 'Leads', path: `/app/gym-owner/gyms/${activeGymId}/leads`, icon: UserPlus },
        { name: 'Team', path: `/app/gym-owner/gyms/${activeGymId}/team`, icon: Shield },
        { name: 'Settings', path: `/app/gym-owner/gyms/${activeGymId}/settings`, icon: Settings },
      ];
    } else {
      navItems = [];
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role: string) => {
    try {
      await switchRole(role);
      setIsProfileOpen(false);
      navigate('/app/dashboard');
    } catch {
      console.error('Failed to switch role');
    }
  };

  const getInitials = () => {
    const name = user?.full_name || '';
    if (name.trim()) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name[0].toUpperCase();
    }
    return 'U';
  };

  const roleColors: Record<string, string> = {
    user: 'text-blue-400 bg-blue-400/10',
    trainer: 'text-primary bg-primary/10',
    gym_owner: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-white font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="nav-blur sticky top-0 z-40 px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/app/dashboard" className="hover:opacity-80 transition-all flex items-center gap-3">
              {visibleGymBranding?.logo ? (
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow-neon-sm p-0.5 group-hover:border-primary/50 transition-all">
                    <img src={visibleGymBranding.logo} alt={visibleGymBranding.name} className="w-full h-full object-cover rounded-[10px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none mb-1">Managing</span>
                    <span className="text-sm font-display font-black tracking-tighter group-hover:text-primary transition-colors">{visibleGymBranding.name}</span>
                  </div>
                </div>
              ) : (
                <BrandLogo size={40} showText={true} />
              )}
            </Link>

            {/* Desktop Location Selector */}
            {user?.active_role !== 'gym_owner' && (
              <div className="hidden lg:flex items-center gap-2">
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <button 
                onClick={() => setIsMapOpen(true)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all group relative",
                  isMismatch 
                    ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_20px_rgba(255,107,0,0.1)]" 
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="relative">
                  <MapPin size={16} className={isMismatch ? "text-primary" : "text-primary/50"} />
                  {isMismatch && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black"
                    />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-primary transition-colors">Your Location</span>
                  <a 
                    href={getGoogleMapsUrl(selectedLocation?.address_line1, selectedLocation?.latitude, selectedLocation?.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => selectedLocation ? e.stopPropagation() : (e.preventDefault(), setIsMapOpen(true))}
                    className="text-xs font-bold truncate max-w-[150px] hover:text-primary transition-colors border-b border-transparent hover:border-primary/30"
                  >
                    {selectedLocation?.address_line1 || 'Select Location'}
                  </a>
                </div>
                <ChevronDown size={14} className="opacity-20 group-hover:opacity-100 transition-all" />
                
                {isMismatch && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-full left-0 right-0 mt-3 p-3 bg-primary rounded-xl text-black text-[10px] font-black uppercase tracking-tighter leading-tight shadow-2xl z-50 pointer-events-none after:content-[''] after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:border-l-4 after:border-r-4 after:border-b-4 after:border-l-transparent after:border-r-transparent after:border-b-primary"
                  >
                    GPS Mismatch! Please update your address.
                  </motion.div>
                )}
              </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  location.pathname === item.path 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={16} className={clsx(location.pathname === item.path ? "text-white" : "text-primary/50")} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-white/40 hover:text-white transition-colors hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-xs font-bold truncate max-w-[120px]">{user?.full_name || 'Gymmigo User'}</span>
                  <span className={clsx(
                    "text-[10px] uppercase font-black tracking-wider px-1.5 rounded-sm",
                    roleColors[user?.active_role || 'user']
                  )}>
                    {user?.active_role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-xs font-bold border-2 border-white/10 group-hover:border-primary/50 transition-all shadow-lg overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <ChevronDown size={14} className={clsx("text-white/40 transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-64 glass-card bg-black/40 border-white/10 shadow-2xl py-2 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Active Role</p>
                      <p className="text-sm font-bold text-primary mt-1 capitalize">{user?.active_role?.replace('_', ' ')}</p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/app/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User size={16} /> My Account
                      </Link>
                      <Link
                        to="/app/coming-soon"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                      >
                        <Settings size={16} /> Settings
                      </Link>
                    </div>

                    {/* Role Switching Section */}
                    <div className="py-2 border-t border-white/5 bg-white/[0.02]">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Switch Role</p>
                        <Shield size={10} className="text-white/20" />
                      </div>
                      {user?.roles?.map((roleInfo: UserRoleInfo) => {
                        const isTrainer = roleInfo.role === 'trainer';
                        const isActive = user.active_role === roleInfo.role;
                        return (
                          <button
                            key={roleInfo.role}
                            disabled={isActive || isTrainer}
                            onClick={() => handleRoleSwitch(roleInfo.role)}
                            className={clsx(
                              "flex items-center justify-between w-full px-4 py-2 text-sm transition-all",
                              isActive
                                ? "text-primary bg-primary/5 cursor-default"
                                : (isTrainer ? "text-white/20 cursor-not-allowed" : "text-white/60 hover:text-white hover:bg-white/10")
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="capitalize">{roleInfo.role.replace('_', ' ')}</span>
                              {isTrainer && (
                                <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">Soon</span>
                              )}
                            </div>
                            {isActive && <LucideCheck size={14} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Location Selector Row */}
        {user?.active_role !== 'gym_owner' && (
          <div className="flex lg:hidden items-center w-full min-w-0">
          <button 
            onClick={() => setIsMapOpen(true)}
            className={clsx(
              "flex-1 flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border transition-all relative min-w-0 overflow-hidden",
              isMismatch 
                ? "bg-primary/20 border-primary/50 text-primary shadow-neon-sm" 
                : "bg-white/5 border-white/10 text-white/60"
            )}
          >
            <MapPin size={14} className={clsx("shrink-0", isMismatch ? "text-primary" : "text-primary/50")} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Location</span>
              <span className="text-[11px] font-bold truncate w-full">
                {selectedLocation?.address_line1 || 'Set current location'}
              </span>
            </div>
            {isMismatch && (
              <div className="ml-auto bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Mismatch</div>
            )}
            <ChevronDown size={12} className="ml-auto opacity-40 shrink-0" />
          </button>
          </div>
        )}
      </header>

      {/* Map Modal */}
      <MapPickerModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(addr) => {
          updateSelectedLocation({
            latitude: addr.latitude,
            longitude: addr.longitude,
            address_line1: addr.address_line1,
            city: addr.city
          });
          setIsMapOpen(false);
        }}
      />

      {/* Auto-Sync Confirmation Modal */}
      <InfoModal 
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Location Detected"
        description={`We've found your area: ${detectedAddr?.address_line1}. Would you like to use this location for distance calculations?`}
        icon={Sparkles}
        confirmText="Yes, Sync Location"
        onConfirm={() => {
          if (detectedAddr) updateSelectedLocation(detectedAddr);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 pb-32 md:pb-6 container mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      {navItems.length > 0 && (
        <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-black/65 backdrop-blur-2xl border border-white/10 px-2 py-2 rounded-2xl grid shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-all duration-300",
                location.pathname === item.path ? "bg-primary/15 text-primary" : "text-white/35 hover:text-white"
              )}
            >
              <item.icon size={20} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              <span className="max-w-full truncate text-[9px] font-black uppercase tracking-tighter">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
