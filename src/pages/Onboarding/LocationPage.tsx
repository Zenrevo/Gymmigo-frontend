import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, useToast } from '../../components/kit';
import { AddressForm } from '../../components/location/AddressForm';
import { emptyAddress, type AddressValue } from '../../components/location/address';
import { useAuth } from '../../context/AuthContext';
import { useGeoLocation } from '../../context/LocationContext';
import api, { getApiErrorMessage } from '../../utils/api';
import { OnboardingFrame } from './OnboardingFrame';
import { clearPendingProfile, readPendingProfile } from './pendingProfile';

/**
 * Member step 3 (optional): saves the profile (PATCH /profile/me) and, if given, the home address
 * (POST /profile/me/addresses, never blocking), then marks the role complete → dashboard.
 */
export default function LocationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { markRoleCompleted } = useAuth();
  const { updateSelectedLocation } = useGeoLocation();
  const [address, setAddress] = useState<AddressValue>(emptyAddress);
  const [loading, setLoading] = useState<'save' | 'skip' | null>(null);
  const [error, setError] = useState('');
  const profile = readPendingProfile();

  if (!profile) return <Navigate to="/onboarding/profile?role=user" replace />;
  const hasAddress = Boolean(address.address_line1.trim());

  const finish = async (withAddress: boolean) => {
    setLoading(withAddress ? 'save' : 'skip');
    setError('');
    try {
      await api.patch('/profile/me', {
        full_name: profile.full_name,
        email: profile.email || undefined,
        city: withAddress ? address.city.trim() || undefined : undefined,
      });
      if (withAddress && hasAddress) {
        try {
          await api.post('/profile/me/addresses', {
            address_line1: address.address_line1,
            landmark: address.landmark || undefined,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude ?? undefined,
            longitude: address.longitude ?? undefined,
            country: 'India',
            label: 'home',
            is_primary: true,
          });
          if (address.latitude != null && address.longitude != null) {
            updateSelectedLocation({
              latitude: address.latitude,
              longitude: address.longitude,
              address_line1: address.address_line1,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            });
          }
        } catch {
          // The address is optional: never block onboarding on it (same as the app).
        }
      }
      await markRoleCompleted('user');
      clearPendingProfile();
      toast({ tone: 'success', title: 'Profile completed!' });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Could not save your profile.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <OnboardingFrame
      step={3}
      total={3}
      onBack={() => navigate('/onboarding/profile?role=user')}
      footer={
        <div className="flex flex-col gap-2">
          {error ? (
            <p className="t-footnote text-center text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button label="Finish" fullWidth loading={loading === 'save'} disabled={!hasAddress || loading === 'skip'} onClick={() => finish(true)} />
          <Button label="Skip for now" variant="ghost" fullWidth loading={loading === 'skip'} disabled={loading === 'save'} onClick={() => finish(false)} />
        </div>
      }>
      <h1 className="t-display text-ink">Where are you based?</h1>
      <p className="t-body mt-2 text-ink-muted">We use this to show gyms near you. You can skip this and add it later.</p>
      <div className="mt-8">
        <AddressForm value={address} onChange={setAddress} />
      </div>
    </OnboardingFrame>
  );
}
