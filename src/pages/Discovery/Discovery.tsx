import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Star, Filter, ArrowRight, Building2, User, LocateFixed, Loader2, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import InfoModal from '../../components/InfoModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

import { useGeoLocation } from '../../context/LocationContext';
import { openInMap } from '../../utils/navigation';

const Discovery = () => {
  const navigate = useNavigate();
  const { selectedLocation, refreshGPS, isLocating } = useGeoLocation();
  const [activeTab, setActiveTab] = useState<'gyms' | 'trainers'>('gyms');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isNearMe, setIsNearMe] = useState(true); // Default to near me if location exists
  const [radius, setRadius] = useState(2); // Default 2km
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'gyms' ? '/gyms/' : '/trainers/';
      const params: any = {
        search,
        page_size: 20,
        sort_by: isNearMe ? 'distance' : 'rating'
      };

      if (selectedLocation) {
        params.lat = selectedLocation.latitude;
        params.lng = selectedLocation.longitude;
        if (isNearMe) {
          params.radius = radius;
        }
      }

      const response = await axios.get(`${API_URL}${endpoint}`, { params });
      setItems(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, isNearMe, selectedLocation, radius]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleNearMe = () => {
    if (!isNearMe) {
      setIsNearMe(true);
      if (!selectedLocation) {
        refreshGPS();
      }
      
      // Show info modal if not hidden
      if (!localStorage.getItem('hideDiscoveryNearMeInfo')) {
        setIsInfoModalOpen(true);
      }
    } else {
      setIsNearMe(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Header */}
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter italic">EXPLORE</h1>
          <p className="text-sm md:text-base text-white/40">Find the best fitness facilities and mentors near you.</p>
        </div>

        <div className="relative group max-w-2xl">
          <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-30 transition-opacity pointer-events-none" />
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 focus-within:border-primary/50 transition-all shadow-2xl backdrop-blur-xl">
            <div className="pl-6 text-white/20">
              <Search size={22} />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'gyms' ? 'gyms, crossfit, yoga...' : 'fitness coaches...'}`}
              className="flex-1 min-w-0 bg-transparent border-none py-4 sm:py-5 px-3 sm:px-4 focus:ring-0 outline-none text-sm sm:text-base text-white font-medium placeholder:text-white/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={handleNearMe}
                disabled={isLocating}
                title="Near Me"
                className={clsx(
                  "p-3 sm:p-4 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0",
                  isNearMe ? "bg-primary text-black" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
                {isNearMe && <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Active</span>}
              </button>

              <button
                title="Filters"
                className="p-3 sm:p-4 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all shrink-0"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isNearMe && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 mt-4 ml-2"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mr-2">Radius</span>
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {[1, 2, 5, 10].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border",
                        radius === r 
                          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(241,130,44,0.1)]" 
                          : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {r}KM
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
          {(['gyms', 'trainers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'
                }`}
            >
              {tab}
              {tab === 'trainers' && (
                <span className="text-[8px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full border border-white/5 tracking-tighter">
                  SOON
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <AnimatePresence mode="popLayout">
          {activeTab === 'trainers' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
                <div className="absolute inset-0 bg-primary blur-2xl opacity-20" />
                <Lock size={40} className="relative z-10" />
              </div>
              <div className="space-y-2 max-w-sm">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Coming Soon</span>
                  <Sparkles size={16} />
                </div>
                <h2 className="text-3xl font-display font-black italic tracking-tight">EXPERT MENTORS ARE ARRIVING</h2>
                <p className="text-white/40 text-sm leading-relaxed px-4">
                  We're currently vetting the elite trainers in your city to ensure you get only the best guidance. Check back soon!
                </p>
              </div>
            </motion.div>
          ) : loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
            ))
          ) : (items?.length ?? 0) > 0 ? items.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (activeTab === 'gyms') navigate(`/app/gyms/${item.id}`);
                else navigate(`/app/trainers/${item.id}`);
              }}
              className="glass-card group overflow-hidden cursor-pointer flex flex-col h-full hover:border-primary/30 transition-colors"
            >
              <div className="h-40 md:h-48 relative overflow-hidden bg-white/5 shrink-0">
                {activeTab === 'gyms' ? (
                  (item.cover_image_url || item.logo_url) ? (
                    <img
                      src={item.cover_image_url || item.logo_url}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-700">
                      <Building2 size={100} />
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-700">
                    <User size={100} />
                  </div>
                )}

                {/* badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {item.distance !== undefined && item.distance !== null && (
                    <div className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
                      {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`} away
                    </div>
                  )}
                  {activeTab === 'gyms' && item.max_capacity && (
                    <div className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur-md border",
                      (item.current_occupancy / item.max_capacity) > 0.8 ? "bg-red-500/80 text-white border-red-500/20" :
                        (item.current_occupancy / item.max_capacity) > 0.5 ? "bg-orange-500/80 text-white border-orange-500/20" :
                          "bg-emerald-500/80 text-white border-emerald-500/20"
                    )}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      Live
                    </div>
                  )}
                </div>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                  <Star className="text-primary fill-primary" size={14} />
                  <span className="text-xs font-bold">{item.rating_avg?.toFixed(1) || 'NEW'}</span>
                </div>
              </div>

              <div className="p-5 md:p-8 space-y-4 flex flex-col flex-1">
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                    {activeTab === 'gyms' ? item.name : item.full_name || 'Pro Trainer'}
                  </h3>
                  {activeTab === 'gyms' && item.description && (
                    <p className="text-[11px] md:text-xs text-white/30 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div 
                    role="button"
                    onClick={(e) => openInMap(e, activeTab === 'gyms' ? (item.address_line1 || item.city) : item.location, item.latitude, item.longitude)}
                    className="text-white/40 text-[10px] md:text-[11px] flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer group/addr"
                  >
                    <MapPin size={12} className="shrink-0 text-primary/50 group-hover/addr:text-primary group-hover/addr:scale-110 transition-all" />
                    <span className="line-clamp-1 border-b border-transparent group-hover/addr:border-primary/30">
                      {activeTab === 'gyms' ? (item.address_line1 || item.city) : (item.location || 'Online / Home Visits')}
                    </span>
                  </div>
                </div>

                {activeTab === 'gyms' && item.max_capacity && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Crowd Status</span>
                    </div>
                    <span className="text-xs font-black">
                      {item.current_occupancy} <span className="text-white/20 font-medium">/ {item.max_capacity}</span>
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Starting from</span>
                    <span className="text-lg font-black text-primary">₹{activeTab === 'gyms' ? (item.starting_price?.toLocaleString() || '1,500') : (item.hourly_rate || '500')}/mo</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-24 text-center glass-card border-dashed">
              <p className="text-white/20 font-display text-4xl mb-4 italic">NO RESULTS</p>
              <p className="text-white/40">Try adjusting your filters or search keywords.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <InfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Nearest Gyms"
        description={`We're currently showing gyms within a ${radius}km radius of your location, sorted by proximity to give you the most convenient options.`}
        icon={Sparkles}
        storageKey="hideDiscoveryNearMeInfo"
      />
    </div>
  );
};

export default Discovery;
