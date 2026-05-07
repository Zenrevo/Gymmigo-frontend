import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Star, ArrowRight,
  CheckCircle2, Calendar, MapPin,
  Zap, DollarSign, Activity, ChevronRight,
  User, Timer, Shield,
  AlertTriangle, MessageCircle, Package,
  Settings, Award, Briefcase, Plus,
  Image as ImageIcon, Trash2, Loader2
} from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import clsx from 'clsx';
import PageLoader from '../../components/PageLoader';
import CreatePackageModal from '../../components/CreatePackageModal';
import TrainerScheduleModal from '../../components/TrainerScheduleModal';
import AddCertificationModal from '../../components/AddCertificationModal';
import MapPickerModal from '../../components/MapPickerModal';
import TrainerProfessionalSettingsModal from '../../components/TrainerProfessionalSettingsModal';
import TrainerPricingSettingsModal from '../../components/TrainerPricingSettingsModal';
import { useNotification } from '../../context/NotificationContext';

interface DashboardData {
  today_sessions: any[];
  upcoming_sessions: any[];
  pending_bookings: any[];
  packages: any[];
  availability: any[];
  certifications: any[];
  stats: {
    total_clients: number;
    total_sessions: number;
    completed_today: number;
    remaining_today: number;
    today_earnings: number;
    this_month_earnings: number;
    rating_avg: number | null;
    rating_count: number;
    completion_rate: number;
    is_available: boolean;
    verification_status: string;
    profile_completion_pct?: number;
  };
  recent_reviews: any[];
}

type TabType = 'overview' | 'clients' | 'packages' | 'schedule' | 'sessions' | 'bookings' | 'certifications' | 'gallery' | 'reviews' | 'settings';

const TrainerDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'pending' | 'upcoming'>('pending');
  const [bookingFilter, setBookingFilter] = useState<'active' | 'past'>('active');
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMeta, setReviewsMeta] = useState<{ total: number; avg_rating: number }>({ total: 0, avg_rating: 0 });
  const { showNotification } = useNotification();

  const clients = useMemo(() => {
    const map: Record<string, any> = {};
    
    // Group all bookings by client
    allBookings.forEach(b => {
      const userId = b.user_id;
      if (!map[userId]) {
        map[userId] = {
          user_id: userId,
          user_name: b.user_name || 'Member',
          user_phone: b.user_phone,
          bookings: [],
          sessions: [],
        };
      }
      map[userId].bookings.push(b);
    });

    // Group all sessions by client
    sessions.forEach(s => {
      const userId = s.user_id;
      if (!map[userId]) {
        map[userId] = {
          user_id: userId,
          user_name: s.user_name || 'Member',
          user_phone: s.user_phone,
          bookings: [],
          sessions: [],
        };
      }
      map[userId].sessions.push(s);
    });

    return Object.values(map);
  }, [allBookings, sessions]);

  const groupedTodaySessions = useMemo(() => {
    if (!data?.today_sessions) return [];
    const groups: { [key: string]: any } = {};
    data.today_sessions.forEach((s: any) => {
      const clientId = s.user_id || s.client_name || 'unknown';
      if (!groups[clientId]) {
        groups[clientId] = {
          client_name: s.client_name || 'Client',
          sessions: []
        };
      }
      groups[clientId].sessions.push(s);
    });
    return Object.values(groups);
  }, [data?.today_sessions]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get(`/trainer/dashboard`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch trainer dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get(`/trainer-bookings/sessions/my?role=trainer`);
      setSessions(res.data.data?.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await api.get(`/trainer-bookings/bookings/my?role=trainer`);
      setAllBookings(res.data.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const res = await api.get(`/trainer/gallery`);
      setGalleryImages(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      // We need the trainer_id — get it from the full profile
      const profileRes = await api.get(`/trainer`);
      const trainerId = profileRes.data.data?.id;
      if (trainerId) {
        const res = await api.get(`/trainer-bookings/reviews/${trainerId}`);
        setReviews(res.data.data?.reviews || []);
        setReviewsMeta({
          total: res.data.data?.total || 0,
          avg_rating: res.data.data?.avg_rating || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const handleAddGalleryImage = async (url: string) => {
    if (!url) return;
    try {
      await api.post(`/trainer/gallery`, {
        image_url: url,
        caption: '',
        display_order: galleryImages.length,
      });
      showNotification('Image added to portfolio!', 'success');
      fetchGallery();
    } catch (err) {
      console.error('Failed to add gallery image:', err);
      showNotification('Failed to add image', 'error');
    }
  };

  const handleDeleteGalleryImage = async (imgId: string) => {
    setDeletingImageId(imgId);
    try {
      await api.delete(`/trainer/gallery/${imgId}`);
      showNotification('Image removed', 'success');
      fetchGallery();
    } catch (err) {
      console.error('Failed to delete gallery image:', err);
      showNotification('Failed to remove image', 'error');
    } finally {
      setDeletingImageId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchAllBookings();
      fetchSessions();
    } else if (activeTab === 'bookings') {
      fetchAllBookings();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'gallery') {
      fetchGallery();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, fetchAllBookings, fetchSessions, fetchGallery, fetchReviews]);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.patch(`/trainer/toggle-availability`);
      if (data) {
        setData({
          ...data,
          stats: { ...data.stats, is_available: res.data.data.is_available }
        });
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/trainer-bookings/sessions/${sessionId}/${action}`);
      await Promise.all([fetchDashboard(), fetchSessions()]);
      showNotification(
        action === 'accept' ? 'Session accepted successfully!' : 'Session rejected',
        'success'
      );
    } catch (err) {
      console.error(`Failed to ${action} session:`, err);
      showNotification(`Failed to ${action} session`, 'error');
    }
  };

  const handleLocationUpdate = async (location: any) => {
    try {
      await api.patch(`/trainer`, {
        latitude: location.latitude,
        longitude: location.longitude,
        location_address: location.address_line1,
      });
      showNotification('Location updated successfully!', 'success');
      setIsLocationModalOpen(false);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update location:', err);
      showNotification('Failed to update location', 'error');
    }
  };

  if (loading) return <PageLoader message="Loading your professional dashboard..." />;

  const stats = data?.stats;
  const isOnline = stats?.is_available ?? false;

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'clients', label: 'My Clients', icon: Users },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    { id: 'bookings', label: 'Bookings', icon: Users },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'gallery', label: 'Portfolio', icon: ImageIcon },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Status Hero Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden glass-card p-0">
        <div className={clsx(
          "absolute inset-0 opacity-20 transition-colors duration-700",
          isOnline ? "bg-gradient-to-br from-emerald-500/30 to-transparent" : "bg-gradient-to-br from-red-500/20 to-transparent"
        )} />
        
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={clsx(
              "w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center relative transition-all duration-500 border-2 shrink-0",
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-red-500/10 border-red-500/20"
            )}>
              {isOnline && (
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              )}
              <Zap size={28} className={clsx("relative z-10 sm:w-8 sm:h-8", isOnline ? "text-emerald-400" : "text-red-400")} />
            </div>
            
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tighter italic uppercase truncate">
                  {isOnline ? 'YOU\'RE ONLINE' : 'YOU\'RE OFFLINE'}
                </h2>
                {stats?.verification_status === 'verified' && (
                  <span className="text-blue-400 text-[8px] font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-1 shrink-0">
                    <Shield size={8} /> Verified
                  </span>
                )}
              </div>
              <p className="text-white/40 text-[11px] sm:text-sm max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                {isOnline 
                  ? 'Members can discover and book sessions' 
                  : 'You won\'t appear in search results.'
                }
              </p>
              {stats?.profile_completion_pct !== undefined && stats.profile_completion_pct < 100 && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Profile {stats.profile_completion_pct}%</span>
                  <div className="h-1 w-24 sm:w-32 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${stats.profile_completion_pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={clsx(
              "w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all border-2 min-w-[160px] sm:min-w-[180px]",
              isOnline 
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            )}
          >
            {toggling ? (
              <span className="flex items-center justify-center gap-2">
                <Activity size={16} className="animate-spin" /> ...
              </span>
            ) : isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-black shadow-lg shadow-primary/20"
                : "bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content Container ──────────────────────────────────────── */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Earnings & Rating Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card p-4 sm:p-6 text-center hover:border-emerald-500/30 transition-colors">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Today\'s Earnings</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400">₹{(stats?.today_earnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-4 sm:p-6 text-center hover:border-white/20 transition-colors">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">This Month</p>
                    <p className="text-2xl sm:text-3xl font-black text-white">₹{(stats?.this_month_earnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="glass-card p-4 sm:p-6 text-center hover:border-primary/30 transition-colors">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Rating</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star size={20} className="text-primary fill-primary w-4 h-4 sm:w-5 sm:h-5" />
                      <p className="text-2xl sm:text-3xl font-black text-primary">{stats?.rating_avg?.toFixed(1) || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Clients', value: stats?.total_clients || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500' },
                    { label: 'Total Sessions', value: stats?.total_sessions || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500' },
                    { label: 'Completion Rate', value: `${stats?.completion_rate || 100}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                    { label: 'Today\'s Sessions', value: `${stats?.completed_today || 0}/${(stats?.completed_today || 0) + (stats?.remaining_today || 0)}`, icon: Timer, color: 'text-primary', bg: 'bg-primary' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-5 relative overflow-hidden group hover:border-white/10 transition-colors"
                    >
                      <stat.icon size={60} className={`absolute -right-3 -bottom-3 ${stat.bg}/5 group-hover:${stat.bg}/10 transition-all`} />
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <stat.icon size={12} className={stat.color} />
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Today's Sessions */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Clock size={16} className="text-primary" />
                        </div>
                        Today's Schedule
                      </h3>
                      <div className="flex gap-4">
                        <button onClick={() => setActiveTab('clients')} className="text-[10px] text-primary hover:text-white uppercase tracking-widest font-black">My Clients</button>
                        <button onClick={() => setActiveTab('schedule')} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold">Full Schedule</button>
                      </div>
                    </div>

                    {groupedTodaySessions.length > 0 ? (
                      <div className="space-y-6">
                        {groupedTodaySessions.map((group, gIdx) => (
                          <div key={group.client_name + gIdx} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <User size={14} className="text-primary" />
                              </div>
                              <h4 className="text-sm font-black text-white/60 tracking-widest uppercase">{group.client_name}</h4>
                              <div className="flex-1 h-px bg-white/10" />
                            </div>
                            <div className="space-y-3">
                              {group.sessions.map((session: any) => (
                                <div key={session.id} className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group hover:border-white/10 transition-all relative">
                                  {/* Mobile Corner Status Pin */}
                                  <div className={clsx(
                                    "sm:hidden absolute top-3 right-3 w-2 h-2 rounded-full",
                                    session.status === 'completed' ? "bg-emerald-500" :
                                    session.status === 'in_progress' ? "bg-primary animate-pulse" :
                                    "bg-white/20"
                                  )} />

                                  {/* Timeline Dot (Desktop only) */}
                                  <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                                    <div className={clsx(
                                      "w-3 h-3 rounded-full border-2",
                                      session.status === 'completed' ? "bg-emerald-500 border-emerald-500" :
                                      session.status === 'in_progress' ? "bg-primary border-primary animate-pulse" :
                                      "bg-transparent border-white/20"
                                    )} />
                                  </div>

                                  {/* Time & Client */}
                                  <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
                                    <div className="w-14 sm:w-16 shrink-0 text-left sm:text-center">
                                      <p className="text-xs sm:text-sm font-black">{session.scheduled_time}</p>
                                      <p className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase">{session.duration_minutes}m</p>
                                    </div>
                                    <div className="w-px h-6 sm:h-8 bg-white/10 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={clsx(
                                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                          session.session_type === 'online' ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                          session.session_type === 'home' ? "text-purple-400 bg-purple-500/10 border-purple-500/20" :
                                          "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        )}>
                                          {session.session_type}
                                        </span>
                                        {session.location && (
                                          <span className="text-[9px] sm:text-[10px] text-white/40 truncate max-w-[120px] sm:max-w-[150px]" title={session.location}>
                                            • {session.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Status Pill */}
                                  <div className={clsx(
                                    "hidden sm:block px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0",
                                    session.status === 'completed' ? "text-emerald-400 border border-emerald-500/20 bg-emerald-500/10" :
                                    session.status === 'in_progress' ? "text-primary border border-primary/20 bg-primary/10" :
                                    "text-white/40 border border-white/10 bg-white/5"
                                  )}>
                                    {session.status === 'in_progress' ? 'LIVE' : session.status.replace('_', ' ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="glass-card p-10 text-center border-dashed text-white/20">
                        <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold">No sessions scheduled for today</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pending Requests */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Package size={16} className="text-amber-400" />
                        </div>
                        Recent Purchases
                      </h3>
                      {data?.pending_bookings && data.pending_bookings.length > 0 && (
                        <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {data.pending_bookings.length}
                        </span>
                      )}
                    </div>

                    {data?.pending_bookings && data.pending_bookings.length > 0 ? (
                      <div className="space-y-3">
                        {data.pending_bookings.map((booking) => (
                          <div key={booking.id} className="glass-card p-4 border-l-2 border-l-primary/50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-sm truncate">{booking.client_name}</p>
                                <p className="text-[10px] text-white/40 uppercase font-black">{booking.package_name}</p>
                              </div>
                              <p className="text-sm font-black text-emerald-400">₹{booking.total_amount}</p>
                            </div>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                              Package paid. Sessions should be confirmed from the Sessions tab.
                            </p>
                          </div>
                        ))}
                        <button onClick={() => setActiveTab('bookings')} className="w-full text-center text-[10px] text-white/30 hover:text-white uppercase font-bold py-2">View All Bookings</button>
                      </div>
                    ) : (
                      <div className="glass-card p-8 text-center border-dashed text-white/15">
                        <Users size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Purchases</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── CLIENTS TAB ── */}
            {activeTab === 'clients' && (
              <ClientsSection 
                clients={clients} 
                onSelectClient={(c: any) => setSelectedClient(c)} 
              />
            )}

            {/* ── PACKAGES TAB ── */}
            {activeTab === 'packages' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Service Packages</h3>
                  <button onClick={() => setIsPackageModalOpen(true)} className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
                    <Plus size={16} /> Create Package
                  </button>
                </div>
                
                {data?.packages && data.packages.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.packages.map(pkg => (
                      <div key={pkg.id} className="glass-card p-6 space-y-4 hover:border-primary/30 transition-all flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg">{pkg.name}</h4>
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                              {pkg.package_type}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-emerald-400">₹{pkg.price}</p>
                            <p className="text-[10px] text-white/30 font-bold uppercase">{pkg.total_sessions} Sessions</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/50 flex-1">{pkg.description || 'No description provided.'}</p>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Valid: {pkg.validity_days} days</span>
                          <button className="text-[10px] text-primary font-bold uppercase tracking-widest hover:text-white transition-colors">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center border-dashed border-white/10">
                    <Package size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="font-bold text-lg mb-2">No packages created</p>
                    <p className="text-sm text-white/40 mb-6">Create service packages (monthly, weekly, or specific sessions) for clients to book.</p>
                    <button onClick={() => setIsPackageModalOpen(true)} className="bg-primary/20 text-primary border border-primary/30 px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-black transition-colors">Create First Package</button>
                  </div>
                )}
              </div>
            )}

            {/* ── SCHEDULE TAB ── */}
            {activeTab === 'schedule' && (
              <ScheduleSection availability={data?.availability} onViewManage={() => setIsScheduleModalOpen(true)} />
            )}

            {/* ── SESSIONS TAB ── */}
            {activeTab === 'sessions' && (
               <SessionsSection 
                 sessions={sessions} 
                 loading={sessionsLoading} 
                 filter={sessionFilter} 
                 setFilter={setSessionFilter}
                 onAction={handleSessionAction}
               />
            )}

            {/* ── BOOKINGS TAB ── */}
            {activeTab === 'bookings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Booking Management</h3>
                  <div className="flex bg-white/5 rounded-xl p-1">
                     <button 
                       onClick={() => setBookingFilter('active')}
                       className={clsx(
                         "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                         bookingFilter === 'active' ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white"
                       )}
                     >
                        Active
                     </button>
                     <button 
                       onClick={() => setBookingFilter('past')}
                       className={clsx(
                         "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                         bookingFilter === 'past' ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white"
                       )}
                     >
                        Past
                     </button>
                  </div>
                </div>

                {bookingsLoading ? (
                  <div className="glass-card p-12 text-center text-white/20">Loading bookings...</div>
                ) : allBookings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {allBookings
                      .filter(b => bookingFilter === 'active' ? (b.status === 'confirmed' || b.status === 'pending') : (b.status === 'completed' || b.status === 'cancelled'))
                      .map((booking) => (
                      <div 
                        key={booking.id} 
                        onClick={() => setSelectedClient(clients.find(c => c.user_id === booking.user_id))}
                        className="glass-card p-5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all border border-transparent"
                      >
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                             "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                             booking.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-primary group-hover:bg-primary/20"
                          )}>
                            <User size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold group-hover:text-primary transition-colors">{booking.user_name || 'Member'}</h4>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{booking.package_name || 'Personal Training'}</p>
                          </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-6">
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Sessions</p>
                            <p className="text-sm font-black">
                              {booking.sessions_completed} <span className="text-white/20 font-medium">/ {booking.total_sessions}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={clsx(
                              "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                              booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              booking.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-white/5 text-white/20 border border-white/10'
                            )}>
                              {booking.status}
                            </span>
                          </div>
                          <ArrowRight size={18} className="text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                    {allBookings.filter(b => bookingFilter === 'active' ? (b.status === 'confirmed' || b.status === 'pending') : (b.status === 'completed' || b.status === 'cancelled')).length === 0 && (
                      <div className="glass-card p-12 text-center border-dashed text-white/15">
                        <Users size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No {bookingFilter} bookings found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center border-dashed">
                    <Users className="mx-auto mb-4 text-white/10" size={48} />
                    <p className="text-white/40 text-sm font-bold">No bookings recorded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── CERTIFICATIONS TAB ── */}
            {activeTab === 'certifications' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Professional Certifications</h3>
                  <button onClick={() => setIsCertModalOpen(true)} className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors">
                    <Plus size={16} /> Add Cert
                  </button>
                </div>
                 {data?.certifications && data.certifications.length > 0 ? (
                   <div className="grid md:grid-cols-2 gap-4">
                     {data.certifications.map(cert => (
                       <div key={cert.id} className="glass-card p-5 relative overflow-hidden flex flex-col gap-2 border-l-4 border-l-primary/50">
                         <div className="flex justify-between items-start">
                           <h4 className="font-bold text-sm pr-4">{cert.name}</h4>
                           {cert.is_verified ? (
                             <Shield size={16} className="text-blue-400 shrink-0" />
                           ) : (
                             <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                           )}
                         </div>
                         <p className="text-xs text-white/40">{cert.issued_by}</p>
                         <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                           {cert.is_verified ? <span className="text-blue-400">Verified</span> : <span className="text-amber-400">Pending Review</span>}
                         </p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="glass-card p-10 text-center border-dashed text-white/20">
                     <Award size={40} className="mx-auto mb-4 opacity-30" />
                     <p className="text-sm font-bold">No certifications uploaded.</p>
                   </div>
                 )}
               </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <h3 className="text-xl font-bold">Profile Settings</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                   <div onClick={() => setIsProfModalOpen(true)} className="glass-card p-6 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><Briefcase size={18} className="text-white/40"/></div>
                       <div>
                         <p className="font-bold text-sm">Professional Details</p>
                         <p className="text-[10px] text-white/30 uppercase tracking-widest">Experience, Bio, Languages</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-white/20" />
                   </div>
                   <div onClick={() => setIsPricingModalOpen(true)} className="glass-card p-6 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><DollarSign size={18} className="text-white/40"/></div>
                       <div>
                         <p className="font-bold text-sm">Pricing & Service Info</p>
                         <p className="text-[10px] text-white/30 uppercase tracking-widest">Rates, Duration, Availability Mode</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-white/20" />
                   </div>
                   <div onClick={() => setIsLocationModalOpen(true)} className="glass-card p-6 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><MapPin size={18} className="text-white/40"/></div>
                       <div>
                         <p className="font-bold text-sm">Location settings</p>
                         <p className="text-[10px] text-white/30 uppercase tracking-widest">Pin working address</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-white/20" />
                   </div>
                 </div>
               </div>
            )}

            {/* ── GALLERY / PORTFOLIO TAB ── */}
            {activeTab === 'gallery' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Portfolio Gallery</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{galleryImages.length} photo{galleryImages.length !== 1 && 's'}</p>
                </div>

                {galleryLoading ? (
                  <div className="glass-card p-12 text-center">
                    <Loader2 className="mx-auto mb-3 animate-spin text-primary" size={32} />
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Loading portfolio...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Upload Card */}
                    <div className="aspect-square">
                      <ImageUpload
                        onUploadComplete={handleAddGalleryImage}
                        label=""
                        aspectRatio="square"
                      />
                    </div>

                    {/* Gallery Images */}
                    {galleryImages.map((img: any) => (
                      <div key={img.id} className="aspect-square rounded-2xl overflow-hidden relative group border border-white/5 hover:border-white/15 transition-all">
                        <img src={img.image_url} alt={img.caption || 'Portfolio'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleDeleteGalleryImage(img.id)}
                            disabled={deletingImageId === img.id}
                            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-colors"
                          >
                            {deletingImageId === img.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <p className="text-[10px] text-white/60 font-bold truncate">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!galleryLoading && galleryImages.length === 0 && (
                  <div className="glass-card p-10 text-center border-dashed">
                    <ImageIcon className="mx-auto mb-4 text-white/10" size={48} />
                    <p className="text-white/40 text-sm font-bold">Build your visual portfolio by uploading transformation photos, certifications, and training content.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Reviews Summary */}
                <div className="glass-card p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-black text-primary">{reviewsMeta.avg_rating?.toFixed(1) || '—'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12} className={clsx(i <= Math.round(reviewsMeta.avg_rating) ? 'text-primary fill-primary' : 'text-white/10')} />
                        ))}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div>
                      <p className="text-lg font-black">{reviewsMeta.total}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Total Reviews</p>
                    </div>
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="glass-card p-12 text-center">
                    <Loader2 className="mx-auto mb-3 animate-spin text-primary" size={32} />
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="glass-card p-6 space-y-4 hover:border-white/10 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                              {rev.avatar_url ? (
                                <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="text-white/20" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">{rev.user_name || 'Anonymous'}</p>
                                {rev.is_verified_client && (
                                  <span className="text-[8px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={8} /> Verified Client
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} size={10} className={clsx(i <= rev.rating ? 'text-primary fill-primary' : 'text-white/10')} />
                                ))}
                                <span className="text-[9px] text-white/20 ml-2 font-bold">
                                  {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {rev.title && (
                          <p className="text-sm font-bold italic text-white/80">"{rev.title}"</p>
                        )}
                        {rev.review && (
                          <p className="text-sm text-white/50 leading-relaxed">{rev.review}</p>
                        )}

                        {/* Sub-Ratings */}
                        {(rev.professionalism_rating || rev.knowledge_rating || rev.punctuality_rating) && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {rev.professionalism_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-widest">
                                Professionalism: <span className="text-white/80">{rev.professionalism_rating}/5</span>
                              </div>
                            )}
                            {rev.knowledge_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-widest">
                                Knowledge: <span className="text-white/80">{rev.knowledge_rating}/5</span>
                              </div>
                            )}
                            {rev.punctuality_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-widest">
                                Punctuality: <span className="text-white/80">{rev.punctuality_rating}/5</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trainer Response */}
                        {rev.trainer_response && (
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mt-2">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Your Response</p>
                            <p className="text-xs text-white/60">{rev.trainer_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-10 text-center border-dashed">
                    <MessageCircle className="mx-auto mb-4 text-white/10" size={48} />
                    <p className="text-white/40 text-sm font-bold">No reviews yet. Complete sessions to start getting feedback from clients.</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <CreatePackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onSuccess={fetchDashboard}
      />
      <TrainerScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={fetchDashboard}
      />
      <AddCertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onSuccess={fetchDashboard}
      />
      <TrainerProfessionalSettingsModal
        isOpen={isProfModalOpen}
        onClose={() => setIsProfModalOpen(false)}
        onSuccess={fetchDashboard}
      />
      <TrainerPricingSettingsModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSuccess={fetchDashboard}
      />
      <MapPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onConfirm={handleLocationUpdate}
      />

      <ClientDetailModal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
      />
    </div>
  );
};

const ClientsSection = ({ clients, onSelectClient }: { clients: any[]; onSelectClient: (c: any) => void }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold italic uppercase tracking-tighter">My Clients</h3>
        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{clients.length} Active Client{clients.length !== 1 && 's'}</p>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div 
              key={client.user_id} 
              onClick={() => onSelectClient(client)}
              className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all border border-transparent"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all overflow-hidden">
                  <User size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{client.user_name}</h4>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                    {client.bookings.length} Package{client.bookings.length !== 1 && 's'} • {client.sessions.length} Session{client.sessions.length !== 1 && 's'}
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 text-center border-dashed">
          <Users className="mx-auto mb-4 text-white/10" size={48} />
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No clients found yet</p>
        </div>
      )}
    </div>
  );
};

const ClientDetailModal = ({ isOpen, onClose, client }: { isOpen: boolean; onClose: () => void; client: any | null }) => {
  if (!client) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden glass-card p-0 flex flex-col lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel: Client Info */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-8 bg-white/5">
              <div className="text-center lg:text-left">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto lg:mx-0 mb-4 sm:mb-6 text-primary">
                  <User size={32} className="sm:w-12 sm:h-12" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-1">{client.user_name}</h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 sm:mb-6">Active Client</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                  {client.user_phone && (
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Phone Number</p>
                      <p className="text-sm font-bold text-primary">{client.user_phone}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Bookings</p>
                      <p className="text-base sm:text-lg font-black">{client.bookings.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Sessions</p>
                      <p className="text-base sm:text-lg font-black">{client.sessions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 hidden lg:block">
                  <button 
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="space-y-8">
                {/* Active Packages */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <Package size={16} /> Active Packages
                  </h3>
                  <div className="space-y-3">
                    {client.bookings.map((booking: any) => (
                      <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                        <div>
                          <p className="font-bold text-sm">{booking.package_name || 'Personal Training'}</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">
                            {booking.sessions_completed} / {booking.total_sessions} Sessions Done
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-400 text-sm">₹{booking.total_amount}</p>
                          <p className="text-[9px] text-white/20 font-bold uppercase mt-1">{booking.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Timeline */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Session History
                  </h3>
                  <div className="space-y-4">
                    {client.sessions.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((session: any) => (
                      <div key={session.id} className="relative pl-6 border-l border-white/10">
                        <div className={clsx(
                          "absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-black",
                          session.status === 'completed' ? "bg-emerald-500" :
                          session.status === 'scheduled' ? "bg-primary" :
                          "bg-white/20"
                        )} />
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/20 transition-all group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <p className="font-bold text-sm">
                                {new Date(session.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                  <Clock size={12} /> {session.scheduled_time}
                                </span>
                                <span className="text-[10px] text-white/20">•</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                  {session.session_type} Session
                                </span>
                              </div>
                            </div>
                            <div className={clsx(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 w-fit",
                              session.status === 'completed' ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                              session.status === 'scheduled' ? "text-primary border-primary/20 bg-primary/10" :
                              "text-white/40 border-white/10 bg-white/5"
                            )}>
                              {session.status}
                            </div>
                          </div>

                          {session.location && (
                            <div className="flex items-start gap-3 p-4 bg-black/20 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                              <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Session Location</p>
                                <p className="text-xs font-bold text-white/60 leading-relaxed truncate md:whitespace-normal">{session.location}</p>
                              </div>
                            </div>
                          )}

                          {session.trainer_notes && (
                            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                              <p className="text-[9px] font-black text-amber-500/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <MessageCircle size={10} /> Session Notes
                              </p>
                              <p className="text-xs text-white/50 leading-relaxed italic">"{session.trainer_notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ScheduleSection = ({ availability, onViewManage }: { availability: any[] | undefined; onViewManage: () => void }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold">Weekly Schedule</h3>
      <button onClick={onViewManage} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:text-white border border-primary/30 px-3 py-1.5 rounded-lg bg-primary/10 transition-colors">Manage Slots</button>
    </div>
    
    {availability && availability.length > 0 ? (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availability.map((avail, idx) => (
          <div key={idx} className="glass-card p-4 flex items-center justify-between hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm",
                avail.is_available ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-white/20 border border-white/10"
              )}>
                {(avail.day_name || 'DAY').substring(0, 3)}
              </div>
              <div>
                <p className="font-bold text-sm">{avail.day_name}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {avail.is_available ? `${avail.start_time} - ${avail.end_time}` : 'Unavailable'}
                </p>
              </div>
            </div>
            {avail.is_available && (
               <span className={clsx(
                 "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border",
                 avail.session_type === 'online' ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                 avail.session_type === 'offline' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                 "text-primary bg-primary/10 border-primary/20"
               )}>
                 {avail.session_type}
               </span>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="glass-card p-10 text-center border-dashed">
        <p className="text-white/40 text-sm">No regular schedule defined yet.</p>
      </div>
    )}
  </div>
);

const SessionsSection = ({ sessions, loading, filter, setFilter, onAction }: any) => {
  const filtered = sessions.filter((s: any) => 
    filter === 'pending' ? s.status === 'pending_confirmation' : s.status !== 'pending_confirmation'
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-bold italic uppercase tracking-tighter">Session Management</h3>
         <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            <button 
              onClick={() => setFilter('pending')}
              className={clsx("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'pending' ? "bg-primary text-black" : "text-white/40 hover:text-white")}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('upcoming')}
              className={clsx("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'upcoming' ? "bg-primary text-black" : "text-white/40 hover:text-white")}
            >
              Scheduled
            </button>
         </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
           <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Refreshing sessions...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {filtered.map((session: any) => (
             <div key={session.id} className="glass-card p-6 space-y-5 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary overflow-hidden">
                        {session.user_avatar ? <img src={session.user_avatar} className="w-full h-full object-cover" /> : <User size={24} />}
                      </div>
                      <div>
                         <h4 className="font-bold text-lg leading-tight">{session.user_name || 'Member'}</h4>
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{session.session_type} Session</p>
                      </div>
                   </div>
                   <div className={clsx(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      session.status === 'pending_confirmation' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      session.status === 'scheduled' ? "bg-primary/10 text-primary border-primary/20" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                   )}>
                      {session.status.replace(/_/g, ' ')}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Date & Time</p>
                      <p className="text-xs font-bold">{new Date(session.scheduled_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {session.scheduled_time}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Duration</p>
                      <p className="text-xs font-bold">{session.duration_minutes} Minutes</p>
                   </div>
                </div>

                {session.location && (
                   <div className="flex items-center gap-2 text-white/40">
                      <MapPin size={12} className="text-primary" />
                      <p className="text-[10px] font-bold truncate">{session.location}</p>
                   </div>
                )}

                {session.status === 'pending_confirmation' && (
                   <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => onAction(session.id, 'reject')}
                        className="flex-1 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all"
                      >
                         Decline
                      </button>
                      <button 
                        onClick={() => onAction(session.id, 'accept')}
                        className="flex-2 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_10px_20px_rgba(241,130,44,0.1)]"
                      >
                         Accept Session
                      </button>
                   </div>
                )}
             </div>
           ))}
        </div>
      ) : (
        <div className="glass-card p-20 text-center border-dashed">
           <Clock className="mx-auto mb-4 text-white/10" size={48} />
           <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No {filter} sessions found</p>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
