import { Outlet } from 'react-router-dom';
import { LocationProvider } from '../context/LocationContext';

/**
 * Location (GPS, saved addresses, Google Maps loader) for the signed-in app and onboarding only.
 * Loaded lazily so public pages never download the Maps JavaScript.
 */
export default function WithLocation() {
  return (
    <LocationProvider>
      <Outlet />
    </LocationProvider>
  );
}
