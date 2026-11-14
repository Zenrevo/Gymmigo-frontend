import { useEffect, useRef, useState, Suspense } from 'react';
import PageLoader from '../components/PageLoader';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, MapPin, Sparkles } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import InfoModal from '../components/InfoModal';
import MapPickerModal from '../components/MapPickerModal';
import SocialHubDrawer from '../components/social/SocialHubDrawer';
import { cn } from '../components/kit';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation, type AddressResult } from '../context/LocationContext';
import api from '../utils/api';
import { AvatarMenu } from './AvatarMenu';
import { gymIcon as GymIcon, gymNav, isActive, roleNav, type NavItem } from './navConfig';
import { useSidebarCollapsed } from './useSidebarCollapsed';

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
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const [ownerGyms, setOwnerGyms] = useState<{ id: string; name: string }[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [detected, setDetected] = useState<AddressResult | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const syncAttempted = useRef(false);
  const [gymBranding, setGymBranding] = useState<{ id: string; name: string; logo?: string | null } | null>(null);

  const role = user?.active_role;
  const isOwner = role === 'gym_owner' || role === 'gym_manager';
  const gymMatch = location.pathname.match(/\/app\/gym-owner\/gyms\/([^/\s]+)/);
  const activeGymId = isOwner && gymMatch ? gymMatch[1] : null;
  const branding = gymBranding?.id === activeGymId ? gymBranding : null;
  const nav = roleNav(role);
  const showLocation = !isOwner;
  const here = (item: NavItem) => isActive(item, location.pathname, location.search);

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

  // Owners: their gyms for the sidebar's "My gyms" section.
  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    api
      .get('/gym-owner/gyms')
      .then(res => {
        const d = res.data.data;
        // Each entry is `{ gym, addresses, … }` (older responses were flat gym objects).
        type Entry = { id?: string; name?: string; gym?: { id: string; name: string } };
        const list: Entry[] = Array.isArray(d) ? d : (d?.gyms ?? []);
        const gyms = list.map(e => e.gym ?? e).filter((g): g is { id: string; name: string } => !!g?.id);
        if (alive) setOwnerGyms(gyms.map(g => ({ id: g.id, name: g.name || 'Untitled gym' })));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isOwner, user?.id, activeGymId]);

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
        compact ? 'max-w-[62vw] md:max-w-[320px]' : 'max-w-[320px]',
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

  const linkClass = (active: boolean, nested = false) =>
    cn(
      'relative flex w-full items-center rounded-gm-md transition-colors',
      collapsed ? 'h-11 justify-center' : cn('gap-3 px-3', nested ? 'py-2 t-footnote' : 'py-2.5 t-callout'),
      active
        ? 'bg-accent-soft font-semibold text-accent-text before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-accent'
        : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
    );

  const sideLink = (item: NavItem, nested = false) => {
    const active = item.social ? socialOpen : here(item);
    const content = (
      <>
        <item.icon size={nested ? 16 : 18} className="shrink-0" aria-hidden />
        <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
      </>
    );
    const tip = collapsed ? item.label : undefined;
    if (item.social) {
      return (
        <button key={item.key} type="button" title={tip} onClick={() => openSocial('feed')} className={linkClass(active, nested)}>
          {content}
        </button>
      );
    }
    return (
      <Link key={item.key} to={item.to} title={tip} aria-current={active ? 'page' : undefined} className={linkClass(active, nested)}>
        {content}
      </Link>
    );
  };

  const sectionLabel = (label: string) =>
    collapsed ? <div className="mx-3 my-3 h-px bg-border" aria-hidden /> : <p className="t-label-sm px-3 pb-1 pt-5 text-ink-subtle">{label}</p>;

  const ownerGymsSection = isOwner ? (
    <div role="group" aria-label="My gyms">
      {sectionLabel('My gyms')}
      {ownerGyms.length === 0 && !collapsed ? <p className="t-footnote px-3 py-1 text-ink-subtle">No gyms yet</p> : null}
      {ownerGyms.map(g => {
        const selected = g.id === activeGymId;
        const item: NavItem = { key: `gym-${g.id}`, label: g.name, to: `/app/gym-owner/gyms/${g.id}`, icon: GymIcon, exact: true };
        return (
          <div key={g.id}>
            {sideLink(item)}
            {selected ? (
              <div className={cn('mb-1 mt-0.5 flex flex-col gap-0.5', !collapsed && 'ml-4 border-l border-border pl-2')}>
                {gymNav(g.id).map(i => sideLink(i, true))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  ) : null;

  const sidebarW = collapsed ? 'md:w-[72px]' : 'md:w-[248px]';

  return (
      <div className="flex min-h-dvh bg-background text-ink">
        {/* Desktop sidebar (collapsible to an icon rail) */}
        <aside
          className={cn(
            'sticky top-0 z-40 hidden h-dvh shrink-0 flex-col self-start border-r border-border bg-surface transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex',
            sidebarW,
          )}
          aria-label="Sidebar">
          <div className={cn('flex h-[72px] shrink-0 items-center', collapsed ? 'justify-center px-2' : 'px-5')}>
            <Link to="/app/dashboard" className="flex min-w-0 items-center rounded-gm-md" aria-label="Gymmigo home">
              {branding && !collapsed ? (
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
                <BrandLogo size={36} showText={!collapsed} />
              )}
            </Link>
          </div>
          <nav className="gm-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 pb-3" aria-label="Main">
            {nav.sections.map((section, i) => (
              <div key={section.key} className="flex flex-col gap-0.5">
                {section.label ? sectionLabel(section.label) : i > 0 && !collapsed ? <div className="h-3" /> : null}
                {section.items.map(item => sideLink(item))}
                {isOwner && section.key === 'main' ? ownerGymsSection : null}
              </div>
            ))}
          </nav>
          <div className="shrink-0 border-t border-border p-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                't-footnote flex h-10 w-full items-center gap-3 rounded-gm-md text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink',
                collapsed ? 'justify-center' : 'px-3',
              )}>
              {collapsed ? <ChevronsRight size={18} aria-hidden /> : <ChevronsLeft size={18} aria-hidden />}
              {collapsed ? null : <span>Collapse</span>}
            </button>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2 px-4 sm:gap-3 md:h-[72px] md:px-8">
              <Link to="/app/dashboard" className="shrink-0 rounded-gm-md md:hidden" aria-label="Gymmigo home">
                <BrandLogo size={34} showText={false} />
              </Link>
              {showLocation ? <div className="min-w-0 flex-1">{locationButton(true)}</div> : <div className="flex-1" />}
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-sunken sm:inline-flex">
                <Bell size={18} aria-hidden />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              </button>
              <AvatarMenu extraNav={nav.more} onSocial={() => openSocial('feed')} />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-12 md:pt-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        {/* Mobile bottom tab bar (Migo raised in the centre, like the app) */}
        <nav
          aria-label="Tabs"
          className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-tab-bar pb-[env(safe-area-inset-bottom)] md:hidden"
          style={{ gridTemplateColumns: `repeat(${nav.tabs.length}, minmax(0, 1fr))` }}>
          {nav.tabs.map(item => {
            const active = here(item);
            if (item.center) {
              return (
                <Link key={item.key} to={item.to} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center justify-end pb-2 pt-1">
                  <span className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-accent text-on-accent shadow-[0_10px_24px_-8px_rgba(255,87,34,0.65)]">
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
                className={cn('flex min-w-0 flex-col items-center gap-1 py-2.5', active ? 'text-accent-text' : 'text-ink-subtle')}>
                <item.icon size={22} strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                <span className={cn('t-caption max-w-full truncate px-1', active && 'font-bold')}>{item.label}</span>
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
        <SocialHubDrawer isOpen={socialOpen} onClose={closeSocial} defaultTab={socialTab} />
      </div>
  );
}
