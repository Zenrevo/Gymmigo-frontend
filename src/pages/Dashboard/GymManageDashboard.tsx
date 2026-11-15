import { pickOwnerGym } from '../../api/owner';
import PageLoader from '../../components/PageLoader';
import type { OwnerGym } from '../../types/owner';
import { useEffect, Suspense } from 'react';
import { Outlet, useLocation, NavLink, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Dumbbell, LayoutDashboard, Star, Settings, Image as ImageIcon,
  CalendarDays, Wifi, Tags, IndianRupee, BarChart3, Shield, AlertTriangle, UserPlus, Trophy, Building2,
} from 'lucide-react';
import { Badge, Button, ErrorState, Skeleton, Text } from '../../components/kit';
import { gymWarning } from '../Owner/ownerFormat';
import { useGym } from '../../context/GymContext';
import clsx from 'clsx';
import { useNotification } from '../../context/NotificationContext';
import { API_URL } from '../../utils/api';

/** Same sections, order and labels as the owner sidebar (layouts/navConfig gymNav). */
const sections = [
  { id: '', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', name: 'Members', icon: Users },
  { id: 'plans', name: 'Plans', icon: Tags },
  { id: 'schedule', name: 'Schedule', icon: CalendarDays },
  { id: 'finance', name: 'Finance', icon: IndianRupee },
  { id: 'stats', name: 'Stats', icon: BarChart3 },
  { id: 'clubs', name: 'Clubs', icon: Trophy },
  { id: 'leads', name: 'Leads', icon: UserPlus },
  { id: 'team', name: 'Team', icon: Shield },
  { id: 'reviews', name: 'Reviews', icon: Star },
  { id: 'gallery', name: 'Gallery', icon: ImageIcon },
  { id: 'equipment', name: 'Equipment', icon: Dumbbell },
  { id: 'amenities', name: 'Amenities', icon: Wifi },
  { id: 'settings', name: 'Settings', icon: Settings },
];

const GymManageDashboard = () => {
  const location = useLocation();
  const { gym: gymPayload, loading, error, gymId, refetch } = useGym();
  const gym = pickOwnerGym(gymPayload) as (OwnerGym & { logo_url?: string | null }) | undefined;
  const { showNotification } = useNotification();

  // ── Global WebSockets for Live Updates ─────────────────────────────────────
  useEffect(() => {
    if (!gymId) return;
    
    // Replace http(s) with ws(s)
    const wsUrl = API_URL.replace(/^http/, 'ws') + `/ws/gyms/${gymId}`;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("Connected to global live updates");
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
             // Custom notification for global websocket events
             showNotification(data.message, 'success');
          }
          // Tell any mounted tabs (like Members) to fetch updated data silently
          window.dispatchEvent(new Event('gym_live_update_fetch'));
        } catch (e) {
          console.error("Error processing websocket message", e);
        }
      };
      
      ws.onclose = () => {
        console.log("Disconnected from live updates. Reconnecting in 5s...");
        reconnectTimer = setTimeout(connect, 5000);
      };
      
      return ws;
    };
    
    const ws = connect();
    
    return () => {
      clearTimeout(reconnectTimer);
      ws.onclose = null; // Prevent reconnect on unmount
      ws.close();
    };
  }, [gymId, showNotification]);

  const base = `/app/gym-owner/gyms/${gymId}`;
  const current = sections.find(sec => sec.id && location.pathname.startsWith(`${base}/${sec.id}`)) ?? sections[0];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-gm-xl" />
        <Skeleton className="h-64 rounded-gm-xl" />
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="space-y-4 py-10">
        <ErrorState title="Gym not found" message="It may have been removed, or you no longer manage it." onRetry={refetch ? () => refetch() : undefined} />
        <div className="flex justify-center">
          <Button label="Back to portfolio" variant="secondary" icon={ArrowLeft} to="/app/dashboard" />
        </div>
      </div>
    );
  }

  const warning = gymWarning(gym);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3 md:gap-4">
        <Link
          to="/app/dashboard"
          aria-label="Back to portfolio"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-gm-md border border-border bg-surface text-ink transition-colors hover:bg-surface-raised">
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-gm-lg bg-surface-sunken">
          {gym.logo_url ? (
            <img src={gym.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-accent-text"><Building2 size={22} aria-hidden /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Text variant="labelSm" tone="subtle">{current.name === 'Dashboard' ? 'Management dashboard' : current.name}</Text>
          <Text variant="h2" as="h1" truncate>{gym.name}</Text>
          <Text variant="caption" tone="subtle" className="font-mono" truncate>ID {String(gym.id).slice(0, 8).toUpperCase()}</Text>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 md:w-auto">
          <Badge label={gym.is_verified ? 'Verified' : 'Unverified'} tone={gym.is_verified ? 'info' : 'warning'} />
          <Badge label={gym.is_active === false ? 'Inactive' : 'Active'} tone={gym.is_active === false ? 'danger' : 'success'} dot />
        </div>
      </header>

      {warning ? (
        <div className="flex items-center gap-2 rounded-gm-lg bg-warning-soft px-4 py-2.5 text-warning">
          <AlertTriangle size={16} aria-hidden />
          <Text variant="footnote" className="text-warning">{warning}</Text>
        </div>
      ) : null}

      {/* Phones: the sidebar is hidden, so sections scroll here. */}
      <nav aria-label="Gym sections" className="-mx-4 overflow-x-auto px-4 md:hidden [scrollbar-width:none]">
        <div className="flex w-max gap-2 pb-1">
          {sections.map(sec => (
            <NavLink
              key={sec.id || 'overview'}
              to={sec.id ? `${base}/${sec.id}` : base}
              end={!sec.id}
              className={({ isActive }) =>
                clsx(
                  'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 t-button-sm transition-colors',
                  isActive ? 'border-transparent bg-selection text-on-selection' : 'border-border bg-surface text-ink-muted hover:text-ink',
                )
              }>
              <sec.icon size={15} aria-hidden />
              {sec.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="min-w-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default GymManageDashboard;
