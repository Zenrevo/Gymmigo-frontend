import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, MapPin, 
  User, Package, DollarSign, Activity, Users,
  CheckCircle2, XCircle, Phone, MessageSquare,
  ShieldCheck, AlertCircle, Info, Timer, Globe,
  Loader2, ArrowRight
} from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { useGeoLocation } from '../context/LocationContext';
import clsx from 'clsx';

interface Booking {
  id: string;
  user_id: string;
  trainer_id: string;
  trainer_name?: string;
  trainer_phone?: string;
  user_name?: string;
  user_phone?: string;
  package_name?: string;
  total_sessions: number;
  sessions_completed: number;
  sessions_remaining: number;
  session_type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  trainer_latitude?: number;
  trainer_longitude?: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  user_notes?: string;
  trainer_notes?: string;
  trainer_location?: string;
  scheduled_time?: string;
  start_date: string;
  created_at: string;
}

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  role: 'user' | 'trainer';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onRefresh?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const BookingDetailModal = ({ isOpen, onClose, booking, role, onAccept, onReject, onRefresh }: BookingDetailModalProps) => {
  const navigate = useNavigate();
  const { isLoaded } = useGeoLocation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<any>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_type: booking?.session_type || 'gym',
    location: booking?.location || '',
  });

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen && booking) {
        const fetchSessions = async () => {
            setSessionsLoading(true);
            try {
                // Fetch by trainer_id to catch all sessions for this pair
                const res = await axios.get(`${API_URL}/trainer-bookings/sessions/my?trainer_id=${booking.trainer_id}`);
                setSessions(res.data.data?.sessions || []);
            } catch (err) {
                console.error('Failed to fetch sessions:', err);
            } finally {
                setSessionsLoading(false);
            }
        };
        fetchSessions();
    }
  }, [isOpen, booking]);

  const handleCancelSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this session? Your balance will be refunded.')) return;
    try {
        await axios.post(`${API_URL}/trainer-bookings/sessions/${sessionId}/cancel`);
        const res = await axios.get(`${API_URL}/trainer-bookings/sessions/my?trainer_id=${booking?.trainer_id}`);
        setSessions(res.data.data?.sessions || []);
        onRefresh?.();
    } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to cancel session');
    }
  };

  const fetchSlots = async (date: string) => {
    if (!booking) return;
    setSlotsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/trainers/${booking.trainer_id}/available-slots`, {
        params: { date }
      });
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    fetchSlots(date);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
        alert('Please select date and time slot');
        return;
    }

    setIsSubmitting(true);
    try {
        await axios.post(`${API_URL}/trainer-bookings/bookings/${booking?.id}/schedule-session`, {
            ...formData,
            scheduled_date: selectedDate,
            scheduled_time: selectedSlot,
        });
        setIsScheduling(false);
        // Refresh sessions list
        const res = await axios.get(`${API_URL}/trainer-bookings/sessions/my?trainer_id=${booking?.trainer_id}`);
        setSessions(res.data.data?.sessions || []);
        onRefresh?.();
        alert('Session scheduled successfully!');
    } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to schedule session');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  const isPending = booking.status === 'pending';
  const progress = (booking.sessions_completed / booking.total_sessions) * 100;

  const mapLat = booking.latitude || booking.trainer_latitude;
  const mapLng = booking.longitude || booking.trainer_longitude;
  const hasCoordinates = !!(mapLat && mapLng);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] sm:max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 sm:p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 active:scale-95"
            >
              <X size={18} />
            </button>
            <div className="space-y-3 sm:space-y-4">
              <span className={clsx(
                "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] px-3 sm:px-4 py-1.5 rounded-full border inline-block shadow-sm",
                booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                booking.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-white/5 text-white/20 border-white/10"
              )}>
                {booking.status} Booking
              </span>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-display font-black tracking-tighter italic uppercase flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-white truncate">{role === 'trainer' ? booking.user_name || 'Member' : booking.trainer_name || 'Pro Trainer'}</span>
                  {((role === 'trainer' && booking.user_phone) || (role === 'user' && booking.trainer_phone)) && (
                     <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 rounded-lg sm:rounded-xl border border-primary/20 w-fit">
                        <Phone size={10} className="text-primary" />
                        <span className="text-[10px] sm:text-xs font-black text-primary not-italic tracking-wider uppercase">
                          {role === 'trainer' ? booking.user_phone : booking.trainer_phone}
                        </span>
                     </div>
                  )}
                </h2>
                <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">
                  {booking.package_name || 'Personal Training Program'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar relative">
            <AnimatePresence>
                {isScheduling && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-6 sm:inset-x-8 top-0 z-20 bg-neutral-900/95 backdrop-blur-md pt-8 space-y-8 pb-10"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Schedule New Session</h3>
                            <button onClick={() => setIsScheduling(false)} className="text-white/40 hover:text-white uppercase text-[10px] font-black tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-all">Cancel</button>
                        </div>

                        <form onSubmit={handleSchedule} className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 ml-1">Select Date</p>
                              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar no-scrollbar scroll-smooth">
                                {dates.map(date => {
                                  const d = new Date(date);
                                  const isSelected = selectedDate === date;
                                  return (
                                    <button
                                      key={date}
                                      type="button"
                                      onClick={() => handleDateSelect(date)}
                                      className={clsx(
                                        "flex flex-col items-center px-4 py-3 rounded-xl border transition-all shrink-0 min-w-[65px] h-[85px] justify-center",
                                        isSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                                      )}
                                    >
                                      <span className="text-[10px] font-black uppercase mb-1">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                                      <span className="text-xl font-black">{d.getDate()}</span>
                                      <span className="text-[9px] font-bold text-white/20">{d.toLocaleDateString('en', { month: 'short' })}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedDate && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 ml-1">Available Slots</p>
                                {slotsLoading ? (
                                  <div className="text-center py-10 glass-card bg-white/[0.02] border-dashed border-white/5 rounded-2xl">
                                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Checking Availability...</span>
                                  </div>
                                ) : slots?.slots?.length > 0 ? (
                                  <div className="grid grid-cols-3 gap-2">
                                    {slots.slots.map((slot: any) => (
                                      <button
                                        key={slot.start_time}
                                        type="button"
                                        disabled={slot.is_booked}
                                        onClick={() => setSelectedSlot(slot.start_time)}
                                        className={clsx(
                                          "relative py-4 rounded-xl border text-center transition-all group overflow-hidden",
                                          slot.is_booked 
                                            ? "bg-white/5 border-white/5 text-white/10 cursor-not-allowed opacity-30"
                                            : selectedSlot === slot.start_time
                                              ? "bg-primary/10 border-primary/30 text-primary"
                                              : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                                        )}
                                      >
                                        <div className="flex flex-col items-center relative z-10">
                                          <span className="text-sm font-black">{slot.start_time}</span>
                                          <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">to {slot.end_time}</span>
                                        </div>
                                        {slot.is_booked && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-[1px] w-8 bg-white/20 rotate-45" />
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 glass-card bg-white/[0.02] border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No slots available for this day</p>
                                  </div>
                                )}
                              </motion.div>
                            )}

                            <div className="space-y-6 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Session Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['gym', 'home', 'online'].map(t => (
                                            <button 
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({...formData, session_type: t})}
                                                className={clsx(
                                                    "py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.session_type === t ? "bg-primary text-black border-primary shadow-[0_10px_20px_rgba(255,107,0,0.2)]" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Location Details</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter specific venue or address"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                        value={formData.location}
                                        onChange={e => setFormData({...formData, location: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-primary text-black font-display font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,107,0,0.25)] active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Confirm Schedule Request <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
               {[
                 { label: 'Progress', value: `${booking.sessions_completed}/${booking.total_sessions}`, icon: Timer, color: 'text-primary', bg: 'bg-primary/5', border: 'hover:border-primary/30' },
                 { label: 'Type', value: booking.session_type, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'hover:border-blue-400/30' },
                 { label: 'Total Value', value: `₹${booking.total_amount}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'hover:border-emerald-400/30' },
                 { label: 'Start Date', value: booking.start_date ? new Date(booking.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/5', border: 'hover:border-purple-400/30' }
               ].map((stat, i) => (
                 <div key={i} className={clsx("bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/5 transition-all duration-300 group", stat.bg, stat.border)}>
                    <stat.icon size={16} className={clsx("mb-2 sm:mb-3", stat.color)} />
                    <p className="text-[9px] sm:text-[10px] text-white/30 font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-base sm:text-lg font-black uppercase tracking-tight">{stat.value}</p>
                 </div>
               ))}
            </div>
 Broadway, New York, NY 10001, USA",

            {/* Progress Bar Implementation */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Completion Rate</p>
                <p className="text-sm font-black text-primary">{Math.round(progress)}%</p>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary to-orange-400 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                />
              </div>
            </div>

            {/* Main Details Section */}
            <div className="grid lg:grid-cols-5 gap-10">
               <div className="lg:col-span-3 space-y-8">
                  {/* Location Area */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
                           <MapPin size={14} className="text-primary" /> Session Venue
                        </p>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                           <div className="space-y-1">
                              <p className="text-base font-black text-white italic tracking-tight uppercase">
                                 {booking.session_type} Session
                              </p>
                              <p className="text-sm text-white/50 leading-relaxed">
                                 {booking.location ? booking.location : 
                                  booking.session_type === 'gym' && booking.trainer_location ? `At ${booking.trainer_location}` :
                                  booking.session_type === 'online' ? 'Digital session via link' : 
                                  'Specific location to be confirmed'}
                              </p>
                           </div>
                           <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                             <MapPin size={20} className="text-primary" />
                           </div>
                        </div>

                        {/* Map Visual */}
                        {hasCoordinates && isLoaded && (
                           <div className="h-40 sm:h-56 w-full rounded-2xl overflow-hidden border border-white/10 relative group bg-neutral-800 shadow-inner">
                              <button 
                                 onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`, '_blank')}
                                 className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-black text-white/70 hover:text-white hover:bg-black/80 transition-all uppercase tracking-widest flex items-center gap-2"
                              >
                                 <Globe size={12} className="sm:w-[14px] sm:h-[14px]"/> <span className="hidden sm:inline">Open Maps</span><span className="sm:hidden">Maps</span>
                              </button>
                              <GoogleMap
                                 mapContainerStyle={{ width: '100%', height: '100%' }}
                                 center={{ lat: Number(mapLat), lng: Number(mapLng) }}
                                 zoom={15}
                                 options={{
                                    disableDefaultUI: true,
                                    styles: [
                                       { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                       { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                       { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
                                    ]
                                 }}
                              >
                                 <MarkerF 
                                    position={{ lat: Number(mapLat), lng: Number(mapLng) }}
                                    icon={{
                                       url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                                       scaledSize: new window.google.maps.Size(32, 32)
                                    }}
                                 />
                              </GoogleMap>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-8">
                  {/* Notes & Contacts Section */}
                  <div className="space-y-4">
                     <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
                        <MessageSquare size={14} className="text-primary" /> Requirements
                     </p>
                     <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl min-h-[120px]">
                        <p className="text-sm text-white/60 font-medium italic leading-relaxed">
                           "{booking.user_notes || 'No special requirements mentioned for this program.'}"
                        </p>
                     </div>
                  </div>

                  {/* Payment Breakdown Card */}
                  <div className="space-y-4">
                     <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-3">
                        <DollarSign size={14} className="text-primary" /> Financials
                     </p>
                     <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Amount Paid</span>
                           <span className="text-xl font-black text-emerald-400 tabular-nums">₹{booking.amount_paid}</span>
                         </div>
                         {booking.amount_paid < booking.total_amount && (
                           <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Balance</span>
                              <span className="text-lg font-black text-red-400 tabular-nums">₹{booking.total_amount - booking.amount_paid}</span>
                           </div>
                         )}
                         <div className={clsx(
                           "py-2 px-4 rounded-xl border text-[9px] font-black uppercase text-center tracking-[0.2rem]",
                           booking.amount_paid >= booking.total_amount ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                         )}>
                           {booking.amount_paid >= booking.total_amount ? 'Payment Complete' : 'Balance Pending'}
                         </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── SECTION HISTORY: FULL WIDTH BOTTOM ── */}
            <div className="space-y-6 pt-6 mb-4">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                     <Clock size={16} className="text-primary" /> Scheduled Sessions History
                  </p>
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black uppercase text-white/40">
                     Total {sessions.length} Slots
                  </div>
               </div>
               
               <div className="grid md:grid-cols-2 gap-4">
                  {sessionsLoading ? (
                     <div className="col-span-full py-12 flex justify-center">
                        <Loader2 className="animate-spin text-primary" size={32} />
                     </div>
                  ) : sessions.length > 0 ? sessions.map((session) => {
                     const isPending = session.status === 'pending_confirmation';
                     const isCompleted = session.status === 'completed';
                     const isCancelled = session.status === 'cancelled';
                     
                     let statusColor = 'border-primary';
                     let iconColor = 'text-primary';
                     let badgeClass = 'bg-primary/10 text-primary border-primary/20';
                     let label = session.status;
                     let cardBg = 'bg-white/5';

                     if (isPending) {
                        statusColor = 'border-amber-400';
                        iconColor = 'text-amber-400';
                        badgeClass = 'bg-amber-400/10 text-amber-400 border-amber-400/20';
                        label = 'Pending Approval';
                     } else if (isCompleted) {
                        statusColor = 'border-emerald-400';
                        iconColor = 'text-emerald-400';
                        badgeClass = 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
                        label = 'Completed';
                        cardBg = 'bg-emerald-500/[0.03]';
                     } else if (isCancelled) {
                        statusColor = 'border-red-400';
                        iconColor = 'text-red-400';
                        badgeClass = 'bg-red-400/10 text-red-400 border-red-400/20';
                        label = 'Cancelled';
                        cardBg = 'bg-red-500/[0.02]';
                     }

                     return (
                        <div 
                           key={session.id} 
                           onClick={() => {
                              onClose();
                              navigate(`/app/sessions/${session.id}`);
                           }}
                           className={clsx(
                           "relative border border-white/5 border-l-4 rounded-3xl p-5 flex items-center justify-between group overflow-hidden transition-all hover:bg-white/[0.07] active:scale-[0.99] cursor-pointer",
                           statusColor, cardBg
                        )}>
                           <div className="space-y-2 relative z-10">
                              <p className="text-base font-black tracking-tight text-white uppercase italic">
                                 {new Date(session.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <div className="flex flex-col gap-1 text-[10px] text-white/30 font-black uppercase tracking-[0.15em]">
                                 <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><Clock size={12} className={iconColor} /> {session.scheduled_time}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{session.duration_minutes} Minutes</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <MapPin size={12} className={iconColor} />
                                    <span className="truncate max-w-[200px]" title={session.location || 'Location pending'}>{session.location || 'Location pending'}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col items-end gap-3 relative z-10">
                              <div className={clsx("text-[8px] font-black uppercase tracking-[0.2rem] px-3 py-1.5 rounded-full border shadow-sm", badgeClass)}>
                                 {label}
                              </div>
                              {role === 'user' && ['pending_confirmation', 'scheduled'].includes(session.status) && (
                                 <button 
                                    onClick={() => handleCancelSession(session.id)}
                                    className="text-[10px] font-black text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-[0.15em] border-b border-transparent hover:border-red-500/20"
                                 >
                                    Cancel Slot
                                 </button>
                              )}
                           </div>
                           <div className={clsx("absolute -right-4 -bottom-4 opacity-[0.03] transition-transform group-hover:scale-110", iconColor)}>
                             <Timer size={80} />
                           </div>
                        </div>
                     );
                  }) : (
                     <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                        <Activity size={32} className="mx-auto text-white/10 mb-4" />
                        <p className="text-xs text-white/20 font-black uppercase tracking-[0.25em]">Your training journey begins here</p>
                        <p className="text-[10px] text-white/10 uppercase mt-2">No sessions have been recorded yet</p>
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 sm:p-8 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
             {role === 'trainer' && isPending ? (
               <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                  <button 
                    onClick={() => onReject?.(booking.id)}
                    className="w-full sm:flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border border-red-500/30 text-red-500 font-display font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                     <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Decline Request
                  </button>
                  <button 
                    onClick={() => onAccept?.(booking.id)}
                    className="w-full sm:flex-[2] py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-emerald-500 text-black font-display font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(16,185,129,0.25)] active:scale-95"
                  >
                     <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" /> Confirm Enrollment
                  </button>
               </div>
              ) : (
                <>
                   <button 
                      className="flex items-center gap-3 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition-colors group"
                   >
                      <AlertCircle size={14} className="sm:w-4 sm:h-4 group-hover:text-red-400 transition-colors" /> Report Issue
                   </button>
                   <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      {role === 'user' && booking.status === 'confirmed' && booking.sessions_remaining > 0 && !isScheduling && (
                          <button 
                             onClick={() => setIsScheduling(true)}
                             className="flex-1 sm:flex-initial px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-white/5 border border-primary/30 text-primary font-display font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-primary/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                          >
                             <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" /> Book Session
                          </button>
                      )}
                      <button 
                        onClick={() => {
                           const phone = role === 'trainer' ? booking.user_phone : booking.trainer_phone;
                           if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                           else alert('Contact number not available');
                        }}
                        className="p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                     >
                        <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                     </button>
                     <button 
                        onClick={() => {
                           const phone = role === 'trainer' ? booking.user_phone : booking.trainer_phone;
                           if (phone) window.location.href = `tel:${phone}`;
                           else alert('Contact number not available');
                        }}
                        className="flex-1 sm:flex-initial px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-primary text-black font-display font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-primary/95 transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(255,107,0,0.25)] active:scale-90"
                     >
                        <Phone size={16} className="sm:w-[18px] sm:h-[18px]" /> Contact {role === 'trainer' ? 'Client' : 'Trainer'}
                     </button>
                  </div>
               </>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingDetailModal;
