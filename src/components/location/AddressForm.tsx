import { useState } from 'react';
import { LocateFixed, Map as MapIcon } from 'lucide-react';
import MapPickerModal from '../MapPickerModal';
import { Button, TextField } from '../kit';
import { useGeoLocation } from '../../context/LocationContext';

import { type AddressValue } from './address';

export type { AddressValue };

type Geocoded = { address_line1: string; city: string; state: string; pincode: string; latitude: number; longitude: number };

function reverseGeocode(lat: number, lng: number): Promise<Geocoded | null> {
  if (typeof google === 'undefined' || !google.maps?.Geocoder) return Promise.resolve(null);
  return new google.maps.Geocoder()
    .geocode({ location: { lat, lng } })
    .then(({ results }) => {
      const r = results?.[0];
      if (!r) return null;
      const get = (t: string) => r.address_components.find(c => c.types.includes(t))?.long_name ?? '';
      return {
        address_line1: r.formatted_address,
        city: get('locality') || get('postal_town') || get('administrative_area_level_2'),
        state: get('administrative_area_level_1'),
        pincode: get('postal_code'),
        latitude: lat,
        longitude: lng,
      };
    })
    .catch(() => null);
}

/** App `AddressForm`: GPS / map pick buttons, then editable address fields. */
export function AddressForm({ value, onChange }: { value: AddressValue; onChange: (v: AddressValue) => void }) {
  const { isLoaded } = useGeoLocation();
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const set = (key: keyof AddressValue) => (v: string) => onChange({ ...value, [key]: v });

  const useGps = () => {
    if (!('geolocation' in navigator)) return setGpsError('Location isn’t available in this browser.');
    setLocating(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const g = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        onChange(
          g
            ? { ...value, ...g }
            : { ...value, latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        );
        if (!g) setGpsError(isLoaded ? 'We found your position but not an address. Type it below.' : 'Maps are unavailable. Type your address below.');
        setLocating(false);
      },
      err => {
        setGpsError(err.code === 1 ? 'Location permission is blocked. Allow it in your browser settings, or type your address.' : 'Couldn’t get your location. Try again or type it below.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <Button label={locating ? 'Locating…' : 'Use GPS'} icon={LocateFixed} variant="secondary" size="md" loading={locating} onClick={useGps} className="flex-1" />
        <Button label="Pick on map" icon={MapIcon} variant="secondary" size="md" onClick={() => setMapOpen(true)} className="flex-1" />
      </div>
      {gpsError ? <p className="t-footnote text-warning">{gpsError}</p> : null}
      <TextField label="Address" placeholder="Street, building…" value={value.address_line1} onChange={e => set('address_line1')(e.target.value)} autoComplete="street-address" />
      <TextField label="Landmark" optional placeholder="Near mall, behind hospital…" value={value.landmark} onChange={e => set('landmark')(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="City" placeholder="City" value={value.city} onChange={e => set('city')(e.target.value)} autoComplete="address-level2" />
        <TextField
          label="Pincode"
          placeholder="400001"
          inputMode="numeric"
          maxLength={6}
          value={value.pincode}
          onChange={e => set('pincode')(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoComplete="postal-code"
        />
      </div>
      <TextField label="State" placeholder="State" value={value.state} onChange={e => set('state')(e.target.value)} autoComplete="address-level1" />
      <MapPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        initialCenter={value.latitude != null && value.longitude != null ? { lat: value.latitude, lng: value.longitude } : undefined}
        onConfirm={a => {
          onChange({ ...value, ...a, landmark: value.landmark });
          setMapOpen(false);
        }}
      />
    </div>
  );
}
