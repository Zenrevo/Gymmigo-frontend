import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Search, User, LogOut, Shield, ChevronDown,
  Settings, PlusCircle, Bell, HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';

const MainLayout = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Home', path: '/app/dashboard', icon: Home },
    { name: 'Explore', path: '/app/discovery', icon: Search },
    { name: 'Profile', path: '/app/profile', icon: User },
  ];

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
      <header className="nav-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/app/dashboard" className="hover:opacity-80 transition-opacity">
          <BrandLogo size={40} showText={true} />
        </Link>

        <div className="flex items-center gap-6">
          {/* Notifications (Placeholder) */}
          <button className="relative p-2 text-white/40 hover:text-white transition-colors hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
          </button>

          {/* Profile Dropdown */}
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
                    <Link
                      to="/app/coming-soon"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                    >
                      <HelpCircle size={16} /> Help & Support
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
                        {user.active_role === roleInfo.role && <Check size={14} className="text-primary" />}
                      </button>
                    ))}
                    <Link
                      to="/register-role"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-primary hover:text-primary-light transition-colors mt-1"
                    >
                      <PlusCircle size={14} /> Add new role
                    </Link>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-6 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
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
    </div>
  );
};

// Check icon for selected role
const Check = ({ size, className }: { size?: number, className?: string }) => (
  <svg
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default MainLayout;
