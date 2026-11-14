import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { useGeoLocation } from '../../context/LocationContext';
import { useTheme } from '../../theme/themeContext';
import { Text, cn } from '../kit';

export type MapPoint = { id: string; lat: number; lng: number; title?: string };

/** Google "night" style, used when the page is in dark mode. */
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

/**
 * Map sliver for Explore and gym profiles. Follows the light/dark theme; falls back to a
 * quiet placeholder when Maps isn't configured or fails to load.
 */
export function MapPanel({
  center,
  points = [],
  zoom = 13,
  onPick,
  className,
}: {
  center: { lat: number; lng: number } | null;
  points?: MapPoint[];
  zoom?: number;
  onPick?: (id: string) => void;
  className?: string;
}) {
  const { isLoaded, mapsLoadError, hasMapsApiKey } = useGeoLocation();
  const { scheme } = useTheme();
  const c = center ?? (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null);
  if (!hasMapsApiKey || mapsLoadError || !isLoaded || !c) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 bg-surface-sunken text-ink-subtle', className)} data-testid="map-placeholder">
        <MapPin size={22} aria-hidden />
        <Text variant="caption" tone="subtle">
          {c ? 'Map unavailable' : 'Set your location to see the map'}
        </Text>
      </div>
    );
  }
  return (
    <div className={cn('overflow-hidden', className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={c}
        zoom={zoom}
        options={{ styles: scheme === 'dark' ? darkMapStyles : undefined, disableDefaultUI: true, zoomControl: true, clickableIcons: false }}>
        {points.map(p => (
          <MarkerF
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            title={p.title}
            onClick={onPick ? () => onPick(p.id) : undefined}
            icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: '#FF5722', fillOpacity: 1, strokeWeight: 2, strokeColor: '#ffffff', scale: 8 }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
