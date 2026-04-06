import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { 
  ArrowLeft, ArrowRight, MapPin, Star, Building2, 
  CheckCircle2, Clock, Phone, Mail, 
  Globe, Activity, Wifi, Dumbbell, 
  Zap, Info, Loader2, Sparkles, TrendingUp, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PageLoader from '../../components/PageLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

import { useGeoLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { getGoogleMapsUrl } from '../../utils/navigation';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ff4d00" }, { weight: 0.1 }, { lightness: -50 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

const GymProfile = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const { selectedLocation } = useGeoLocation();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'gallery' | 'details' | 'amenities'>('overview');
  const [applyingPlan, setApplyingPlan] = useState<any>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const { showNotification } = useNotification();

  const distance = (gym?.addresses?.[0] && selectedLocation) 
    ? getDistance(selectedLocation.latitude, selectedLocation.longitude, gym.addresses[0].latitude, gym.addresses[0].longitude)
    : null;

  useEffect(() => {
    const fetchGym = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/gyms/${gymId}`);
        setGym(res.data);
      } catch (err) {
        console.error('Failed to fetch gym details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (gymId) fetchGym();
  }, [gymId]);

  if (loading) return <PageLoader message="Opening elite facility portal..." />;
  if (!gym) return (
    <div className="text-center py-24 space-y-4">
      <h2 className="text-2xl font-bold">Gym Not Found</h2>
      <button onClick={() => navigate('/app/discovery')} className="text-primary font-bold uppercase tracking-widest text-sm underline">Back to Discovery</button>
    </div>
  );

  const handleApplyMembership = async () => {
    if (!applyingPlan) return;
    try {
      setIsSubmittingApplication(true);
      const authHeader = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
      await axios.post(`${API_URL}/memberships/apply`, {
        gym_id: gym.id,
        plan_id: applyingPlan.id,
        payment_method: 'cash'
      }, { headers: authHeader });
      
      showNotification('Application submitted successfully! Waiting for gym owner approval.', 'success');
      setApplyingPlan(null);
    } catch (err: any) {
      console.error('Failed to apply:', err);
      showNotification(err.response?.data?.detail || 'Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const occupancyRatio = gym.current_occupancy / (gym.max_capacity || 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group w-fit ml-[-0.5rem] sm:ml-0"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Back to Discovery</span>
      </button>

      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 md:h-[450px] rounded-[2rem] overflow-hidden group shadow-2xl border border-white/5 mx-[-1rem] sm:mx-0">
        {/* Cover Image */}
        {gym.cover_image_url ? (
          <img 
            src={gym.cover_image_url} 
            alt={gym.name} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-white/5">
             <Building2 size={160} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Branding Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-3 sm:p-4 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative">
               {gym.logo_url ? (
                 <img src={gym.logo_url} alt="logo" className="w-full h-full object-contain" />
               ) : (
                 <Building2 className="text-primary" size={32} />
               )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-4xl md:text-6xl font-display font-black tracking-tighter italic uppercase truncate max-w-[200px] sm:max-w-md">{gym.name}</h1>
                {gym.is_verified && <CheckCircle2 className="text-blue-500 shrink-0" size={18} />}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/60">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/10">
                  <Star className="text-primary fill-primary" size={10} />
                  <span className="text-[10px] sm:text-sm font-bold text-white">{gym.rating_avg?.toFixed(1) || 'NEW'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-sm font-medium">
                  <MapPin size={12} className="text-primary" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{gym.city}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button className="hidden sm:block btn-primary px-10 py-5 rounded-2xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap">
             Join Now
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Live Status Bar */}
          <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Activity size={80} className="text-primary" />
             </div>
             <div className="space-y-1 text-center sm:text-left shrink-0">
               <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Live Traffic</p>
               <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase tracking-tight">CROWD STATUS</h3>
             </div>
             
             <div className="flex-1 w-full space-y-3">
               <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${occupancyRatio * 100}%` }}
                   className={clsx(
                     "h-full rounded-full relative",
                     occupancyRatio > 0.8 ? "bg-red-500" : occupancyRatio > 0.5 ? "bg-orange-500" : "bg-emerald-500"
                   )}
                 >
                   <div className="absolute inset-0 bg-white/20 animate-pulse" />
                 </motion.div>
               </div>
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                 <span className={clsx(
                   occupancyRatio > 0.8 ? "text-red-500" : occupancyRatio > 0.5 ? "text-orange-500" : "text-emerald-500"
                 )}>
                   {occupancyRatio > 0.8 ? 'VERY BUSY' : occupancyRatio > 0.5 ? 'MODERATE' : 'QUIET'} NOW
                 </span>
                 <span className="text-white/40">{gym.current_occupancy} / {gym.max_capacity} PEOPLE</span>
               </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="space-y-8">
            <div className="flex items-center gap-6 md:gap-8 border-b border-white/5 overflow-x-auto no-scrollbar pb-1">
              {(['overview', 'plans', 'gallery', 'details', 'amenities'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "pb-5 text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap",
                    activeTab === tab ? "text-primary px-2" : "text-white/20 hover:text-white"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-5px_15px_rgba(var(--primary-rgb),0.5)]" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                    <div className="space-y-4">
                       <h4 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                         <Info size={18} className="text-primary" /> About Facility
                       </h4>
                       <p className="text-white/60 leading-relaxed text-lg">
                         {gym.description || "Welcome to our premier fitness facility. Experience world-class equipment and professional guidance designed for results."}
                       </p>
                    </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 10-Day Trend Chart */}
                        <div className="glass-card p-6 sm:p-8 space-y-6">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-secondary" /> 10-Day Trend
                              </h4>
                              <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Peak Occupancy</span>
                           </div>
                           
                           <div className="h-40 flex items-end justify-between gap-1 pt-4 relative">
                              {(!gym.occupancy_trend || gym.occupancy_trend.length === 0) ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 bg-black/20 rounded-2xl border border-white/5">
                                   <Activity className="text-white/10 animate-pulse" size={32} />
                                   <div className="space-y-1">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Analyzing Patterns</p>
                                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Collecting historical data...</p>
                                   </div>
                                </div>
                              ) : (
                                gym.occupancy_trend.map((item: any, idx: number) => (
                                  <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                     <div className="relative w-full flex flex-col justify-end h-32">
                                        {/* Bar with Tooltip */}
                                        <motion.div 
                                          initial={{ height: 0 }}
                                          animate={{ height: `${item.peak_occupancy}%` }}
                                          transition={{ delay: idx * 0.05, duration: 0.8, ease: "easeOut" }}
                                          className={clsx(
                                            "w-full rounded-t-lg relative transition-all duration-300 group-hover:brightness-125 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
                                            item.peak_occupancy > 80 ? "bg-red-500/80" : item.peak_occupancy > 50 ? "bg-orange-500/80" : "bg-emerald-500/80"
                                          )}
                                        />
                                        {/* Value Label on Hover */}
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                          <span className="text-[8px] font-black">{item.peak_occupancy}%</span>
                                        </div>
                                     </div>
                                     <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{item.date}</span>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>

                        {/* Best Time Suggestion */}
                        <div className="glass-card p-6 sm:p-8 border-secondary/20 relative overflow-hidden flex flex-col justify-center">
                           <div className="absolute -top-12 -right-12 w-40 h-40 bg-secondary/10 blur-[60px] rounded-full" />
                           <div className="relative z-10 space-y-4 sm:space-y-6">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Elite Suggestion</p>
                                 <h4 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Optimal Training Window</h4>
                              </div>
                              
                              {gym.best_time_suggestion ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="text-2xl font-black text-white">{gym.best_time_suggestion.time_range}</span>
                                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                         Highly Recommended
                                      </div>
                                   </div>
                                   <p className="text-xs text-white/40 leading-relaxed">
                                      {gym.best_time_suggestion.message}
                                   </p>
                                </div>
                              ) : (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-3">
                                   <Clock className="text-white/10" size={24} />
                                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing with facility sensors...</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20">
                                 <Info size={12} />
                                 {gym.best_time_suggestion ? "Based on real-time activity historical data" : "Analyzing peak hours for this location"}
                              </div>
                           </div>
                        </div>
                     </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-primary/50 transition-all">
                          <ImageIcon className="text-white/20 group-hover:text-primary" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{gym.images?.length || 0} Photos</span>
                       </div>
                       <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-primary/50 transition-all">
                          <Dumbbell className="text-white/20 group-hover:text-primary" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{gym.equipment?.length || 0} Machines</span>
                       </div>
                       <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-primary/50 transition-all">
                          <Zap className="text-white/20 group-hover:text-primary" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{gym.facilities?.length || 0} Zones</span>
                       </div>
                       <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-primary/50 transition-all">
                          <Clock className="text-white/20 group-hover:text-primary" size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{gym.is_24_hours ? '24/7 Access' : 'Full Access'}</span>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-lg font-black italic uppercase tracking-tight">Our Reach</h4>
                       <div className="h-72 rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl">
                          {isLoaded && gym.addresses?.[0]?.latitude ? (
                            <GoogleMap
                              mapContainerStyle={{ width: '100%', height: '100%' }}
                              center={{ lat: gym.addresses[0].latitude, lng: gym.addresses[0].longitude }}
                              zoom={15}
                              options={{
                                styles: darkMapStyles,
                                disableDefaultUI: true,
                                zoomControl: true,
                              }}
                            >
                              <MarkerF 
                                position={{ lat: gym.addresses[0].latitude, lng: gym.addresses[0].longitude }}
                                icon={{
                                  path: google.maps.SymbolPath.CIRCLE,
                                  fillColor: '#ff4d00',
                                  fillOpacity: 1,
                                  strokeWeight: 2,
                                  strokeColor: '#ffffff',
                                  scale: 8,
                                }}
                              />
                            </GoogleMap>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-center p-8">
                               <Loader2 className="animate-spin text-primary mr-2" size={20} />
                               <p className="text-xs font-black uppercase tracking-widest text-white/40">Initializing Elite Grid...</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'plans' && (
                    <div className="space-y-3">
                      {gym.membership_plans?.length > 0 ? gym.membership_plans.map((plan: any) => (
                        <div 
                          key={plan.id} 
                          className={clsx(
                            "group px-5 py-4 flex items-center justify-between rounded-2xl transition-all duration-300",
                            plan.is_popular 
                              ? "bg-white/[0.05] border border-primary/30" 
                              : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase tracking-tight">{plan.name}</span>
                              {plan.is_popular && <Sparkles size={8} className="text-primary animate-pulse" />}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-white/90">₹{plan.price.toLocaleString()}</span>
                              <span className="text-[8px] text-white/20 font-bold uppercase">/ {plan.duration_type || 'mo'}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setApplyingPlan(plan)}
                            className={clsx(
                            "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 group/btn",
                            plan.is_popular 
                              ? "bg-primary text-black shadow-lg shadow-primary/20" 
                              : "bg-white/5 text-white/40 hover:text-white"
                          )}>
                            <span>Select</span>
                            <ArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )) : (
                        <div className="py-24 text-center text-white/20 font-black uppercase tracking-[0.2em]">
                          <Loader2 className="mx-auto mb-4 animate-pulse text-white/5" size={40} />
                          Elite Archives loading...
                        </div>
                      )}
                    </div>
                )}

                {activeTab === 'gallery' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {[...(gym.images || []), ...(Array.from({ length: 6 }).map((_, i) => ({ url: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80&i=${i}` })))].slice(0, 12).map((img: any, idx: number) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden glass-card border-none group cursor-pointer">
                        <img 
                          src={typeof img === 'string' ? img : img.url} 
                          alt="gym" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                    <div className="space-y-6">
                      <h4 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Dumbbell className="text-primary" size={24} /> Machine List
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(gym.equipment?.length > 0 ? gym.equipment : [
                          { name: 'Treadmills', quantity: 12 },
                          { name: 'Dumbbell Set (2.5 - 50kg)', quantity: 2 },
                          { name: 'Squat Racks', quantity: 4 },
                          { name: 'Bench Press Station', quantity: 6 }
                        ]).map((eq: any, idx: number) => (
                          <div key={idx} className="glass-card p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                            <span className="text-sm font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{eq.name}</span>
                            <span className="text-xs font-black text-white/20 uppercase">{eq.quantity || 'Pro'} Units</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                        <Zap className="text-primary" size={24} /> Training Zones
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(gym.facilities?.length > 0 ? gym.facilities : [
                          { name: 'Crossfit Area' },
                          { name: 'Yoga & Pilates Studio' },
                          { name: 'Steam & Sauna' },
                          { name: 'Nutrition Bar' }
                        ]).map((fac: any, idx: number) => (
                          <div key={idx} className="glass-card p-5 flex items-center gap-4 group hover:border-primary/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                              <CheckCircle2 size={18} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">{fac.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'amenities' && (
                   <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {[...(gym.amenities || []), { name: 'Complimentary WiFi' }, { name: 'Premium Lockers' }, { name: 'Showers' }].map((amenity: any, idx: number) => (
                      <div key={idx} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                          <Wifi size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{amenity.name}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Info Sidebar */}
        <div className="space-y-8">
           <div className="glass-card p-6 sm:p-8 space-y-8">
              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Connect & Locate</h3>
                    {distance !== null && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <MapPin size={10} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`} away
                        </span>
                      </div>
                    )}
                 </div>
                 <div className="space-y-4">
                  <a 
                    href={getGoogleMapsUrl(`${gym.addresses?.[0]?.address_line1}, ${gym.city}, ${gym.state}, ${gym.addresses?.[0]?.pincode}`, gym.addresses?.[0]?.latitude, gym.addresses?.[0]?.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 group hover:text-primary transition-colors"
                  >
                    <MapPin className="text-primary shrink-0 group-hover:scale-110 transition-transform" size={20} />
                    <p className="text-sm text-white/60 leading-relaxed font-medium group-hover:text-white transition-colors">
                      {gym.addresses?.[0]?.address_line1}, {gym.city}, {gym.state}, {gym.addresses?.[0]?.pincode}
                    </p>
                  </a>
                    {gym.contact_phone && (
                       <a href={`tel:${gym.contact_phone}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                            <Phone size={16} />
                          </div>
                          <span className="text-sm text-white/60 font-medium group-hover:text-white transition-colors">{gym.contact_phone}</span>
                       </a>
                    )}
                    {gym.contact_email && (
                       <a href={`mailto:${gym.contact_email}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                            <Mail size={16} />
                          </div>
                          <span className="text-sm text-white/60 font-medium truncate group-hover:text-white transition-colors">{gym.contact_email}</span>
                       </a>
                    )}
                    {gym.website_url && (
                       <a href={gym.website_url.startsWith('http') ? gym.website_url : `https://${gym.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-primary transition-colors group">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                            <Globe size={16} />
                          </div>
                          <span className="text-sm text-white/60 font-medium truncate underline underline-offset-4 group-hover:text-white transition-colors">{gym.website_url}</span>
                       </a>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 border-b border-white/5 pb-4">Elite Windows</h3>
                 <div className="space-y-3">
                    {gym.operating_hours?.map((h: any) => (
                       <div key={h.day_of_week} className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                          <span className={clsx(new Date().getDay() - 1 === h.day_of_week ? "text-primary" : "text-white/40")}>
                            {h.day_name.slice(0, 3)}
                          </span>
                          <span className="text-white/60">
                             {h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div 
              onClick={() => {
                setActiveTab('plans');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-8 rounded-[2rem] bg-primary relative overflow-hidden group cursor-pointer shadow-2xl shadow-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                 <div className="flex flex-col">
                    <span className="text-black/60 text-[10px] font-black uppercase tracking-widest">Next Step</span>
                    <h4 className="text-2xl font-display font-black italic text-black leading-tight">JOIN THE ELITE PORTAL</h4>
                 </div>
                 <div className="flex items-center justify-between text-black">
                    <span className="text-xs font-black uppercase tracking-widest">Verify & Access</span>
                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Application Modal */}
      <AnimatePresence>
        {applyingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setApplyingPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md p-6 space-y-6 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
              
              <div className="space-y-2">
                 <h2 className="text-2xl font-display font-black italic">CONFIRM APPLICATION</h2>
                 <p className="text-sm text-white/40">You are about to submit a membership application to <span className="text-white font-bold">{gym.name}</span>.</p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-white/60">Selected Plan</span>
                    <span className="text-sm font-bold">{applyingPlan.name}</span>
                 </div>
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-white/60">Duration</span>
                    <span className="text-sm font-bold">{applyingPlan.duration_days ? `${applyingPlan.duration_days} days` : '1 month'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Amount</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded uppercase tracking-widest font-black">Pay at Gym (₹{applyingPlan.discounted_price || applyingPlan.price})</span>
                 </div>
              </div>
              
              <div className="pt-2 flex gap-3">
                 <button 
                  onClick={() => setApplyingPlan(null)}
                  disabled={isSubmittingApplication}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors disabled:opacity-50"
                 >
                    Cancel
                 </button>
                 <button 
                  onClick={handleApplyMembership}
                  disabled={isSubmittingApplication}
                  className="flex-1 py-3 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                 >
                    {isSubmittingApplication ? <Loader2 size={16} className="animate-spin" /> : 'Submit Request'}
                    {!isSubmittingApplication && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GymProfile;
