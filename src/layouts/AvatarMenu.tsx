import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, LogOut, Monitor, Moon, Plus, Sun, UserRound } from 'lucide-react';
import { Avatar, Badge, SegmentedControl, cn } from '../components/kit';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/themeContext';
import type { ThemePreference } from '../theme/theme';
import type { NavItem } from './navConfig';

const ROLE_LABEL: Record<string, string> = { user: 'Member', trainer: 'Trainer', gym_owner: 'Gym owner' };

/** Avatar dropdown: profile, role switch (+ add role), theme, log out; on phones also the extra nav. */
export function AvatarMenu({ extraNav, onSocial }: { extraNav?: NavItem[]; onSocial?: () => void }) {
  const { user, logout, switchRole } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changeRole = async (role: string) => {
    setSwitching(role);
    try {
      await switchRole(role);
      setOpen(false);
      navigate('/app/dashboard');
    } finally {
      setSwitching(null);
    }
  };

  const roles = (user?.roles ?? []) as { role: string; is_completed?: boolean }[];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen(o => !o)}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-sunken aria-expanded:bg-surface-sunken">
        <Avatar name={user?.full_name} src={user?.avatar_url} size={32} />
        <ChevronDown size={14} className={cn('text-ink-subtle transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-[60] mt-2 w-[min(300px,calc(100vw-32px))] origin-top-right animate-pop-in rounded-gm-xl border border-border bg-surface p-2.5 shadow-float">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.full_name} src={user?.avatar_url} size={44} />
            <div className="min-w-0 flex-1">
              <p className="t-subtitle truncate text-ink">{user?.full_name || 'Gymmigo user'}</p>
              <Badge label={ROLE_LABEL[user?.active_role ?? 'user'] ?? user?.active_role} tone="accent" />
            </div>
          </div>
          <div className="my-1.5 h-px bg-border" />
          <MenuLink to="/app/profile" icon={<UserRound size={16} />} label="Profile & settings" onClick={() => setOpen(false)} />
          {extraNav?.length ? (
            <div className="md:hidden">
              {extraNav
                .filter(i => i.key !== 'profile')
                .map(i =>
                  i.social ? (
                    <button key={i.key} type="button" role="menuitem" onClick={() => (setOpen(false), onSocial?.())} className={menuItemClass}>
                      <i.icon size={16} aria-hidden />
                      {i.label}
                    </button>
                  ) : (
                    <MenuLink key={i.key} to={i.to} icon={<i.icon size={16} />} label={i.label} onClick={() => setOpen(false)} />
                  ),
                )}
            </div>
          ) : null}
          <div className="my-1.5 h-px bg-border" />
          <p className="t-label-sm px-2 pb-1 pt-2 text-ink-subtle">Switch role</p>
          {roles.map(r => {
            const active = user?.active_role === r.role;
            const soon = r.role === 'trainer';
            return (
              <button
                key={r.role}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                disabled={active || soon || !!switching}
                onClick={() => changeRole(r.role)}
                className={cn(menuItemClass, active && 'text-accent-text', soon && 'opacity-50')}>
                <span className="flex-1 text-left">{ROLE_LABEL[r.role] ?? r.role}</span>
                {soon ? <Badge label="Soon" /> : null}
                {active ? <Check size={16} aria-hidden /> : null}
                {switching === r.role ? <span className="t-caption text-ink-subtle">…</span> : null}
              </button>
            );
          })}
          <MenuLink to="/onboarding/role?add=1" icon={<Plus size={16} />} label="Add another role" onClick={() => setOpen(false)} />
          <div className="my-1.5 h-px bg-border" />
          <p className="t-label-sm px-2 pb-2 pt-2 text-ink-subtle">Appearance</p>
          <div className="px-2 pb-2">
            <SegmentedControl<ThemePreference>
              size="sm"
              aria-label="Theme"
              value={preference}
              onChange={setPreference}
              options={[
                { value: 'system', label: 'System', icon: Monitor },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ]}
            />
          </div>
          <div className="my-1.5 h-px bg-border" />
          <button type="button" role="menuitem" onClick={logout} className={cn(menuItemClass, 'text-danger')}>
            <LogOut size={16} aria-hidden /> Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

const menuItemClass = 't-callout flex w-full items-center gap-3 rounded-gm-md px-3 py-2.5 text-ink transition-colors hover:bg-surface-sunken focus-visible:bg-surface-sunken disabled:cursor-default disabled:hover:bg-transparent';

function MenuLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link to={to} role="menuitem" onClick={onClick} className={menuItemClass}>
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}
