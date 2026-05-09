import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { 
  ArrowLeft, ArrowRight, MapPin, Star, Building2, 
  CheckCircle2, Clock, Phone, ShoppingCart, Package, X,
  Activity, Wifi, Dumbbell, 
  Zap, Info, Loader2, TrendingUp, Image as ImageIcon,
  ChevronRight, Check, MessageSquare, Reply, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PageLoader from '../../components/PageLoader';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'gallery' | 'equipment' | 'amenities' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const { showNotification } = useNotification();
  
  // Analytics
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeStatDay, setActiveStatDay] = useState('Monday');

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Cart-based Selection State: one plan per category
  const [cart, setCart] = useState<Record<string, any>>({});  // { slotName: plan }
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  const distance = (gym?.addresses?.[0] && selectedLocation) 
    ? getDistance(selectedLocation.latitude, selectedLocation.longitude, gym.addresses[0].latitude, gym.addresses[0].longitude)
    : null;

  useEffect(() => {
    const fetchGym = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/gyms/${gymId}`);
        setGym(res.data);
      } catch (err) {
        console.error('Failed to fetch gym details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (gymId) fetchGym();
  }, [gymId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const res = await api.get(`/gyms/${gymId}/workout-stats`);
        setWorkoutStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (gymId) fetchStats();
  }, [gymId]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true);
          const res = await api.get(`/memberships/reviews/${gymId}`);
          setReviews(res.data.data.reviews || []);
        } catch (err) {
          console.error('Failed to fetch reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [activeTab, gymId]);

  if (loading) return <PageLoader message="Opening elite facility portal..." />;
  if (!gym) return (
    <div className="text-center py-24 space-y-4">
      <h2 className="text-2xl font-bold">Gym Not Found</h2>
      <button onClick={() => navigate('/app/discovery')} className="text-primary font-bold uppercase tracking-widest text-sm underline">Back to Discovery</button>
    </div>
  );

  const handleApplyMembership = async () => {
    const cartPlans = Object.values(cart);
    if (cartPlans.length === 0) return;
    try {
      setIsSubmittingApplication(true);
      
      const payload = {
        gym_id: gym.id,
        plans: cartPlans.map((p: any) => ({
          plan_id: p.id,
          selected_addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price }))
        })),
        payment_method: 'cash',
      };

      await api.post('/memberships/apply-cart', payload);
      
      showNotification(`${cartPlans.length} plan(s) submitted successfully! Waiting for gym owner approval.`, 'success');
      setCart({});
      setSelectedAddons([]);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Failed to apply:', err);
      showNotification(err.response?.data?.detail || 'Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) return;
    try {
      setIsSubmittingReview(true);
      await api.post('/memberships/reviews', {
        gym_id: gymId,
        rating: newRating,
        title: newReviewTitle || "Review",
        review: newReviewText,
      });

      showNotification('Review submitted successfully!', 'success');
      setShowReviewForm(false);
      setNewReviewText('');
      setNewReviewTitle('');
      setNewRating(5);
      
      // Refresh reviews
      const revRes = await api.get(`/memberships/reviews/${gymId}`);
      setReviews(revRes.data.data.reviews || []);
      
      // Update local gym data to hide the review button (can_review becomes false)
      setGym((prev: any) => ({ ...prev, can_review: false }));
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      showNotification(err.response?.data?.detail || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const occupancyRatio = (gym.current_occupancy || 0) / (gym.max_capacity || 100);

  // Group plans by slot
  const groupedPlans = (gym.membership_plans || []).reduce((acc: any, plan: any) => {
    const slot = plan.slot_name || 'Full Access';
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(plan);
    return acc;
  }, {});

  // Helper: get time slots from plan (new field first, fallback to legacy)
  const getTimeSlotsFromPlan = (plan: any): {start: string; end: string}[] => {
    if (plan.access_time_slots?.length) return plan.access_time_slots;
    if (plan.access_start_time && plan.access_end_time) return [{ start: plan.access_start_time, end: plan.access_end_time }];
    return [{ start: '06:00', end: '22:00' }];
  };

  const fmtTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const isQualifyingPlan = (plan: any) => {
    return ["month", "quarter", "half_year", "year"].includes(plan.duration_type) || plan.duration_days >= 30;
  };


  // Cart helpers
  const togglePlanInCart = (slotName: string, plan: any) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[slotName]?.id === plan.id) {
        delete copy[slotName];
      } else {
        copy[slotName] = plan;
      }
      return copy;
    });
  };

  const cartPlans = Object.entries(cart); // [[slotName, plan], ...]
  const totalEntryFee = gym?.is_new_member ? cartPlans.reduce((sum, [, p]) => sum + (isQualifyingPlan(p) ? (p.entry_fee || 0) : 0), 0) : 0;
  const cartTotal = cartPlans.reduce((sum, [, p]) => sum + (p.discounted_price || p.price || 0), 0) +
                    totalEntryFee + selectedAddons.reduce((sum, a) => sum + a.price, 0);

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
        {(() => {
          const coverUrl = gym.cover_image_url || 
                          (gym.images?.find((img: any) => img.is_primary)?.image_url || gym.images?.find((img: any) => img.is_primary)?.url) || 
                          (gym.images?.[0]?.image_url || gym.images?.[0]?.url) ||
                          gym.logo_url;
          
          if (coverUrl) {
            return <img src={coverUrl} alt={gym.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />;
          }
          return (
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-white/5">
               <Building2 size={160} />
            </div>
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
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
                <div className="flex items-center gap-1 text-[10px] sm:text-sm font-medium cursor-pointer hover:text-white transition-colors"
                   onClick={() => window.open(getGoogleMapsUrl(`${gym.addresses?.[0]?.address_line1}, ${gym.city}`, gym.addresses?.[0]?.latitude, gym.addresses?.[0]?.longitude))}>
                  <MapPin size={12} className="text-primary" />
                  <span className="underline underline-offset-2">{gym.city}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={() => { setActiveTab('plans'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="btn-primary px-10 py-5 rounded-2xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-[0.1em] whitespace-nowrap">
             Get Membership
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Live Status */}
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
                 <span className="text-white/40">{gym.current_occupancy || 0} / {gym.max_capacity || '100'} PEOPLE</span>
               </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="space-y-8">
            <div className="flex items-center gap-6 md:gap-8 border-b border-white/5 overflow-x-auto no-scrollbar pb-1">
              {(['overview', 'plans', 'gallery', 'amenities', 'equipment', 'reviews'] as const).map(tab => (
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
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                     <div className="space-y-4">
                        <h4 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                          <Info size={18} className="text-primary" /> About Facility
                        </h4>
                        <p className="text-white/60 leading-relaxed text-lg">
                          {gym.description || "Welcome to our premier fitness facility. Experience world-class equipment and professional guidance designed for results."}
                        </p>
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

                     {/* Traffic Analysis Component (Abstracted) */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-6 space-y-6">
                           <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <TrendingUp size={16} className="text-secondary" /> Weekly Check-in Activity
                           </h4>
                           
                           {loadingStats ? (
                              <div className="h-40 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={24} />
                              </div>
                           ) : !workoutStats ? (
                              <div className="h-40 flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-widest">
                                 No Data Available
                              </div>
                           ) : (
                              <div className="h-40 flex items-end justify-between gap-2 pt-4 overflow-x-auto no-scrollbar">
                                 {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                   const vals = Object.values(workoutStats?.weekly_stats || {}) as number[];
                                   const maxCount = Math.max(1, ...(vals.length > 0 ? vals : [1]));
                                   const count = workoutStats?.weekly_stats?.[day] || 0;
                                   const heightPct = Math.max(5, (count / maxCount) * 100);
                                   const isActive = activeStatDay === day;
                                   
                                   return (
                                     <button 
                                       key={day} 
                                       onClick={() => setActiveStatDay(day)}
                                       className="flex-1 flex flex-col items-center gap-2 group min-w-[32px]"
                                     >
                                        <div className="w-full h-full flex items-end bg-white/[0.03] rounded-t-xl overflow-hidden hover:bg-white/5 transition-colors">
                                          <div 
                                            className={clsx("w-full transition-all duration-500", isActive ? "bg-primary" : "bg-white/10")} 
                                            style={{ height: `${heightPct}%` }} 
                                          />
                                        </div>
                                        <span className={clsx("text-[8px] font-black uppercase transition-colors", isActive ? "text-primary" : "text-white/20 group-hover:text-white/40")}>
                                          {day.substring(0,3)}
                                        </span>
                                     </button>
                                   );
                                 })}
                              </div>
                           )}
                        </div>
                        
                        <div className="glass-card p-6 flex flex-col justify-center gap-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                             <Zap size={100} className="text-green-500" />
                           </div>
                           
                           <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                             <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                               <Zap size={20} />
                             </div>
                             <div>
                               <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Lowest Capacity Period</p>
                               <h4 className="text-lg font-black italic uppercase tracking-tighter text-white">
                                 {workoutStats?.hourly_distribution?.[activeStatDay]?.best_time || "Loading..."}
                               </h4>
                             </div>
                           </div>
                           
                           <div className="space-y-3 z-10 max-h-40 overflow-y-auto no-scrollbar pr-2">
                             {Object.entries(workoutStats?.hourly_distribution?.[activeStatDay] || {})
                               .filter(([k]) => k !== 'best_time')
                               .map(([timeRange, count]: [string, any]) => {
                                  const isBest = timeRange === workoutStats?.hourly_distribution?.[activeStatDay]?.best_time;
                                  const hourlyVals = Object.entries(workoutStats?.hourly_distribution?.[activeStatDay] || {}).filter(([k]) => k !== 'best_time').map(([_, v]) => v as number);
                                  const hourlyMax = Math.max(1, ...(hourlyVals.length > 0 ? hourlyVals : [1]));
                                  const widthPct = Math.max(2, (count / hourlyMax) * 100);
                                  
                                  return (
                                    <div key={timeRange} className="flex items-center gap-3">
                                      <span className="w-20 text-[10px] font-bold text-white/50">{timeRange}</span>
                                      <div className="flex-1 h-5 bg-white/[0.03] rounded-full overflow-hidden">
                                        <div 
                                          className={clsx("h-full rounded-full transition-all duration-500", isBest ? "bg-emerald-500" : "bg-white/10")} 
                                          style={{ width: `${widthPct}%` }}
                                        />
                                      </div>
                                      <span className="w-10 text-right text-[10px] font-black uppercase tracking-tight text-white/30">{count > 0 ? count + ' ck' : ''}</span>
                                    </div>
                                  );
                               })}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'plans' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                     {/* Category-based Plan Selection */}
                     <div className="flex items-center gap-3 mb-2">
                        <ShoppingCart size={16} className="text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Select Your Plans</h4>
                        <span className="text-[9px] text-white/30 font-bold uppercase ml-auto">{cartPlans.length} selected</span>
                     </div>

                     {Object.entries(groupedPlans).map(([slotName, plans]: [string, any]) => (
                       <div key={slotName} className="space-y-3">
                          {/* Category Header */}
                          <div className="flex items-center gap-2">
                            <div className={clsx(
                              "w-2 h-2 rounded-full",
                              cart[slotName] ? "bg-primary" : "bg-white/20"
                            )} />
                            <span className="text-[11px] font-black uppercase tracking-widest">{slotName}</span>
                            {cart[slotName] && (
                              <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase ml-auto">
                                ✓ {cart[slotName].name}
                              </span>
                            )}
                          </div>

                          {/* Plan Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                             {plans.map((plan: any) => {
                               const isSelected = cart[slotName]?.id === plan.id;
                               return (
                                 <button 
                                   key={plan.id}
                                   onClick={() => togglePlanInCart(slotName, plan)}
                                   className={clsx(
                                     "p-5 rounded-2xl transition-all border group relative flex flex-col items-center gap-1.5",
                                     isSelected 
                                       ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                                       : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                                   )}
                                 >
                                    {isSelected && (
                                      <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center">
                                          <Check size={12} strokeWidth={3} />
                                        </div>
                                      </div>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{plan.name}</span>
                                    <div className="flex items-baseline gap-0.5">
                                      <span className="text-[10px] text-white/40">₹</span>
                                      <span className={clsx("text-2xl font-black", isSelected ? "text-primary" : "text-white")}>{plan.discounted_price || plan.price}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">{plan.duration_days} Days</span>
                                    {plan.entry_fee > 0 && gym?.is_new_member && isQualifyingPlan(plan) && (
                                       <div className="text-[8px] text-white/50 uppercase tracking-widest font-black">
                                         + ₹{plan.entry_fee} Entry <span className="text-[7px] text-primary">(New)</span>
                                       </div>
                                    )}
                                    {/* Time slots */}
                                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                                       {getTimeSlotsFromPlan(plan).map((s: any, i: number) => (
                                         <span key={i} className={clsx(
                                           "inline-flex items-center gap-1 text-[9px] font-black rounded-lg px-2 py-0.5 uppercase tracking-wider",
                                           isSelected 
                                             ? "text-primary bg-primary/15 border border-primary/30" 
                                             : "text-white/50 bg-white/5 border border-white/10"
                                         )}>
                                           <Clock size={8} />
                                           {fmtTime(s.start)} - {fmtTime(s.end)}
                                         </span>
                                       ))}
                                    </div>
                                 </button>
                               );
                             })}
                          </div>
                       </div>
                     ))}

                     {/* Add-ons (show if any plans selected and addons exist) */}
                     {cartPlans.length > 0 && gym.addons?.length > 0 && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Add-on Services</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {gym.addons.map((addon: any) => {
                               const isAddonSelected = selectedAddons.find((a: any) => a.id === addon.id);
                               return (
                                 <div 
                                   key={addon.id}
                                   onClick={() => {
                                     if (isAddonSelected) {
                                       setSelectedAddons(selectedAddons.filter((a: any) => a.id !== addon.id));
                                     } else {
                                       setSelectedAddons([...selectedAddons, addon]);
                                     }
                                   }}
                                   className={clsx(
                                     "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                                     isAddonSelected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                   )}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className={clsx("w-5 h-5 rounded-md border flex items-center justify-center transition-all", isAddonSelected ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/20")}>
                                         {isAddonSelected && <Check size={12} />}
                                       </div>
                                       <div className="flex flex-col">
                                         <span className="text-[11px] font-black uppercase text-white">{addon.name}</span>
                                         <span className="text-[9px] text-white/40 uppercase tracking-tighter">{addon.duration_type} Access</span>
                                       </div>
                                    </div>
                                    <span className="text-[11px] font-black text-emerald-500">+₹{addon.price}</span>
                                 </div>
                               );
                             })}
                          </div>
                       </motion.div>
                     )}

                     {/* Cart Summary */}
                     {cartPlans.length > 0 && (
                       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Zap size={100} className="text-primary" />
                          </div>
                          <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-2">
                               <ShoppingCart size={14} className="text-primary" />
                               <p className="text-[10px] font-black uppercase text-primary tracking-widest">Your Cart — {cartPlans.length} {cartPlans.length === 1 ? 'Plan' : 'Plans'}</p>
                             </div>
                             
                             {/* Cart Items */}
                             <div className="space-y-2">
                               {cartPlans.map(([slot, plan]) => (
                                 <div key={slot} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{slot}</span>
                                      <span className="text-xs font-black italic uppercase tracking-tight">{plan.name}</span>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {getTimeSlotsFromPlan(plan).map((s: any, i: number) => (
                                          <span key={i} className="text-[8px] font-bold text-primary/80">
                                            {fmtTime(s.start)}-{fmtTime(s.end)}
                                          </span>
                                        ))}
                                        <span className="text-[8px] text-white/20 ml-1">• {plan.duration_days}d</span>
                                        {plan.entry_fee > 0 && gym?.is_new_member && isQualifyingPlan(plan) && (
                                          <span className="text-[8px] text-primary/60 font-black ml-1">+ ₹{plan.entry_fee} Entry</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-black text-white">₹{(plan.discounted_price || plan.price).toLocaleString()}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); togglePlanInCart(slot, plan); }}
                                        className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                 </div>
                               ))}
                               {selectedAddons.length > 0 && (
                                 <div className="flex items-center justify-between py-2 border-b border-white/5">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Add-ons ({selectedAddons.length})</span>
                                   <span className="text-sm font-black text-emerald-500">+₹{selectedAddons.reduce((s: number, a: any) => s + a.price, 0).toLocaleString()}</span>
                                 </div>
                               )}
                               {gym?.is_new_member && totalEntryFee > 0 && (
                                 <div className="flex items-center justify-between py-2 border-b border-white/5">
                                   <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Entry Fee (One time)</span>
                                   <span className="text-sm font-black text-primary/60">+₹{totalEntryFee.toLocaleString()}</span>
                                 </div>
                               )}
                             </div>

                             {/* Total + Submit */}
                             <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div>
                                   <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Grand Total</p>
                                   <p className="text-3xl font-black text-white italic">₹{cartTotal.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={handleApplyMembership}
                                  disabled={isSubmittingApplication}
                                  className="h-14 px-8 rounded-xl bg-primary text-black flex items-center gap-2 font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                >
                                   {isSubmittingApplication ? <Loader2 className="animate-spin" size={20} /> : (
                                     <>Apply Now <ChevronRight size={18} strokeWidth={3} /></>
                                   )}
                                </button>
                             </div>
                             <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest flex items-center gap-1">
                                <Info size={10} /> Instant application. Pay via chosen method at the facility front desk.
                             </p>
                          </div>
                       </motion.div>
                     )}
                  </motion.div>
                )}

                {activeTab === 'gallery' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(gym.images || []).map((img: any, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedImage(img.image_url || img.url)}
                        className="aspect-square rounded-2xl overflow-hidden glass-card border-none group cursor-pointer"
                      >
                        <img src={img.image_url || img.url} alt="gym" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'equipment' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3"><Dumbbell className="text-primary" size={18} /> Machines</h4>
                        {gym.equipment?.map((eq: any, idx: number) => (
                          <div key={idx} className="glass-card p-4 flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-white/60">{eq.name}</span>
                            <span className="text-primary">x{eq.quantity || 'Pro'}</span>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3"><Zap className="text-primary" size={18} /> Zones</h4>
                        {gym.facilities?.map((f: any, idx: number) => (
                           <div key={idx} className="glass-card p-4 flex items-center gap-3 text-[10px] font-black uppercase">
                             <CheckCircle2 size={14} className="text-primary" />
                             <span className="text-white/60">{f.name}</span>
                           </div>
                        ))}
                     </div>
                  </motion.div>
                )}

                {activeTab === 'amenities' && (
                   <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {gym.amenities?.map((a: any, idx: number) => (
                      <div key={idx} className="glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-all text-center">
                        <Wifi size={24} className="text-primary/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{a.name}</span>
                      </div>
                    ))}
                   </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-primary italic leading-none">{gym.rating_avg?.toFixed(1) || '0.0'}</span>
                              <span className="text-[8px] font-black opacity-30 uppercase tracking-widest mt-1">Score</span>
                           </div>
                           <div className="space-y-1">
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => <Star key={i} size={10} className={clsx(i <= Math.round(gym.rating_avg || 0) ? "text-primary fill-primary" : "text-white/10")} />)}
                              </div>
                              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{gym.rating_count || 0} Platform Reviews</p>
                           </div>
                        </div>

                        {gym.can_review && !showReviewForm && (
                           <button 
                             onClick={() => setShowReviewForm(true)}
                             className="btn-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                           >
                              <Star size={14} fill="black" /> Write a Review
                           </button>
                        )}
                     </div>

                     {showReviewForm && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }} 
                          animate={{ opacity: 1, scale: 1 }}
                          className="glass-card p-8 border-primary/20 space-y-6 bg-gradient-to-br from-primary/5 to-transparent shadow-2xl"
                        >
                           <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black italic uppercase tracking-widest">Submit Your Feedback</h4>
                              <button onClick={() => setShowReviewForm(false)} className="text-white/20 hover:text-white transition-colors">
                                 <X size={18} />
                              </button>
                           </div>

                           <div className="flex flex-col sm:flex-row gap-8 items-center py-4">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex gap-2">
                                    {[1,2,3,4,5].map(i => (
                                       <button 
                                          key={i} 
                                          onClick={() => setNewRating(i)}
                                          className="hover:scale-110 active:scale-95 transition-transform"
                                       >
                                          <Star 
                                             size={32} 
                                             className={clsx(i <= newRating ? "text-primary fill-primary" : "text-white/10")} 
                                          />
                                       </button>
                                    ))}
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                    {newRating === 5 ? 'Excellent' : newRating === 4 ? 'Great' : newRating === 3 ? 'Good' : newRating === 2 ? 'Fair' : 'Poor'}
                                 </span>
                              </div>

                              <div className="flex-1 w-full space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Review Title</label>
                                    <input 
                                       type="text" 
                                       placeholder="e.g. Best facility in the city!"
                                       className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                                       value={newReviewTitle}
                                       onChange={(e) => setNewReviewTitle(e.target.value)}
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Details</label>
                                    <textarea 
                                       rows={3}
                                       placeholder="Share your experience with the community..."
                                       className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all resize-none"
                                       value={newReviewText}
                                       onChange={(e) => setNewReviewText(e.target.value)}
                                    />
                                 </div>
                                 <div className="flex justify-end gap-3 pt-2">
                                    <button 
                                       onClick={() => setShowReviewForm(false)}
                                       className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                    >
                                       Cancel
                                    </button>
                                    <button 
                                       onClick={handleSubmitReview}
                                       disabled={isSubmittingReview || !newReviewText.trim()}
                                       className="btn-primary px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20"
                                    >
                                       {isSubmittingReview ? <Loader2 className="animate-spin" size={14} /> : (
                                          <><Send size={14} /> Submit Feedback</>
                                       )}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     <div className="space-y-4">
                        {loadingReviews ? (
                           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : reviews.length > 0 ? reviews.map(rev => (
                           <div key={rev.id} className="glass-card p-6 space-y-4 group hover:border-white/10 transition-all">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                                       {rev.avatar_url ? <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={14} className="text-white/20" />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-xs font-black uppercase tracking-tight">{rev.user_name || 'Anonymous Member'}</span>
                                       <div className="flex items-center gap-2">
                                          <div className="flex gap-0.5">
                                             {[1,2,3,4,5].map(i => <Star key={i} size={8} className={clsx(i <= rev.rating ? "text-primary fill-primary" : "text-white/10")} />)}
                                          </div>
                                          {rev.is_verified_member && (
                                            <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                               <CheckCircle2 size={8} /> Verified Member
                                            </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                 <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="space-y-2">
                                 <h5 className="text-sm font-black italic uppercase tracking-tight text-white/90">"{rev.title}"</h5>
                                 <p className="text-sm text-white/50 leading-relaxed">{rev.review}</p>
                              </div>
                              {rev.owner_response && (
                                 <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4">
                                    <Reply size={16} className="text-primary shrink-0" />
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Gym Response</p>
                                       <p className="text-xs text-white/70 italic leading-relaxed">"{rev.owner_response}"</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )) : (
                           <div className="py-20 flex flex-col items-center justify-center gap-4 text-center opacity-20">
                              <MessageSquare size={40} />
                              <p className="text-[10px] font-black uppercase tracking-widest">No community feedback yet</p>
                           </div>
                        )}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
           <div className="glass-card p-6 sm:p-8 space-y-8">
              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Location</h3>
                    {distance !== null && (
                      <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black text-primary uppercase">
                        {distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`} away
                      </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    <a 
                      href={getGoogleMapsUrl(`${gym.addresses?.[0]?.address_line1}, ${gym.city}`, gym.addresses?.[0]?.latitude, gym.addresses?.[0]?.longitude)} 
                      target="_blank" rel="noopener noreferrer" 
                      className="flex gap-4 group hover:text-primary transition-colors"
                    >
                      <MapPin className="text-primary shrink-0 transition-transform group-hover:scale-110" size={20} />
                      <p className="text-sm text-white/60 leading-relaxed font-bold uppercase tracking-tight group-hover:text-white underline underline-offset-4 decoration-white/10">
                        {gym.addresses?.[0]?.address_line1}, {gym.city}, {gym.state}
                      </p>
                    </a>
                    {gym.contact_phone && (
                       <a href={`tel:${gym.contact_phone}`} className="flex items-center gap-4 hover:text-primary transition-colors group p-3 bg-white/5 rounded-xl border border-white/5">
                          <Phone size={14} className="text-primary" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{gym.contact_phone}</span>
                       </a>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 border-b border-white/5 pb-4">Timing</h3>
                 <div className="space-y-3">
                    {gym.operating_hours?.map((h: any) => (
                       <div key={h.day_of_week} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className={clsx(new Date().getDay() - 1 === h.day_of_week ? "text-primary" : "text-white/20")}>
                            {h.day_name.slice(0, 3)}
                          </span>
                          <span className="text-white/60">{h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {activeTab !== 'plans' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setActiveTab('plans'); window.scrollTo({ top: 600, behavior: 'smooth' }); }} className="p-8 rounded-[2rem] bg-primary relative overflow-hidden group cursor-pointer shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between text-black">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Start Today</span>
                      <h4 className="text-xl font-display font-black italic">BOOK SLOT</h4>
                   </div>
                   <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </div>
             </motion.div>
           )}
        </div>
      </div>
      
      {/* Map Implementation (Same as original but premium feel) */}
      <div className="h-64 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative grayscale hover:grayscale-0 transition-all duration-700">
         {isLoaded && gym.addresses?.[0]?.latitude ? (
           <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: gym.addresses[0].latitude, lng: gym.addresses[0].longitude }} zoom={15} options={{ styles: darkMapStyles, disableDefaultUI: true, zoomControl: true }}>
             <MarkerF position={{ lat: gym.addresses[0].latitude, lng: gym.addresses[0].longitude }} icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: '#ff4d00', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff', scale: 8 }} />
           </GoogleMap>
         ) : <div className="absolute inset-0 bg-black/20 backdrop-blur-xl flex items-center justify-center font-black uppercase text-[10px] text-white/20 tracking-[0.3em]">Initializing Elite Grid...</div>}
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-20 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Fullscreen Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl pointer-events-none border border-white/5"
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all group"
            >
              <X className="group-hover:rotate-90 transition-transform duration-500 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GymProfile;
