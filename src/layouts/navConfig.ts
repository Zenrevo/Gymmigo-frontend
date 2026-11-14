import {
  Activity,
  Building2,
  CalendarDays,
  CalendarClock,
  Compass,
  Dumbbell,
  Footprints,
  Home,
  Image,
  IndianRupee,
  LayoutDashboard,
  MessagesSquare,
  Package,
  PlusCircle,
  Settings,
  Shield,
  Star,
  BarChart3,
  Tags,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
  Wifi,
} from 'lucide-react';

export type NavItem = {
  key: string;
  label: string;
  /** Path, optionally with a query (e.g. `/app/dashboard?tab=clients`). */
  to: string;
  icon: LucideIcon;
  center?: boolean;
  social?: boolean;
  /** Extra path prefixes that also mark this item active. */
  match?: string[];
  /** Active only on an exact path match (and matching query, if `to` has one). */
  exact?: boolean;
};

export type NavSection = { key: string; label?: string; items: NavItem[] };

export type RoleNav = {
  /** Sidebar sections, top to bottom. The owner's "My gyms" section is injected by the shell. */
  sections: NavSection[];
  /** Mobile bottom tab bar (Migo raised in the centre). */
  tabs: NavItem[];
  /** Items not in the tab bar, offered in the avatar menu on phones. */
  more: NavItem[];
};

const I = {
  home: { key: 'home', label: 'Home', to: '/app/dashboard', icon: Home, exact: true } as NavItem,
  explore: { key: 'explore', label: 'Explore', to: '/app/discovery', icon: Compass, match: ['/app/gyms', '/app/trainers'] } as NavItem,
  migo: { key: 'migo', label: 'Migo', to: '/app/assistant', icon: Zap, center: true, match: ['/app/plans', '/app/programs'] } as NavItem,
  plan: { key: 'plan', label: 'Plan', to: '/app/calendar', icon: CalendarDays, match: ['/app/sessions'] } as NavItem,
  clubs: { key: 'clubs', label: 'Clubs', to: '/app/clubs', icon: Trophy, match: ['/app/wallet-transactions'] } as NavItem,
  profile: { key: 'profile', label: 'Profile', to: '/app/profile', icon: UserRound } as NavItem,
};

const trainerTab = (key: string, label: string, icon: LucideIcon): NavItem => ({
  key,
  label,
  to: `/app/dashboard?tab=${key}`,
  icon,
  exact: true,
});

export function roleNav(role: string | undefined): RoleNav {
  if (role === 'gym_owner' || role === 'gym_manager') {
    const overview: NavItem = { ...I.home, key: 'overview', label: 'Overview', icon: LayoutDashboard };
    const addGym: NavItem = { key: 'add-gym', label: 'Add gym', to: '/app/gym-owner/add-gym', icon: PlusCircle };
    return {
      sections: [
        { key: 'main', items: [overview] },
        { key: 'manage', items: [addGym] },
        { key: 'you', label: 'You', items: [{ ...I.migo, center: false }, I.plan, I.clubs, I.profile] },
      ],
      tabs: [overview, I.clubs, I.migo, I.plan, I.profile],
      more: [addGym],
    };
  }
  if (role === 'trainer') {
    const clients = trainerTab('clients', 'Clients', Users);
    const bookings = trainerTab('bookings', 'Bookings', CalendarClock);
    const schedule = trainerTab('schedule', 'Schedule', CalendarDays);
    const packages = trainerTab('packages', 'Packages & pricing', Package);
    const home: NavItem = { ...I.home, to: '/app/dashboard?tab=overview' };
    return {
      sections: [
        { key: 'main', items: [home] },
        { key: 'coaching', label: 'Coaching', items: [clients, bookings, schedule, packages] },
        { key: 'you', label: 'More', items: [I.explore, { ...I.migo, center: false }, I.profile] },
      ],
      tabs: [home, clients, I.migo, schedule, I.profile],
      more: [bookings, packages, I.explore],
    };
  }
  const more: NavItem[] = [
    { key: 'activity', label: 'Activity', to: '/app/activity', icon: Activity },
    { key: 'run-together', label: 'Run together', to: '/app/run-together', icon: Footprints, match: ['/app/run-room', '/app/run-club', '/app/rank-run'] },
    { key: 'people', label: 'People', to: '/app/people', icon: Users, match: ['/app/u/'] },
    { key: 'social', label: 'Social feed', to: '#social', icon: MessagesSquare, social: true },
    I.profile,
  ];
  return {
    sections: [
      { key: 'main', items: [I.home, I.explore, { ...I.migo, center: false }, I.plan, I.clubs] },
      { key: 'more', label: 'More', items: more },
    ],
    tabs: [I.home, I.explore, I.migo, I.plan, I.clubs],
    more,
  };
}

/** Owner quick links for the selected gym (routes under /app/gym-owner/gyms/:id). */
export function gymNav(gymId: string): NavItem[] {
  const base = `/app/gym-owner/gyms/${gymId}`;
  const l = (key: string, label: string, icon: LucideIcon): NavItem => ({ key, label, to: `${base}/${key}`, icon });
  return [
    { key: 'overview', label: 'Dashboard', to: base, icon: Home, exact: true },
    l('members', 'Members', Users),
    l('plans', 'Plans', Tags),
    l('schedule', 'Schedule', CalendarDays),
    l('finance', 'Finance', IndianRupee),
    l('stats', 'Stats', BarChart3),
    l('clubs', 'Clubs', Trophy),
    l('leads', 'Leads', UserPlus),
    l('team', 'Team', Shield),
    l('reviews', 'Reviews', Star),
    l('gallery', 'Gallery', Image),
    l('equipment', 'Equipment', Dumbbell),
    l('amenities', 'Amenities', Wifi),
    l('settings', 'Settings', Settings),
  ];
}

export const gymIcon = Building2;

export function isActive(item: NavItem, pathname: string, search = ''): boolean {
  if (item.social) return false;
  const [path, query] = item.to.split('?');
  if (query) {
    if (pathname !== path) return false;
    const want = new URLSearchParams(query);
    const have = new URLSearchParams(search);
    // `?tab=overview` is also the default (no tab) state.
    return [...want].every(([k, v]) => (have.get(k) ?? (k === 'tab' ? 'overview' : null)) === v);
  }
  if (pathname === path) return true;
  if (!item.exact && pathname.startsWith(`${path}/`)) return true;
  return (item.match ?? []).some(m => pathname.startsWith(m));
}
