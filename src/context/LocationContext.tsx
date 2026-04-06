import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export interface AddressResult {
  latitude: number;
  longitude: number;
  address_line1: string;
  city: string;
  state?: string;
  pincode?: string;
}

interface LocationContextType {
  selectedLocation: AddressResult | null;
  currentGPS: { lat: number; lng: number } | null;
  isMismatch: boolean;
  isLocating: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  updateSelectedLocation: (loc: AddressResult) => void;
  refreshGPS: () => Promise<void>;
  isLoaded: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [selectedLocation, setSelectedLocation] = useState<AddressResult | null>(() => {
    const saved = localStorage.getItem('selectedLocation');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const updateSelectedLocation = (loc: AddressResult) => {
    setSelectedLocation(loc);
    localStorage.setItem('selectedLocation', JSON.stringify(loc));
  };

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
    return R * c;
  };

  const isMismatch = Boolean(
    selectedLocation && 
    currentGPS && 
    getDistance(selectedLocation.latitude, selectedLocation.longitude, currentGPS.lat, currentGPS.lng) > 1000 // 1km threshold
  );

  const refreshGPS = useCallback(async () => {
    if (!("geolocation" in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGPS({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermissionStatus('granted');
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        if (err.code === 1) setPermissionStatus('denied');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    refreshGPS();
  }, [refreshGPS]);

  return (
    <LocationContext.Provider value={{ 
      selectedLocation, 
      currentGPS, 
      isMismatch, 
      isLocating, 
      permissionStatus,
      updateSelectedLocation, 
      refreshGPS,
      isLoaded
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useGeoLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useGeoLocation must be used within a LocationProvider');
  }
  return context;
};
