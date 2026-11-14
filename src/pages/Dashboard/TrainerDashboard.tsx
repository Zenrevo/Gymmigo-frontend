import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
const TAB_IDS: TabType[] = ['overview', 'clients', 'packages', 'schedule', 'sessions', 'bookings', 'certifications', 'gallery', 'reviews', 'settings'];

const TrainerDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabType | null;
  const activeTab: TabType = requestedTab && TAB_IDS.includes(requestedTab) ? requestedTab : 'overview';
  const setActiveTab = useCallback(
    (tab: TabType) => setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'overview') next.delete('tab'); else next.set('tab', tab);
      return next;
    }),
    [setSearchParams],
  );
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
      <div className="relative overflow-hidden bg-surface border border-border rounded-gm-xl shadow-card p-0">
        <div className={clsx(
          "absolute inset-0 opacity-20 transition-colors duration-700",
          isOnline ? "bg-gradient-to-br from-success/30 to-transparent" : "bg-gradient-to-br from-danger/20 to-transparent"
        )} />
        
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={clsx(
              "w-14 h-14 sm:w-20 sm:h-20 rounded-gm-lg sm:rounded-gm-xl flex items-center justify-center relative transition-all duration-500 border-2 shrink-0",
              isOnline 
                ? "bg-success-soft border-success/30" 
                : "bg-danger-soft border-danger/30"
            )}>
              {isOnline && (
                <div className="absolute inset-0 rounded-gm-lg sm:rounded-gm-xl bg-success-soft animate-ping" style={{ animationDuration: '2s' }} />
              )}
              <Zap size={28} className={clsx("relative z-10 sm:w-8 sm:h-8", isOnline ? "text-success" : "text-danger")} />
            </div>
            
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight truncate">
                  {isOnline ? 'You’re online' : 'You’re offline'}
                </h2>
                {stats?.verification_status === 'verified' && (
                  <span className="text-info text-[8px] font-bold bg-info-soft px-2 py-0.5 rounded-full border border-info/30 uppercase tracking-widest flex items-center gap-1 shrink-0">
                    <Shield size={8} /> Verified
                  </span>
                )}
              </div>
              <p className="text-ink-muted text-[11px] sm:text-sm max-w-[200px] sm:max-w-none truncate sm:whitespace-normal">
                {isOnline 
                  ? 'Members can discover and book sessions' 
                  : 'You won\'t appear in search results.'
                }
              </p>
              {stats?.profile_completion_pct !== undefined && stats.profile_completion_pct < 100 && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Profile {stats.profile_completion_pct}%</span>
                  <div className="h-1 w-24 sm:w-32 bg-surface-sunken rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${stats.profile_completion_pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={clsx(
              "w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-gm-lg font-bold text-xs sm:text-sm uppercase tracking-widest transition-all border-2 min-w-[160px] sm:min-w-[180px]",
              isOnline 
                ? "bg-danger-soft border-danger/30 text-danger hover:bg-danger-soft" 
                : "bg-success-soft border-success/30 text-success hover:bg-success-soft"
            )}
          >
            {toggling ? (
              <span className="flex items-center justify-center gap-2">
                <Activity size={16} className="animate-spin" /> ...
              </span>
            ) : isOnline ? 'Go offline' : 'Go online'}
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div role="tablist" aria-label="Trainer sections" className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 t-button-sm transition-colors",
              activeTab === tab.id
                ? "border-transparent bg-selection text-on-selection"
                : "border-border bg-surface text-ink-muted hover:text-ink"
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
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-4 sm:p-6 text-center hover:border-success/30 transition-colors">
                    <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest mb-2">Today\'s Earnings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-success">₹{(stats?.today_earnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-4 sm:p-6 text-center hover:border-border-strong transition-colors">
                    <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest mb-2">This Month</p>
                    <p className="text-2xl sm:text-3xl font-bold text-ink">₹{(stats?.this_month_earnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-4 sm:p-6 text-center hover:border-accent-border transition-colors">
                    <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest mb-2">Rating</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star size={20} className="text-accent-text fill-accent w-4 h-4 sm:w-5 sm:h-5" />
                      <p className="text-2xl sm:text-3xl font-bold text-accent-text">{stats?.rating_avg?.toFixed(1) || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Clients', value: stats?.total_clients || 0, icon: Users, color: 'text-info', bg: 'bg-info' },
                    { label: 'Total Sessions', value: stats?.total_sessions || 0, icon: Calendar, color: 'text-info', bg: 'bg-info' },
                    { label: 'Completion Rate', value: `${stats?.completion_rate || 100}%`, icon: CheckCircle2, color: 'text-success', bg: 'bg-success' },
                    { label: 'Today\'s Sessions', value: `${stats?.completed_today || 0}/${(stats?.completed_today || 0) + (stats?.remaining_today || 0)}`, icon: Timer, color: 'text-primary', bg: 'bg-primary' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-surface border border-border rounded-gm-xl shadow-card p-5 relative overflow-hidden group hover:border-border transition-colors"
                    >
                      <stat.icon size={60} className={`absolute -right-3 -bottom-3 ${stat.bg}/5 group-hover:${stat.bg}/10 transition-all`} />
                      <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest mb-3 flex items-center gap-2">
                        <stat.icon size={12} className={stat.color} />
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Today's Sessions */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-border flex items-center justify-center">
                          <Clock size={16} className="text-accent-text" />
                        </div>
                        Today's Schedule
                      </h3>
                      <div className="flex gap-4">
                        <button onClick={() => setActiveTab('clients')} className="text-[10px] text-accent-text hover:text-ink uppercase tracking-widest font-bold">My Clients</button>
                        <button onClick={() => setActiveTab('schedule')} className="text-[10px] text-ink-muted hover:text-ink uppercase tracking-widest font-bold">Full Schedule</button>
                      </div>
                    </div>

                    {groupedTodaySessions.length > 0 ? (
                      <div className="space-y-6">
                        {groupedTodaySessions.map((group, gIdx) => (
                          <div key={group.client_name + gIdx} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent-border flex items-center justify-center">
                                <User size={14} className="text-accent-text" />
                              </div>
                              <h4 className="text-sm font-bold text-ink-muted tracking-widest uppercase">{group.client_name}</h4>
                              <div className="flex-1 h-px bg-surface-sunken" />
                            </div>
                            <div className="space-y-3">
                              {group.sessions.map((session: any) => (
                                <div key={session.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group hover:border-border transition-all relative">
                                  {/* Mobile Corner Status Pin */}
                                  <div className={clsx(
                                    "sm:hidden absolute top-3 right-3 w-2 h-2 rounded-full",
                                    session.status === 'completed' ? "bg-success" :
                                    session.status === 'in_progress' ? "bg-accent animate-pulse" :
                                    "bg-surface-sunken"
                                  )} />

                                  {/* Timeline Dot (Desktop only) */}
                                  <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                                    <div className={clsx(
                                      "w-3 h-3 rounded-full border-2",
                                      session.status === 'completed' ? "bg-success border-success" :
                                      session.status === 'in_progress' ? "bg-accent border-accent animate-pulse" :
                                      "bg-transparent border-border-strong"
                                    )} />
                                  </div>

                                  {/* Time & Client */}
                                  <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
                                    <div className="w-14 sm:w-16 shrink-0 text-left sm:text-center">
                                      <p className="text-xs sm:text-sm font-bold">{session.scheduled_time}</p>
                                      <p className="text-[8px] sm:text-[9px] text-ink-subtle font-bold uppercase">{session.duration_minutes}m</p>
                                    </div>
                                    <div className="w-px h-6 sm:h-8 bg-surface-sunken shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={clsx(
                                          "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                          session.session_type === 'online' ? "text-info bg-info-soft border-info/30" :
                                          session.session_type === 'home' ? "text-info bg-info-soft border-info/30" :
                                          "text-success bg-success-soft border-success/30"
                                        )}>
                                          {session.session_type}
                                        </span>
                                        {session.location && (
                                          <span className="text-[9px] sm:text-[10px] text-ink-muted truncate max-w-[120px] sm:max-w-[150px]" title={session.location}>
                                            • {session.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Status Pill */}
                                  <div className={clsx(
                                    "hidden sm:block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0",
                                    session.status === 'completed' ? "text-success border border-success/30 bg-success-soft" :
                                    session.status === 'in_progress' ? "text-accent-text border border-accent-border bg-accent-soft" :
                                    "text-ink-muted border border-border bg-surface-raised"
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
                      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-10 text-center border-dashed text-ink-subtle">
                        <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold">No sessions scheduled for today</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pending Requests */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-warning-soft border border-warning/30 flex items-center justify-center">
                          <Package size={16} className="text-warning" />
                        </div>
                        Recent Purchases
                      </h3>
                      {data?.pending_bookings && data.pending_bookings.length > 0 && (
                        <span className="text-[10px] font-bold bg-accent-soft text-accent-text px-2 py-0.5 rounded-full border border-accent-border">
                          {data.pending_bookings.length}
                        </span>
                      )}
                    </div>

                    {data?.pending_bookings && data.pending_bookings.length > 0 ? (
                      <div className="space-y-3">
                        {data.pending_bookings.map((booking) => (
                          <div key={booking.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-4 border-l-2 border-l-primary/50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-sm truncate">{booking.client_name}</p>
                                <p className="text-[10px] text-ink-muted uppercase font-bold">{booking.package_name}</p>
                              </div>
                              <p className="text-sm font-bold text-success">₹{booking.total_amount}</p>
                            </div>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                              Package paid. Sessions should be confirmed from the Sessions tab.
                            </p>
                          </div>
                        ))}
                        <button onClick={() => setActiveTab('bookings')} className="w-full text-center text-[10px] text-ink-subtle hover:text-ink uppercase font-bold py-2">View All Bookings</button>
                      </div>
                    ) : (
                      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-8 text-center border-dashed text-ink-subtle">
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
                  <button onClick={() => setIsPackageModalOpen(true)} className="flex items-center gap-2 bg-accent text-on-accent px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-pressed transition-colors">
                    <Plus size={16} /> Create Package
                  </button>
                </div>
                
                {data?.packages && data.packages.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.packages.map(pkg => (
                      <div key={pkg.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4 hover:border-accent-border transition-all flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg">{pkg.name}</h4>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-accent-text bg-accent-soft px-2 py-0.5 rounded border border-accent-border">
                              {pkg.package_type}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-success">₹{pkg.price}</p>
                            <p className="text-[10px] text-ink-subtle font-bold uppercase">{pkg.total_sessions} Sessions</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-ink-muted flex-1">{pkg.description || 'No description provided.'}</p>
                        <div className="pt-4 border-t border-border flex justify-between items-center">
                          <span className="text-[10px] text-ink-subtle font-bold uppercase">Valid: {pkg.validity_days} days</span>
                          <button className="text-[10px] text-accent-text font-bold uppercase tracking-widest hover:text-ink transition-colors">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center border-dashed border-border">
                    <Package size={48} className="mx-auto mb-4 text-ink-subtle" />
                    <p className="font-bold text-lg mb-2">No packages created</p>
                    <p className="text-sm text-ink-muted mb-6">Create service packages (monthly, weekly, or specific sessions) for clients to book.</p>
                    <button onClick={() => setIsPackageModalOpen(true)} className="bg-accent-soft text-accent-text border border-accent-border px-6 py-2 rounded-xl font-bold text-sm hover:bg-accent hover:text-on-accent transition-colors">Create First Package</button>
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
                  <div className="flex bg-surface-raised rounded-xl p-1">
                     <button 
                       onClick={() => setBookingFilter('active')}
                       className={clsx(
                         "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                         bookingFilter === 'active' ? "bg-accent text-on-accent shadow-lg" : "text-ink-muted hover:text-ink"
                       )}
                     >
                        Active
                     </button>
                     <button 
                       onClick={() => setBookingFilter('past')}
                       className={clsx(
                         "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                         bookingFilter === 'past' ? "bg-accent text-on-accent shadow-lg" : "text-ink-muted hover:text-ink"
                       )}
                     >
                        Past
                     </button>
                  </div>
                </div>

                {bookingsLoading ? (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center text-ink-subtle">Loading bookings...</div>
                ) : allBookings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {allBookings
                      .filter(b => bookingFilter === 'active' ? (b.status === 'confirmed' || b.status === 'pending') : (b.status === 'completed' || b.status === 'cancelled'))
                      .map((booking) => (
                      <div 
                        key={booking.id} 
                        onClick={() => setSelectedClient(clients.find(c => c.user_id === booking.user_id))}
                        className="bg-surface border border-border rounded-gm-xl shadow-card p-5 flex items-center justify-between group cursor-pointer hover:border-accent-border transition-all border border-transparent"
                      >
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                             "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                             booking.status === 'pending' ? "bg-warning-soft border-warning/30 text-warning" : "bg-surface-raised border-border text-accent-text group-hover:bg-accent-soft"
                          )}>
                            <User size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold group-hover:text-accent-text transition-colors">{booking.user_name || 'Member'}</h4>
                            <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">{booking.package_name || 'Personal Training'}</p>
                          </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-6">
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest mb-1">Sessions</p>
                            <p className="text-sm font-bold">
                              {booking.sessions_completed} <span className="text-ink-subtle font-medium">/ {booking.total_sessions}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={clsx(
                              "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                              booking.status === 'confirmed' ? 'bg-success-soft text-success border border-success/30' :
                              booking.status === 'pending' ? 'bg-warning-soft text-warning border border-warning/30' :
                              booking.status === 'completed' ? 'bg-info-soft text-info border border-info/30' :
                              'bg-surface-raised text-ink-subtle border border-border'
                            )}>
                              {booking.status}
                            </span>
                          </div>
                          <ArrowRight size={18} className="text-ink-subtle group-hover:text-accent-text transition-all group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                    {allBookings.filter(b => bookingFilter === 'active' ? (b.status === 'confirmed' || b.status === 'pending') : (b.status === 'completed' || b.status === 'cancelled')).length === 0 && (
                      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center border-dashed text-ink-subtle">
                        <Users size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No {bookingFilter} bookings found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center border-dashed">
                    <Users className="mx-auto mb-4 text-ink-subtle" size={48} />
                    <p className="text-ink-muted text-sm font-bold">No bookings recorded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── CERTIFICATIONS TAB ── */}
            {activeTab === 'certifications' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Professional Certifications</h3>
                  <button onClick={() => setIsCertModalOpen(true)} className="flex items-center gap-2 bg-accent-soft text-accent-text border border-accent-border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-soft transition-colors">
                    <Plus size={16} /> Add Cert
                  </button>
                </div>
                 {data?.certifications && data.certifications.length > 0 ? (
                   <div className="grid md:grid-cols-2 gap-4">
                     {data.certifications.map(cert => (
                       <div key={cert.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-5 relative overflow-hidden flex flex-col gap-2 border-l-4 border-l-primary/50">
                         <div className="flex justify-between items-start">
                           <h4 className="font-bold text-sm pr-4">{cert.name}</h4>
                           {cert.is_verified ? (
                             <Shield size={16} className="text-info shrink-0" />
                           ) : (
                             <AlertTriangle size={16} className="text-warning shrink-0" />
                           )}
                         </div>
                         <p className="text-xs text-ink-muted">{cert.issued_by}</p>
                         <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">
                           {cert.is_verified ? <span className="text-info">Verified</span> : <span className="text-warning">Pending Review</span>}
                         </p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="bg-surface border border-border rounded-gm-xl shadow-card p-10 text-center border-dashed text-ink-subtle">
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
                   <div onClick={() => setIsProfModalOpen(true)} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex items-center justify-between hover:border-border-strong transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center border border-border"><Briefcase size={18} className="text-ink-muted"/></div>
                       <div>
                         <p className="font-bold text-sm">Professional Details</p>
                         <p className="text-[10px] text-ink-subtle uppercase tracking-widest">Experience, Bio, Languages</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-ink-subtle" />
                   </div>
                   <div onClick={() => setIsPricingModalOpen(true)} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex items-center justify-between hover:border-border-strong transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center border border-border"><DollarSign size={18} className="text-ink-muted"/></div>
                       <div>
                         <p className="font-bold text-sm">Pricing & Service Info</p>
                         <p className="text-[10px] text-ink-subtle uppercase tracking-widest">Rates, Duration, Availability Mode</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-ink-subtle" />
                   </div>
                   <div onClick={() => setIsLocationModalOpen(true)} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex items-center justify-between hover:border-border-strong transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center border border-border"><MapPin size={18} className="text-ink-muted"/></div>
                       <div>
                         <p className="font-bold text-sm">Location settings</p>
                         <p className="text-[10px] text-ink-subtle uppercase tracking-widest">Pin working address</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-ink-subtle" />
                   </div>
                 </div>
               </div>
            )}

            {/* ── GALLERY / PORTFOLIO TAB ── */}
            {activeTab === 'gallery' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Portfolio Gallery</h3>
                  <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">{galleryImages.length} photo{galleryImages.length !== 1 && 's'}</p>
                </div>

                {galleryLoading ? (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center">
                    <Loader2 className="mx-auto mb-3 animate-spin text-accent-text" size={32} />
                    <p className="text-ink-subtle text-xs font-bold uppercase tracking-widest">Loading portfolio...</p>
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
                      <div key={img.id} className="aspect-square rounded-gm-lg overflow-hidden relative group border border-border hover:border-border-strong transition-all">
                        <img src={img.image_url} alt={img.caption || 'Portfolio'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleDeleteGalleryImage(img.id)}
                            disabled={deletingImageId === img.id}
                            className="w-10 h-10 rounded-full bg-danger-soft backdrop-blur-md border border-danger/30 flex items-center justify-center text-danger hover:bg-danger/40 transition-colors"
                          >
                            {deletingImageId === img.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <p className="text-[10px] text-ink-muted font-bold truncate">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!galleryLoading && galleryImages.length === 0 && (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-10 text-center border-dashed">
                    <ImageIcon className="mx-auto mb-4 text-ink-subtle" size={48} />
                    <p className="text-ink-muted text-sm font-bold">Build your visual portfolio by uploading transformation photos, certifications, and training content.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Reviews Summary */}
                <div className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent-text">{reviewsMeta.avg_rating?.toFixed(1) || '—'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12} className={clsx(i <= Math.round(reviewsMeta.avg_rating) ? 'text-accent-text fill-accent' : 'text-ink-subtle')} />
                        ))}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-surface-sunken" />
                    <div>
                      <p className="text-lg font-bold">{reviewsMeta.total}</p>
                      <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">Total Reviews</p>
                    </div>
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-12 text-center">
                    <Loader2 className="mx-auto mb-3 animate-spin text-accent-text" size={32} />
                    <p className="text-ink-subtle text-xs font-bold uppercase tracking-widest">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-4 hover:border-border transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center overflow-hidden">
                              {rev.avatar_url ? (
                                <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="text-ink-subtle" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">{rev.user_name || 'Anonymous'}</p>
                                {rev.is_verified_client && (
                                  <span className="text-[8px] font-bold bg-info-soft text-info px-2 py-0.5 rounded-full border border-info/30 uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={8} /> Verified Client
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} size={10} className={clsx(i <= rev.rating ? 'text-accent-text fill-accent' : 'text-ink-subtle')} />
                                ))}
                                <span className="text-[9px] text-ink-subtle ml-2 font-bold">
                                  {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {rev.title && (
                          <p className="text-sm font-bold text-ink-muted">"{rev.title}"</p>
                        )}
                        {rev.review && (
                          <p className="text-sm text-ink-muted leading-relaxed">{rev.review}</p>
                        )}

                        {/* Sub-Ratings */}
                        {(rev.professionalism_rating || rev.knowledge_rating || rev.punctuality_rating) && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {rev.professionalism_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-surface-raised border border-border text-ink-muted uppercase tracking-widest">
                                Professionalism: <span className="text-ink-muted">{rev.professionalism_rating}/5</span>
                              </div>
                            )}
                            {rev.knowledge_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-surface-raised border border-border text-ink-muted uppercase tracking-widest">
                                Knowledge: <span className="text-ink-muted">{rev.knowledge_rating}/5</span>
                              </div>
                            )}
                            {rev.punctuality_rating && (
                              <div className="text-[9px] font-bold px-3 py-1 rounded-full bg-surface-raised border border-border text-ink-muted uppercase tracking-widest">
                                Punctuality: <span className="text-ink-muted">{rev.punctuality_rating}/5</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trainer Response */}
                        {rev.trainer_response && (
                          <div className="bg-accent-soft border border-accent-border rounded-xl p-4 mt-2">
                            <p className="text-[10px] font-bold text-accent-text uppercase tracking-widest mb-1">Your Response</p>
                            <p className="text-xs text-ink-muted">{rev.trainer_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-gm-xl shadow-card p-10 text-center border-dashed">
                    <MessageCircle className="mx-auto mb-4 text-ink-subtle" size={48} />
                    <p className="text-ink-muted text-sm font-bold">No reviews yet. Complete sessions to start getting feedback from clients.</p>
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
        <h3 className="text-xl font-bold tracking-tight">My Clients</h3>
        <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">{clients.length} Active Client{clients.length !== 1 && 's'}</p>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div 
              key={client.user_id} 
              onClick={() => onSelectClient(client)}
              className="bg-surface border border-border rounded-gm-xl shadow-card p-6 flex items-center justify-between group cursor-pointer hover:border-accent-border transition-all border border-transparent"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-gm-lg bg-surface-raised border border-border flex items-center justify-center text-accent-text group-hover:bg-accent-soft transition-all overflow-hidden">
                  <User size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-lg group-hover:text-accent-text transition-colors">{client.user_name}</h4>
                  <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">
                    {client.bookings.length} Package{client.bookings.length !== 1 && 's'} • {client.sessions.length} Session{client.sessions.length !== 1 && 's'}
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-ink-subtle group-hover:text-accent-text transition-all group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-gm-xl shadow-card p-20 text-center border-dashed">
          <Users className="mx-auto mb-4 text-ink-subtle" size={48} />
          <p className="text-ink-muted text-sm font-bold uppercase tracking-widest">No clients found yet</p>
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
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />
            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-surface border border-border rounded-gm-xl shadow-card p-0 flex flex-col lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel: Client Info */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-6 sm:p-8 bg-surface-raised">
              <div className="text-center lg:text-left">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-gm-lg sm:rounded-gm-xl bg-accent-soft border-2 border-accent-border flex items-center justify-center mx-auto lg:mx-0 mb-4 sm:mb-6 text-accent-text">
                  <User size={32} className="sm:w-12 sm:h-12" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">{client.user_name}</h2>
                <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest mb-4 sm:mb-6">Active Client</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                  {client.user_phone && (
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Phone Number</p>
                      <p className="text-sm font-bold text-accent-text">{client.user_phone}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Bookings</p>
                      <p className="text-base sm:text-lg font-bold">{client.bookings.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Sessions</p>
                      <p className="text-base sm:text-lg font-bold">{client.sessions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border hidden lg:block">
                  <button 
                    onClick={onClose}
                    className="w-full py-4 rounded-gm-lg bg-surface-raised border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-surface-sunken transition-all"
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
                  <h3 className="text-sm font-bold uppercase tracking-widest text-accent-text mb-4 flex items-center gap-2">
                    <Package size={16} /> Active Packages
                  </h3>
                  <div className="space-y-3">
                    {client.bookings.map((booking: any) => (
                      <div key={booking.id} className="bg-surface-raised border border-border rounded-gm-lg p-4 flex items-center justify-between hover:bg-surface-sunken transition-all">
                        <div>
                          <p className="font-bold text-sm">{booking.package_name || 'Personal Training'}</p>
                          <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest mt-1">
                            {booking.sessions_completed} / {booking.total_sessions} Sessions Done
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success text-sm">₹{booking.total_amount}</p>
                          <p className="text-[9px] text-ink-subtle font-bold uppercase mt-1">{booking.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Timeline */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-accent-text mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Session History
                  </h3>
                  <div className="space-y-4">
                    {client.sessions.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((session: any) => (
                      <div key={session.id} className="relative pl-6 border-l border-border">
                        <div className={clsx(
                          "absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-black",
                          session.status === 'completed' ? "bg-success" :
                          session.status === 'scheduled' ? "bg-accent" :
                          "bg-surface-sunken"
                        )} />
                        <div className="bg-surface-raised border border-border rounded-gm-lg p-5 hover:border-border-strong transition-all group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <p className="font-bold text-sm">
                                {new Date(session.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-ink-muted">
                                  <Clock size={12} /> {session.scheduled_time}
                                </span>
                                <span className="text-[10px] text-ink-subtle">•</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                                  {session.session_type} Session
                                </span>
                              </div>
                            </div>
                            <div className={clsx(
                              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shrink-0 w-fit",
                              session.status === 'completed' ? "text-success border-success/30 bg-success-soft" :
                              session.status === 'scheduled' ? "text-accent-text border-accent-border bg-accent-soft" :
                              "text-ink-muted border-border bg-surface-raised"
                            )}>
                              {session.status}
                            </div>
                          </div>

                          {session.location && (
                            <div className="flex items-start gap-3 p-4 bg-surface-sunken rounded-xl border border-border group-hover:border-border transition-all">
                              <MapPin size={16} className="text-accent-text shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-1">Session Location</p>
                                <p className="text-xs font-bold text-ink-muted leading-relaxed truncate md:whitespace-normal">{session.location}</p>
                              </div>
                            </div>
                          )}

                          {session.trainer_notes && (
                            <div className="mt-4 p-4 bg-warning-soft border border-warning/30 rounded-xl">
                              <p className="text-[9px] font-bold text-warning uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <MessageCircle size={10} /> Session Notes
                              </p>
                              <p className="text-xs text-ink-muted leading-relaxed ">"{session.trainer_notes}"</p>
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
      <button onClick={onViewManage} className="text-[10px] text-accent-text font-bold uppercase tracking-widest hover:text-ink border border-accent-border px-3 py-1.5 rounded-lg bg-accent-soft transition-colors">Manage Slots</button>
    </div>
    
    {availability && availability.length > 0 ? (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availability.map((avail, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-gm-xl shadow-card p-4 flex items-center justify-between hover:border-border-strong transition-all">
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm",
                avail.is_available ? "bg-accent-soft text-accent-text border border-accent-border" : "bg-surface-raised text-ink-subtle border border-border"
              )}>
                {(avail.day_name || 'DAY').substring(0, 3)}
              </div>
              <div>
                <p className="font-bold text-sm">{avail.day_name}</p>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  {avail.is_available ? `${avail.start_time} - ${avail.end_time}` : 'Unavailable'}
                </p>
              </div>
            </div>
            {avail.is_available && (
               <span className={clsx(
                 "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border",
                 avail.session_type === 'online' ? "text-info bg-info-soft border-info/30" :
                 avail.session_type === 'offline' ? "text-success bg-success-soft border-success/30" :
                 "text-accent-text bg-accent-soft border-accent-border"
               )}>
                 {avail.session_type}
               </span>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-surface border border-border rounded-gm-xl shadow-card p-10 text-center border-dashed">
        <p className="text-ink-muted text-sm">No regular schedule defined yet.</p>
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
         <h3 className="text-xl font-bold tracking-tight">Session Management</h3>
         <div className="flex bg-surface-raised rounded-xl p-1 border border-border">
            <button 
              onClick={() => setFilter('pending')}
              className={clsx("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", filter === 'pending' ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink")}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('upcoming')}
              className={clsx("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", filter === 'upcoming' ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink")}
            >
              Scheduled
            </button>
         </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
           <Loader2 className="animate-spin text-accent-text mx-auto mb-4" size={32} />
           <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Refreshing sessions...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {filtered.map((session: any) => (
             <div key={session.id} className="bg-surface border border-border rounded-gm-xl shadow-card p-6 space-y-5 group hover:border-accent-border transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-gm-lg bg-surface-raised border border-border flex items-center justify-center text-accent-text overflow-hidden">
                        {session.user_avatar ? <img src={session.user_avatar} className="w-full h-full object-cover" /> : <User size={24} />}
                      </div>
                      <div>
                         <h4 className="font-bold text-lg leading-tight">{session.user_name || 'Member'}</h4>
                         <p className="text-[10px] text-ink-muted font-bold uppercase tracking-[0.2em]">{session.session_type} Session</p>
                      </div>
                   </div>
                   <div className={clsx(
                      "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                      session.status === 'pending_confirmation' ? "bg-warning-soft text-warning border-warning/30" :
                      session.status === 'scheduled' ? "bg-accent-soft text-accent-text border-accent-border" :
                      "bg-success-soft text-success border-success/30"
                   )}>
                      {session.status.replace(/_/g, ' ')}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[9px] text-ink-subtle font-bold uppercase tracking-widest">Date & Time</p>
                      <p className="text-xs font-bold">{new Date(session.scheduled_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {session.scheduled_time}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-ink-subtle font-bold uppercase tracking-widest">Duration</p>
                      <p className="text-xs font-bold">{session.duration_minutes} Minutes</p>
                   </div>
                </div>

                {session.location && (
                   <div className="flex items-center gap-2 text-ink-muted">
                      <MapPin size={12} className="text-accent-text" />
                      <p className="text-[10px] font-bold truncate">{session.location}</p>
                   </div>
                )}

                {session.status === 'pending_confirmation' && (
                   <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => onAction(session.id, 'reject')}
                        className="flex-1 py-3 rounded-xl border border-danger/30 text-danger text-[10px] font-bold uppercase tracking-widest hover:bg-danger-soft transition-all"
                      >
                         Decline
                      </button>
                      <button 
                        onClick={() => onAction(session.id, 'accept')}
                        className="flex-2 py-3 rounded-xl bg-accent text-on-accent text-[10px] font-bold uppercase tracking-widest hover:bg-accent-pressed transition-all shadow-raised"
                      >
                         Accept Session
                      </button>
                   </div>
                )}
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-gm-xl shadow-card p-20 text-center border-dashed">
           <Clock className="mx-auto mb-4 text-ink-subtle" size={48} />
           <p className="text-ink-muted text-sm font-bold uppercase tracking-widest">No {filter} sessions found</p>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
