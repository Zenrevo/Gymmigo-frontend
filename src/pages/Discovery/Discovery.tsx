import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Star, Filter, ArrowRight, Building2, User, LocateFixed, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Discovery = () => {
  const [activeTab, setActiveTab] = useState<'gyms' | 'trainers'>('gyms');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isNearMe, setIsNearMe] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'gyms' ? '/gyms/' : '/trainers/';
      const params: any = { 
        search, 
        page_size: 20,
        sort_by: isNearMe ? 'distance' : 'rating'
      };

      if (isNearMe && location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.radius = 20; // 20km radius for near me
      }

      const response = await axios.get(`${API_URL}${endpoint}`, { params });
      setItems(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, isNearMe, location]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleNearMe = () => {
    if (isNearMe) {
      setIsNearMe(false);
      return;
    }

    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsNearMe(true);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert("Could not get your location. Please check permissions.");
        }
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Header */}
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-display font-black tracking-tighter italic">EXPLORE</h1>
          <p className="text-white/40">Find the best fitness facilities and mentors near you.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={24} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleNearMe}
              disabled={isLocating}
              className={clsx(
                "glass-card px-6 flex items-center justify-center gap-3 transition-all group shrink-0",
                isNearMe ? "border-primary bg-primary/10" : "hover:border-white/20"
              )}
            >
              {isLocating ? (
                <Loader2 size={24} className="animate-spin text-primary" />
              ) : (
                <LocateFixed size={24} className={clsx("transition-colors", isNearMe ? "text-primary" : "group-hover:text-primary")} />
              )}
              <span className={clsx("font-bold text-sm uppercase tracking-widest hidden sm:inline", isNearMe && "text-primary")}>
                {isNearMe ? 'Near Me Active' : 'Near Me'}
              </span>
            </button>

            <button className="glass-card px-6 flex items-center justify-center gap-3 hover:border-white/20 transition-all group shrink-0">
              <Filter size={24} className="group-hover:text-primary" />
              <span className="font-bold text-sm uppercase tracking-widest hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
          {(['gyms', 'trainers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
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
              className="glass-card group overflow-hidden cursor-pointer flex flex-col h-full"
            >
              <div className="h-48 relative overflow-hidden bg-white/5 shrink-0">
                {activeTab === 'gyms' ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-700">
                    <Building2 size={100} />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-700">
                    <User size={100} />
                  </div>
                )}
                
                {/* badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                   {item.distance !== undefined && item.distance !== null && (
                     <div className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
                       {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`} away
                     </div>
                   )}
                   {item.is_verified && (
                     <div className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg whitespace-nowrap">
                       Verified
                     </div>
                   )}
                </div>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                  <Star className="text-primary fill-primary" size={14} />
                  <span className="text-xs font-bold">{item.rating_avg?.toFixed(1) || 'NEW'}</span>
                </div>
              </div>

              <div className="p-8 space-y-4 flex flex-col flex-1">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                    {activeTab === 'gyms' ? item.name : item.full_name || 'Pro Trainer'}
                  </h3>
                  <p className="text-white/40 text-sm flex items-center gap-1">
                    <MapPin size={14} className="shrink-0" />
                    <span className="line-clamp-1">{activeTab === 'gyms' ? (item.address_line1 || item.city) : (item.location || 'Online / Home Visits')}</span>
                  </p>
                </div>

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
    </div>
  );
};

export default Discovery;
