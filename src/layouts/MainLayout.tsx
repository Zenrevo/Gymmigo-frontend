import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Search, User, LogOut, Shield, ChevronDown,
  Settings, Bell, Users, MapPin, AlertCircle, Check as LucideCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';
import axios from 'axios';
import { useGeoLocation } from '../context/LocationContext';
import MapPickerModal from '../components/MapPickerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const MainLayout = () => {
  const { user, logout, switchRole } = useAuth();
  const { selectedLocation, updateSelectedLocation, isMismatch } = useGeoLocation();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [gymBranding, setGymBranding] = useState<{name: string, logo: string} | null>(null);

  const gymMatch = location.pathname.match(/\/app\/gym-owner\/gyms\/([^\/\s]+)/);
  const activeGymId = gymMatch ? gymMatch[1] : null;

  // Auto-load gym branding if in a gym-specific route
  useEffect(() => {
    const match = location.pathname.match(/\/app\/gym-owner\/gyms\/([^\/\s]+)/);
    if (match && match[1]) {
      const gymId = match[1];
      axios.get(`${API_URL}/gym-owner/gyms/${gymId}`)
        .then(res => {
          if (res.data.data?.name) {
            setGymBranding({
              name: res.data.data.name,
              logo: res.data.data.logo_url
            });
          }
        })
        .catch(err => console.error("Sidebar branding failed", err));
    } else {
      setGymBranding(null);
    }
  }, [location.pathname]);

  let navItems: any[] = [
    { name: 'Home', path: '/app/dashboard', icon: Home },
    { name: 'Explore', path: '/app/discovery', icon: Search },
    { name: 'Profile', path: '/app/profile', icon: User },
  ];

  if (user?.active_role === 'gym_owner') {
    if (activeGymId) {
      navItems = [
        { name: 'Home', path: '/app/dashboard', icon: Home },
        { name: 'Members', path: `/app/gym-owner/gyms/${activeGymId}/members`, icon: Users },
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
    } catch (error) {
      console.error('Failed to switch role');
    }
  };

  const getInitials = (phone: string) => {
    return phone.slice(-2);
  };

  const roleColors: Record<string, string> = {
    user: 'text-blue-400 bg-blue-400/10',
    trainer: 'text-primary bg-primary/10',
    gym_owner: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-white font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="nav-blur sticky top-0 z-40 px-6 py-4 flex flex-col gap-4 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/app/dashboard" className="hover:opacity-80 transition-all flex items-center gap-3">
              {gymBranding?.logo ? (
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow-neon-sm p-0.5 group-hover:border-primary/50 transition-all">
                    <img src={gymBranding.logo} alt={gymBranding.name} className="w-full h-full object-cover rounded-[10px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none mb-1">Managing</span>
                    <span className="text-sm font-display font-black tracking-tighter group-hover:text-primary transition-colors">{gymBranding.name}</span>
                  </div>
                </div>
              ) : (
                <BrandLogo size={40} showText={true} />
              )}
            </Link>

            {/* Global Location Selector */}
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
                  <span className="text-xs font-bold truncate max-w-[150px]">
                    {selectedLocation?.address_line1 || 'Select Location'}
                  </span>
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
                  <span className="text-xs font-bold">{user?.phone}</span>
                  <span className={clsx(
                    "text-[10px] uppercase font-black tracking-wider px-1.5 rounded-sm",
                    roleColors[user?.active_role || 'user']
                  )}>
                    {user?.active_role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-xs font-bold border-2 border-white/10 group-hover:border-primary/50 transition-all shadow-lg">
                  {getInitials(user?.phone || '00')}
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
                      {user?.roles?.map((roleInfo: any) => (
                        <button
                          key={roleInfo.role}
                          disabled={user.active_role === roleInfo.role}
                          onClick={() => handleRoleSwitch(roleInfo.role)}
                          className={clsx(
                            "flex items-center justify-between w-full px-4 py-2 text-sm transition-all",
                            user.active_role === roleInfo.role
                              ? "text-primary bg-primary/5 cursor-default"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <span className="capitalize">{roleInfo.role.replace('_', ' ')}</span>
                          {user.active_role === roleInfo.role && <LucideCheck size={14} className="text-primary" />}
                        </button>
                      ))}
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

        {/* Mobile Location Prompt */}
        {isMismatch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="lg:hidden bg-primary/20 border border-primary/30 rounded-xl p-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight text-primary">Location Mismatch</p>
                <p className="text-[10px] text-white/60">Your GPS doesn't match selected area.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMapOpen(true)}
              className="px-4 py-2 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-lg"
            >
              Update
            </button>
          </motion.div>
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

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-6 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      {navItems.length > 0 && (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-3xl border border-white/20 px-8 py-3 rounded-xl flex items-center gap-12 shadow-2xl z-50 w-[90%] justify-around">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                "flex flex-col items-center gap-1 transition-colors",
                location.pathname === item.path ? "text-primary scale-110" : "text-white/40 hover:text-white"
              )}
            >
              <item.icon size={24} />
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
