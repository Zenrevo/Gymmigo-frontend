import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, MapPin, Sparkles } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import InfoModal from '../components/InfoModal';
import MapPickerModal from '../components/MapPickerModal';
import SocialHubDrawer from '../components/social/SocialHubDrawer';
import { cn } from '../components/kit';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation, type AddressResult } from '../context/LocationContext';
import api from '../utils/api';
import { AvatarMenu } from './AvatarMenu';
import { LegacyThemeContext } from './legacyThemeContext';
import { gymNav, isActive, primaryNav, secondaryNav, type NavItem } from './navConfig';

/**
 * App shell, mirroring the mobile app:
 * - ≥768px: left sidebar (primary + secondary nav) and a top bar (location, notifications, avatar menu)
 * - <768px: compact top bar and a bottom tab bar with Migo as the raised centre button
 */
export default function MainLayout() {
  const { user } = useAuth();
  const { selectedLocation, updateSelectedLocation, isMismatch, currentGPS, isLoaded } = useGeoLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const [forcedDark, setForcedDark] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [detected, setDetected] = useState<AddressResult | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const syncAttempted = useRef(false);
  const [gymBranding, setGymBranding] = useState<{ id: string; name: string; logo?: string | null } | null>(null);

  const role = user?.active_role;
  const gymMatch = location.pathname.match(/\/app\/gym-owner\/gyms\/([^/\s]+)/);
  const activeGymId = role === 'gym_owner' && gymMatch ? gymMatch[1] : null;
  const branding = gymBranding?.id === activeGymId ? gymBranding : null;
  const primary = primaryNav(role);
  const secondary = secondaryNav(role);
  const showLocation = role !== 'gym_owner';

  // Social hub drawer lives behind ?social=true (kept from the previous shell).
  const params = new URLSearchParams(location.search);
  const socialOpen = params.get('social') === 'true';
  const socialTab = params.get('socialTab') ?? 'feed';
  const openSocial = (tab = 'feed') => {
    const p = new URLSearchParams(location.search);
    p.set('social', 'true');
    p.set('socialTab', tab);
    navigate(`${location.pathname}?${p.toString()}`, { replace: true });
  };
  const closeSocial = () => {
    const p = new URLSearchParams(location.search);
    p.delete('social');
    p.delete('socialTab');
    const q = p.toString();
    navigate(`${location.pathname}${q ? `?${q}` : ''}`, { replace: true });
  };

  useEffect(() => {
    if (!activeGymId) return;
    let alive = true;
    api
      .get(`/gym-owner/gyms/${activeGymId}`)
      .then(res => {
        if (alive && res.data.data?.name) setGymBranding({ id: activeGymId, name: res.data.data.name, logo: res.data.data.logo_url });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [activeGymId]);

  // First visit with GPS but no saved location: offer to use the detected area.
  useEffect(() => {
    if (!isLoaded || selectedLocation || !currentGPS || syncAttempted.current) return;
    syncAttempted.current = true;
    new google.maps.Geocoder().geocode({ location: { lat: currentGPS.lat, lng: currentGPS.lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) return;
      const r = results[0];
      const get = (t: string) => r.address_components.find(c => c.types.includes(t))?.long_name || '';
      setDetected({
        latitude: currentGPS.lat,
        longitude: currentGPS.lng,
        address_line1: r.formatted_address,
        city: get('locality') || get('postal_town') || get('administrative_area_level_2'),
        state: get('administrative_area_level_1'),
        pincode: get('postal_code'),
      });
      setSyncOpen(true);
    });
  }, [currentGPS, selectedLocation, isLoaded]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const locationButton = (compact: boolean) => (
    <button
      type="button"
      onClick={() => setMapOpen(true)}
      className={cn(
        'group flex min-w-0 items-center gap-2.5 rounded-full border bg-surface py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-surface-sunken',
        isMismatch ? 'border-accent' : 'border-border',
        compact ? 'max-w-[62vw]' : 'max-w-[320px]',
      )}
      aria-label={selectedLocation ? `Location: ${selectedLocation.address_line1}. Change` : 'Set your location'}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
        <MapPin size={15} aria-hidden />
        {isMismatch ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" /> : null}
      </span>
      <span className="min-w-0">
        <span className="t-subtitle block truncate text-ink">{selectedLocation?.city || selectedLocation?.address_line1 || 'Select location'}</span>
        <span className="t-label-sm block truncate text-ink-subtle">{isMismatch ? 'GPS mismatch · update' : 'Training near'}</span>
      </span>
      <ChevronDown size={14} className="shrink-0 text-ink-subtle" aria-hidden />
    </button>
  );

  const sideLink = (item: NavItem) => {
    const active = isActive(item, location.pathname);
    const cls = cn(
      't-callout flex w-full items-center gap-3 rounded-gm-md px-3 py-2.5 transition-colors',
      active ? 'bg-accent-soft font-semibold text-accent-text' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
    );
    if (item.social) {
      return (
        <button key={item.key} type="button" onClick={() => openSocial('feed')} className={cn(cls, socialOpen && 'bg-accent-soft text-accent-text')}>
          <item.icon size={18} aria-hidden />
          {item.label}
        </button>
      );
    }
    return (
      <Link key={item.key} to={item.to} aria-current={active ? 'page' : undefined} className={cls}>
        <item.icon size={18} aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <LegacyThemeContext.Provider value={setForcedDark}>
      <div data-theme={forcedDark ? 'dark' : undefined} className="min-h-dvh bg-background text-ink">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-border bg-surface md:flex">
          <Link to="/app/dashboard" className="flex h-[72px] shrink-0 items-center px-5" aria-label="Gymmigo home">
            {branding ? (
              <span className="flex min-w-0 items-center gap-3">
                {branding.logo ? (
                  <img src={branding.logo} alt="" className="h-10 w-10 shrink-0 rounded-gm-md border border-border object-cover" />
                ) : (
                  <BrandLogo size={40} showText={false} />
                )}
                <span className="min-w-0">
                  <span className="t-label-sm block text-accent-text">Managing</span>
                  <span className="t-subtitle block truncate text-ink">{branding.name}</span>
                </span>
              </span>
            ) : (
              <BrandLogo size={36} />
            )}
          </Link>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4" aria-label="Main">
            {primary.map(sideLink)}
            {activeGymId ? (
              <>
                <p className="t-label-sm px-3 pb-1 pt-5 text-ink-subtle">This gym</p>
                {gymNav(activeGymId).map(item => {
                  const active = item.key === 'overview' ? location.pathname === item.to : isActive(item, location.pathname);
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        't-callout flex items-center gap-3 rounded-gm-md px-3 py-2.5 transition-colors',
                        active ? 'bg-accent-soft font-semibold text-accent-text' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                      )}>
                      <item.icon size={18} aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            ) : null}
            {secondary.length ? <p className="t-label-sm px-3 pb-1 pt-5 text-ink-subtle">More</p> : null}
            {secondary.map(sideLink)}
          </nav>
        </aside>

        <div className="flex min-h-dvh flex-col md:pl-[248px]">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 md:h-[72px] md:px-8">
              <Link to="/app/dashboard" className="md:hidden" aria-label="Gymmigo home">
                <BrandLogo size={34} showText={false} />
              </Link>
              {showLocation ? <div className="min-w-0 flex-1">{locationButton(true)}</div> : <div className="flex-1" />}
              <button
                type="button"
                aria-label="Notifications"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-sunken sm:inline-flex">
                <Bell size={18} aria-hidden />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              </button>
              <AvatarMenu extraNav={secondary} onSocial={() => openSocial('feed')} />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-12 md:pt-8">
            <Outlet />
          </main>
        </div>

        {/* Mobile bottom tab bar (Migo raised in the centre, like the app) */}
        <nav
          aria-label="Tabs"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-tab-bar pb-[env(safe-area-inset-bottom)] grid md:hidden"
          style={{ gridTemplateColumns: `repeat(${primary.length}, minmax(0, 1fr))` }}>
          {primary.map(item => {
            const active = isActive(item, location.pathname);
            if (item.center) {
              return (
                <Link key={item.key} to={item.to} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center justify-end pb-2 pt-1">
                  <span
                    className={cn(
                      'absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-accent text-on-accent shadow-[0_10px_24px_-8px_rgba(255,87,34,0.65)]',
                    )}>
                    <item.icon size={24} fill="currentColor" aria-hidden />
                  </span>
                  <span className={cn('t-caption mt-8', active ? 'font-bold text-accent-text' : 'text-ink-subtle')}>{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-1 py-2.5', active ? 'text-accent-text' : 'text-ink-subtle')}>
                <item.icon size={22} strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                <span className={cn('t-caption', active && 'font-bold')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <MapPickerModal
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          onConfirm={addr => {
            updateSelectedLocation({
              latitude: addr.latitude,
              longitude: addr.longitude,
              address_line1: addr.address_line1,
              city: addr.city,
              state: addr.state,
              pincode: addr.pincode,
            });
            setMapOpen(false);
          }}
        />
        <InfoModal
          isOpen={syncOpen}
          onClose={() => setSyncOpen(false)}
          title="Location detected"
          description={`We've found your area: ${detected?.address_line1}. Use this location for distances?`}
          icon={Sparkles}
          confirmText="Use this location"
          onConfirm={() => {
            if (detected) updateSelectedLocation(detected);
          }}
        />
        <div data-theme="dark">
          <SocialHubDrawer isOpen={socialOpen} onClose={closeSocial} defaultTab={socialTab} />
        </div>
      </div>
    </LegacyThemeContext.Provider>
  );
}
