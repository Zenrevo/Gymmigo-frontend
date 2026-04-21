import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, 
  Clock, Calendar, CheckCircle2, User, Phone, Navigation,
  AlertTriangle, Play
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const SessionDetail = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get(`${API_URL}/trainer-bookings/sessions/${sessionId}`);
        setSessionData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch session details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
  }, [sessionId]);

  if (loading) return <PageLoader message="Loading session..." />;
  if (!sessionData) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-white/50">
      <AlertTriangle size={48} className="mb-4 opacity-50" />
      <p>Session not found or forbidden.</p>
      <button onClick={() => navigate(-1)} className="mt-4 btn-primary py-2 px-6">Go Back</button>
    </div>
  );

  const isTrainer = user?.id === sessionData.trainer_id;
  
  // Choose other party's identity
  const otherName = isTrainer ? sessionData.user_name : sessionData.trainer_name;
  const otherPhone = isTrainer ? sessionData.user_phone : sessionData.trainer_phone;
  const otherAvatar = isTrainer ? sessionData.user_avatar : sessionData.trainer_avatar;
  const otherRole = isTrainer ? 'Client' : 'Trainer';

  // Determine Maps URL
  let mapUrl = '';
  if (sessionData.latitude && sessionData.longitude) {
    if (GOOGLE_MAPS_API_KEY) {
      mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${sessionData.latitude},${sessionData.longitude}&zoom=15&size=800x400&markers=color:red%7C${sessionData.latitude},${sessionData.longitude}&key=${GOOGLE_MAPS_API_KEY}&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:labels.text.stroke|color:0x000000&style=feature:all|element:labels.icon|visibility:off&style=feature:landscape|element:geometry|color:0x111111&style=feature:poi|element:geometry|color:0x222222&style=feature:road|element:geometry|color:0x333333&style=feature:water|element:geometry|color:0x000000`;
    } else {
      mapUrl = "/map-placeholder.jpg"; // fallback if no api key
    }
  }

  const openInMaps = () => {
    if (!sessionData.latitude || !sessionData.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${sessionData.latitude},${sessionData.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-8 px-4"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Map */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 inline-block",
                  sessionData.status === 'completed' ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                  sessionData.status === 'in_progress' ? "text-primary border-primary/20 bg-primary/10" :
                  sessionData.status === 'cancelled' ? "text-red-400 border-red-500/20 bg-red-500/10" :
                  "text-amber-400 border-amber-500/20 bg-amber-500/10"
                )}>
                  {sessionData.status.replace('_', ' ')}
                </span>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                  {sessionData.session_type} Session
                </h1>
                <p className="text-white/40 text-sm font-medium mt-1">
                  {sessionData.package_name || 'Standard Booking'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar size={12}/> Date</p>
                <p className="font-bold text-sm">
                  {new Date(sessionData.scheduled_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><Clock size={12}/> Time</p>
                <p className="font-bold text-sm">{sessionData.scheduled_time} <span className="text-white/40 font-normal">({sessionData.duration_minutes}m)</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={12}/> Progress</p>
                <p className="font-bold text-sm">
                  {sessionData.sessions_remaining !== null ? `${sessionData.total_sessions! - sessionData.sessions_remaining} / ${sessionData.total_sessions}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden relative">
             <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
               <div className="flex items-center gap-2 text-primary">
                 <MapPin size={18} />
                 <h3 className="font-bold uppercase tracking-widest text-sm">Session Venue</h3>
               </div>
               {sessionData.latitude && (
                 <button onClick={openInMaps} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-colors font-bold uppercase tracking-widest">
                   <Navigation size={12} /> Open Maps
                 </button>
               )}
             </div>
             
             {mapUrl ? (
               <div className="relative h-[250px] w-full bg-black/40">
                 <img src={mapUrl} alt="Map Location" className="w-full h-full object-cover opacity-80" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
               </div>
             ) : (
               <div className="h-[200px] w-full bg-black/20 flex flex-col items-center justify-center border-y border-white/5 text-white/20">
                  <MapPin size={32} className="mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">Location preview unavailable</p>
               </div>
             )}

             <div className="p-6 bg-gradient-to-br from-white/5 to-transparent">
                <p className="text-white font-medium">{sessionData.location || 'Location details pending.'}</p>
             </div>
          </div>
        </div>

        {/* Right Column: People & Actions */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">{otherRole} Details</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden text-primary shrink-0">
                {otherAvatar ? (
                  <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-lg truncate">{otherName || otherRole}</h4>
                {otherPhone && (
                  <a href={`tel:${otherPhone}`} className="text-primary hover:underline text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} /> {otherPhone}
                  </a>
                )}
              </div>
            </div>
            
            {sessionData.booking_user_notes && (
              <div className="mt-6 pt-6 border-t border-white/5">
                 <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Booking Notes</h3>
                 <p className="text-sm text-white/70 italic leading-relaxed">"{sessionData.booking_user_notes}"</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 shadow-xl shadow-primary/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Actions</h3>
            {sessionData.status === 'scheduled' && isTrainer && (
              <button className="w-full py-4 mb-3 rounded-xl font-black tracking-widest uppercase text-xs flex items-center justify-center gap-2 bg-primary text-black hover:bg-primary/90 transition-all border-b-4 border-primary-hover active:border-b-0 active:translate-y-1">
                <Play size={16} className="fill-black" /> Begin Session
              </button>
            )}
            {sessionData.status === 'scheduled' && (
              <button className="w-full py-3 rounded-xl font-bold tracking-widest uppercase text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all">
                Cancel Session
              </button>
            )}
            {sessionData.status === 'completed' && (
              <div className="text-center py-4 text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 size={32} />
                <span className="font-black text-xs uppercase tracking-widest">Session Completed</span>
              </div>
            )}
            {sessionData.status === 'pending_confirmation' && (
              <div className="text-center py-4 text-amber-400 flex flex-col items-center gap-2 opacity-80">
                <Clock size={32} />
                <span className="font-black text-xs uppercase tracking-widest">Awaiting Confirmation</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SessionDetail;
