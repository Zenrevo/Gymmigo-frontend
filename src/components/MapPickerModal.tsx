import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, X, Navigation, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const lib: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface AddressResult {
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: AddressResult) => void;
  initialCenter?: { lat: number; lng: number };
}

const MapPickerModal = ({ isOpen, onClose, onConfirm, initialCenter }: MapPickerModalProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: lib,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);

  const geocodeTimeout = useRef<any>(null);
  const skipNextGeocode = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const performGeocode = useCallback(async (lat: number, lng: number, updateInput = true) => {
    if (!window.google) return;
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response && response.results && response.results[0]) {
        const result = response.results[0];
        const comps = result.address_components;

        const getComp = (type: string) => comps.find(c => c.types.includes(type))?.long_name || '';

        const newAddress = {
          address_line1: result.formatted_address,
          city: getComp('locality') || getComp('postal_town') || getComp('administrative_area_level_2'),
          state: getComp('administrative_area_level_1'),
          pincode: getComp('postal_code'),
          latitude: lat,
          longitude: lng
        };

        setAddress(newAddress);
        
        if (updateInput && searchInputRef.current) {
          searchInputRef.current.value = result.formatted_address;
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const onIdle = useCallback(() => {
    if (!map) return;
    if (skipNextGeocode.current) {
      skipNextGeocode.current = false;
      return;
    }

    const newCenter = map.getCenter();
    if (!newCenter) return;

    const lat = newCenter.lat();
    const lng = newCenter.lng();

    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    geocodeTimeout.current = setTimeout(() => {
      performGeocode(lat, lng, true);
    }, 600);
  }, [map, performGeocode]);

  const onPlaceChanged = () => {
    if (searchBox !== null) {
      const place = searchBox.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        skipNextGeocode.current = true;
        map?.panTo({ lat, lng });
        map?.setZoom(17);

        const comps = place.address_components || [];
        const getComp = (type: string) => comps.find(c => c.types.includes(type))?.long_name || '';

        setAddress({
          address_line1: place.formatted_address || '',
          city: getComp('locality') || getComp('postal_town') || getComp('administrative_area_level_2'),
          state: getComp('administrative_area_level_1'),
          pincode: getComp('postal_code'),
          latitude: lat,
          longitude: lng
        });
      }
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        skipNextGeocode.current = false; // We want to geocode after getting current position
        map?.panTo({ lat: latitude, lng: longitude });
        map?.setZoom(17);
        performGeocode(latitude, longitude, true);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl h-full sm:h-[85vh] bg-neutral-900 sm:rounded-3xl overflow-hidden flex flex-col relative shadow-2xl border border-white/5"
        >
          <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
               <button onClick={onClose} className="p-3 rounded-2xl bg-black/60 hover:bg-black border border-white/10 text-white transition-all">
                 <X size={20} />
               </button>
               <div className="flex-1 relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
                 {isLoaded && (
                   <Autocomplete 
                      onLoad={setSearchBox} 
                      onPlaceChanged={onPlaceChanged}
                      options={{ componentRestrictions: { country: 'in' } }}
                   >
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search area, landmark or street..."
                        className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all shadow-xl"
                      />
                   </Autocomplete>
                 )}
               </div>
               <button 
                  onClick={handleCurrentLocation}
                  className="p-3 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all shadow-lg"
               >
                  <Navigation size={20} />
               </button>
            </div>
          </div>

          <div className="flex-1 relative bg-neutral-800">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={initialCenter || { lat: 19.0760, lng: 72.8777 }}
                zoom={15}
                onLoad={setMap}
                onIdle={onIdle}
                onDragStart={() => {
                  skipNextGeocode.current = false;
                }}
                options={{
                  disableDefaultUI: true,
                  styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
                  ]
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/20">
                <Loader2 className="animate-spin" size={40} />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Maps...</span>
              </div>
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] pointer-events-none z-10 flex flex-col items-center">
               <div className="bg-primary text-white p-3 rounded-full shadow-[0_0_30px_rgba(255,107,0,0.5)] border-2 border-white animate-bounce-subtle">
                 <MapPin size={24} fill="currentColor" />
               </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
               <motion.div 
                 initial={false}
                 animate={{ y: address ? 0 : 100, opacity: address ? 1 : 0 }}
                 className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Location Identified</span>
                        {isGeocoding && <Loader2 className="animate-spin text-primary" size={12} />}
                      </div>
                      <h3 className="text-xl font-bold line-clamp-1 leading-tight">
                        {address?.address_line1.split(',')[0]}
                      </h3>
                      <p className="text-sm text-white/40 line-clamp-2">
                         {address?.address_line1}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2">
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="block text-[8px] font-bold text-white/40 uppercase mb-1">City/Area</span>
                          <span className="text-xs font-bold text-white/80">{address?.city || 'Detecting...'}</span>
                       </div>
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="block text-[8px] font-bold text-white/40 uppercase mb-1">Pincode</span>
                          <span className="text-xs font-bold text-primary">{address?.pincode || 'Detecting...'}</span>
                       </div>
                    </div>

                    <button 
                      disabled={!address || isGeocoding}
                      onClick={() => address && onConfirm(address)}
                      className="w-full py-4 rounded-2xl bg-primary hover:bg-orange-600 font-display font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_10px_20px_rgba(255,107,0,0.3)]"
                    >
                      Confirm Location
                      <Check size={20} />
                    </button>
                 </div>
               </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapPickerModal;
