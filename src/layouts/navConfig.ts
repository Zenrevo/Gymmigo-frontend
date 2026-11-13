import {
  Activity,
  Building2,
  CalendarDays,
  Compass,
  Home,
  MessagesSquare,
  Settings,
  Shield,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Zap,
  Footprints,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { key: string; label: string; to: string; icon: LucideIcon; center?: boolean; social?: boolean; match?: string[] };

/** Bottom tab bar / primary sidebar items, mirroring the app's MainTabs per role. */
export function primaryNav(role: string | undefined): NavItem[] {
  if (role === 'trainer') {
    return [
      { key: 'home', label: 'Home', to: '/app/dashboard', icon: Home },
      { key: 'explore', label: 'Explore', to: '/app/discovery', icon: Compass, match: ['/app/gyms', '/app/trainers'] },
      { key: 'migo', label: 'Migo', to: '/app/assistant', icon: Zap, center: true },
      { key: 'profile', label: 'Profile', to: '/app/profile', icon: UserRound },
    ];
  }
  return [
    { key: 'home', label: 'Home', to: '/app/dashboard', icon: Home },
    { key: 'explore', label: 'Explore', to: '/app/discovery', icon: Compass, match: ['/app/gyms', '/app/trainers'] },
    { key: 'migo', label: 'Migo', to: '/app/assistant', icon: Zap, center: true, match: ['/app/plans'] },
    { key: 'plan', label: 'Plan', to: '/app/calendar', icon: CalendarDays, match: ['/app/sessions'] },
    { key: 'clubs', label: 'Clubs', to: '/app/clubs', icon: Trophy, match: ['/app/wallet-transactions'] },
  ];
}

/** Extra desktop sidebar items (also in the avatar menu on phones). */
export function secondaryNav(role: string | undefined): NavItem[] {
  if (role === 'user') {
    return [
      { key: 'activity', label: 'Activity', to: '/app/activity', icon: Activity },
      { key: 'run-together', label: 'Run together', to: '/app/run-together', icon: Footprints, match: ['/app/run-room', '/app/run-club'] },
      { key: 'people', label: 'People', to: '/app/people', icon: Users, match: ['/app/u/'] },
      { key: 'social', label: 'Social feed', to: '#social', icon: MessagesSquare, social: true },
      { key: 'profile', label: 'Profile', to: '/app/profile', icon: UserRound },
    ];
  }
  if (role === 'gym_owner') {
    return [
      { key: 'gyms', label: 'My gyms', to: '/app/dashboard', icon: Building2 },
      { key: 'profile', label: 'Profile', to: '/app/profile', icon: UserRound },
    ];
  }
  return [];
}

/** Owner sub-navigation while managing a gym. */
export function gymNav(gymId: string): NavItem[] {
  const base = `/app/gym-owner/gyms/${gymId}`;
  return [
    { key: 'overview', label: 'Overview', to: base, icon: Home },
    { key: 'members', label: 'Members', to: `${base}/members`, icon: Users },
    { key: 'leads', label: 'Leads', to: `${base}/leads`, icon: UserPlus },
    { key: 'team', label: 'Team', to: `${base}/team`, icon: Shield },
    { key: 'settings', label: 'Settings', to: `${base}/settings`, icon: Settings },
  ];
}

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.social) return false;
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
  return (item.match ?? []).some(m => pathname.startsWith(m));
}
