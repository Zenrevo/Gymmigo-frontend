import { lazy, Suspense, useState, type ReactNode } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import {
  BadgeCheck, Banknote, Bot, CalendarCheck, ClipboardList, Dumbbell, Flag, LayoutDashboard, LogOut, Menu, MessageSquareWarning,
  Repeat, ScrollText, ShieldCheck, Ticket, UserCog, Users, X, type LucideIcon,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import PageLoader from '../components/PageLoader';
import { cn, Text } from '../components/kit';
import { AdminAuthProvider } from './AdminAuth';
import { useAdmin } from './useAdmin';
import AdminLogin from './AdminLogin';
import { NoAccess } from './ui';

const Overview = lazy(() => import('./pages/Overview'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const Verifications = lazy(() => import('./pages/Verifications'));
const Gyms = lazy(() => import('./pages/Gyms'));
const Trainers = lazy(() => import('./pages/Trainers'));
const Memberships = lazy(() => import('./pages/Memberships'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Payments = lazy(() => import('./pages/Payments'));
const Reviews = lazy(() => import('./pages/Reviews'));
const ClubTransfers = lazy(() => import('./pages/ClubTransfers'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AiAgents = lazy(() => import('./pages/AiAgents'));
const Admins = lazy(() => import('./pages/Admins'));
const Account = lazy(() => import('./pages/Account'));

type NavItem = { to: string; label: string; icon: LucideIcon; perm: string; element: ReactNode; group: string };

const NAV: NavItem[] = [
  { to: '', label: 'Overview', icon: LayoutDashboard, perm: 'dashboard.view', element: <Overview />, group: 'Platform' },
  { to: 'users', label: 'Users', icon: Users, perm: 'users.view', element: <UsersPage />, group: 'People' },
  { to: 'verifications', label: 'Verifications', icon: BadgeCheck, perm: 'verification.manage', element: <Verifications />, group: 'People' },
  { to: 'trainers', label: 'Trainers', icon: Dumbbell, perm: 'trainers.view', element: <Trainers />, group: 'People' },
  { to: 'gyms', label: 'Gyms', icon: ClipboardList, perm: 'gyms.view', element: <Gyms />, group: 'Business' },
  { to: 'memberships', label: 'Memberships', icon: Ticket, perm: 'memberships.view', element: <Memberships />, group: 'Business' },
  { to: 'bookings', label: 'Trainer bookings', icon: CalendarCheck, perm: 'bookings.view', element: <Bookings />, group: 'Business' },
  { to: 'payments', label: 'Cash payments', icon: Banknote, perm: 'payments.view', element: <Payments />, group: 'Business' },
  { to: 'reviews', label: 'Reviews', icon: MessageSquareWarning, perm: 'reviews.moderate', element: <Reviews />, group: 'Trust & safety' },
  { to: 'club-transfers', label: 'Club transfers', icon: Repeat, perm: 'clubs.manage', element: <ClubTransfers />, group: 'Trust & safety' },
  { to: 'ai', label: 'AI agents', icon: Bot, perm: 'ai.view', element: <AiAgents />, group: 'Control' },
  { to: 'settings', label: 'Features & settings', icon: Flag, perm: 'settings.view', element: <SettingsPage />, group: 'Control' },
  { to: 'audit', label: 'Audit log', icon: ScrollText, perm: 'audit.view', element: <AuditLog />, group: 'Control' },
  { to: 'admins', label: 'Admins & access', icon: ShieldCheck, perm: 'admins.manage', element: <Admins />, group: 'Control' },
];

/** Everything under /admin: its own sign-in, session and layout (separate from the member app). */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<Guard />}>
          <Route element={<Shell />}>
            {NAV.map(n => (
              <Route key={n.to} index={n.to === ''} path={n.to || undefined} element={<Gate perm={n.perm}>{n.element}</Gate>} />
            ))}
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}

function Guard() {
  const { admin, loading } = useAdmin();
  if (loading) return <PageLoader fullScreen message="Opening admin…" />;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

function Gate({ perm, children }: { perm: string; children: ReactNode }) {
  const { can } = useAdmin();
  return can(perm) ? <>{children}</> : <NoAccess />;
}

function Shell() {
  const { admin, can, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const items = NAV.filter(n => can(n.perm));
  const groups = [...new Set(items.map(n => n.group))];
  const current = NAV.find(n => (n.to ? pathname.startsWith(`/admin/${n.to}`) : pathname === '/admin' || pathname === '/admin/'));

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {groups.map(g => (
        <div key={g}>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{g}</p>
          {items.filter(n => n.group === g).map(n => (
            <NavLink
              key={n.to}
              to={n.to ? `/admin/${n.to}` : '/admin'}
              end={n.to === ''}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-gm-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-accent-soft text-accent-text' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              <n.icon size={18} aria-hidden />
              {n.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-border pt-4">
      <NavLink to="/admin/account" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-gm-md px-3 py-2 hover:bg-surface-sunken">
        <UserCog size={18} className="text-ink-muted" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{admin?.full_name || admin?.username}</span>
          <span className="block truncate text-xs text-ink-subtle">{admin?.role_label}</span>
        </span>
      </NavLink>
      <button onClick={() => void logout()} className="mt-1 flex w-full items-center gap-3 rounded-gm-md px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-danger">
        <LogOut size={18} aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background text-ink">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-4 lg:flex">
        <Brand />
        {nav}
        {footer}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-surface p-4 shadow-float">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-gm-md p-2 hover:bg-surface-sunken"><X size={20} /></button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-gm-md p-2 hover:bg-surface-sunken"><Menu size={20} /></button>
          <Text variant="subtitle" truncate>{current?.label ?? 'Account'}</Text>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <Suspense fallback={<PageLoader message="" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <BrandLogo size={36} />
      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Admin</span>
    </div>
  );
}
