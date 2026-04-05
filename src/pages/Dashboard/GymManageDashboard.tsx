import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Users, Dumbbell, 
  TrendingUp, Star, Settings, Image as ImageIcon,
  Clock, Wifi, CreditCard, ChevronRight, Menu, X, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGym } from '../../context/GymContext';
import clsx from 'clsx';

const navItems = [
  { id: '', name: 'Overview', icon: TrendingUp },
  { id: 'members', name: 'Members', icon: Users },
  { id: 'plans', name: 'Plans', icon: CreditCard },
  { id: 'equipment', name: 'Equipment', icon: Dumbbell },
  { id: 'schedule', name: 'Schedule', icon: Clock },
  { id: 'amenities', name: 'Amenities', icon: Wifi },
  { id: 'gallery', name: 'Gallery', icon: ImageIcon },
  { id: 'reviews', name: 'Reviews', icon: Star },
  { id: 'settings', name: 'Settings', icon: Settings },
];

const GymManageDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gym, loading, error, gymId } = useGym();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to determine active tab based on URL path
  // Since we are at /app/gym-owner/gyms/:gymId, the last segment is the tab
  const segments = location.pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  const activeTab = lastSegment === gymId ? '' : lastSegment;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Loader2 className="text-primary animate-spin" size={48} />
      <p className="text-primary font-display text-xl animate-pulse">SYNCHRONIZING CONTROL CENTER...</p>
    </div>
  );

  if (error || !gym) return (
    <div className="text-center p-20 space-y-4">
      <AlertCircle className="mx-auto text-red-500" size={48} />
      <h2 className="text-2xl font-bold">Gym Not Found</h2>
      <p className="text-white/40">{error || "Could not load gym details."}</p>
      <button onClick={() => navigate('/app/dashboard')} className="btn-primary px-6 py-2 mt-4">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] gap-8">
      {/* Mobile Top Header (only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between mb-4 glass-card p-4">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard" className="text-white/60 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="font-bold text-lg truncate max-w-[200px] uppercase italic">{gym.gym.name}</h2>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-white/5 rounded-full"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={clsx(
        "md:w-64 shrink-0 flex flex-col gap-2",
        "fixed md:static inset-0 z-40 bg-black/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none p-6 md:p-0 transition-transform duration-300 md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:block space-y-6 mb-8">
          <Link 
            to="/app/dashboard"
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group w-fit"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Portfolio</span>
          </Link>
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-display font-black tracking-tighter truncate italic uppercase">{gym.gym.name}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">ID: {gym.gym.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar md:pr-4">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-3">Management</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.id || "."}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? "text-primary" : "text-white/40 group-hover:text-white"} />
                  {item.name}
                </div>
                {isActive && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pb-24 max-w-5xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GymManageDashboard;
