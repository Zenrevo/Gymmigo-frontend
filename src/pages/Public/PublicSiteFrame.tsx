import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, ExternalLink, Mail, Menu, MessageCircle, X } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { cn } from '../../components/kit/cn';
import { Container, ThemePicker, ThemeSwitch } from '../../components/marketing/Site';
import { EASE } from '../../components/marketing/motionUtils';
import { useAuth } from '../../context/AuthContext';
import { CONTACT_EMAIL, SHOP_URL, WHATSAPP_PHONE, type LeadRole } from './publicSiteContent';
import { buildEmailUrl, buildWhatsappUrl } from './publicLinks';

type LeadIntent = { role: LeadRole; source?: string };

export type PublicActions = {
  getStartedPath: string;
  appLink: (path: string) => string;
  openLead: (role?: LeadRole, source?: string) => void;
  openShop: () => void;
};

type FrameProps = {
  active?: 'home' | 'members' | 'owners' | 'trainers' | 'pricing' | 'contact' | 'legal';
  children: (actions: PublicActions) => ReactNode;
};

const NAV: Array<[string, string]> = [
  ['Members', '/members'],
  ['Gym owners', '/gym-owners'],
  ['Trainers', '/trainers'],
  ['Pricing', '/pricing'],
];

const roleLabels: Record<LeadRole, string> = {
  member: 'Member',
  owner: 'Gym owner',
  trainer: 'Trainer',
  pricing: 'Pricing',
  general: 'Something else',
};


export function PublicSiteFrame({ children }: FrameProps) {
  const { token } = useAuth();
  const location = useLocation();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === location.pathname;
  const setMenuOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setMenuPath(typeof next === 'function' ? (next(menuOpen) ? location.pathname : null) : next ? location.pathname : null);
  const [scrolled, setScrolled] = useState(false);
  const [leadIntent, setLeadIntent] = useState<LeadIntent | null>(null);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const actions = useMemo<PublicActions>(
    () => ({
      getStartedPath: token ? '/app/dashboard' : '/login',
      appLink: (path: string) => (token ? path : '/login'),
      openLead: (role = 'general', source = '') => setLeadIntent({ role, source }),
      openShop: () => setShopOpen(true),
    }),
    [token],
  );

  return (
    <div className="min-h-dvh overflow-x-clip bg-background font-sans text-ink antialiased selection:bg-cta selection:text-white">
      <a href="#main" className="sr-only z-[200] rounded-lg bg-ink px-4 py-2 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header className={cn('sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300', scrolled ? 'border-b border-border bg-background/85 backdrop-blur-md' : 'border-b border-transparent')}>
        <Container className="flex h-[68px] items-center justify-between gap-6">
          <Link to="/" aria-label="Gymmigo home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <BrandLogo size={34} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn('rounded-full px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent', isActive ? 'text-ink' : 'text-ink-subtle hover:text-ink')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeSwitch />
            <Link to={actions.getStartedPath} className="hidden rounded-full px-4 py-2 text-[15px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent sm:inline-flex">
              {token ? 'Open app' : 'Sign in'}
            </Link>
            <a
              href="#get-the-app"
              onClick={e => {
                const el = document.getElementById('get-the-app');
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hidden h-10 items-center rounded-full bg-cta px-5 text-[15px] font-semibold text-white transition-colors hover:bg-cta-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex"
            >
              Get the app
            </a>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-sunken lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </Container>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              aria-label="Mobile"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden border-t border-border bg-background lg:hidden"
            >
              <Container className="flex flex-col py-3">
                {NAV.map(([label, to]) => (
                  <Link key={to} to={to} className="border-b border-border py-3.5 text-[17px] font-medium text-ink last:border-0">
                    {label}
                  </Link>
                ))}
                <Link to="/contact" className="py-3.5 text-[17px] font-medium text-ink">
                  Contact
                </Link>
                <div className="mt-2 flex gap-3 pb-3">
                  <Link to={actions.getStartedPath} className="flex h-11 flex-1 items-center justify-center rounded-full border border-border-strong text-[15px] font-semibold text-ink">
                    {token ? 'Open app' : 'Sign in'}
                  </Link>
                  <a href="#get-the-app" onClick={() => setMenuOpen(false)} className="flex h-11 flex-1 items-center justify-center rounded-full bg-cta text-[15px] font-semibold text-white">
                    Get the app
                  </a>
                </div>
              </Container>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="main">{children(actions)}</main>

      <footer className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs space-y-5">
            <BrandLogo size={34} />
            <p className="text-[15px] leading-7 text-ink-subtle">Gyms, runs and an AI coach in one app. Made in India by Zenrevo.</p>
            <ThemePicker />
          </div>
          <FooterColumn
            title="Product"
            links={[
              ['For members', '/members'],
              ['For gym owners', '/gym-owners'],
              ['For trainers', '/trainers'],
              ['Pricing', '/pricing'],
            ]}
          />
          <FooterColumn
            title="Use Gymmigo"
            links={[
              ['Open the web app', actions.getStartedPath],
              ['Google Play', 'https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo'],
              ['Shop', SHOP_URL],
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              ['Contact', '/contact'],
              ['Privacy policy', '/privacy'],
              ['Terms of service', '/terms'],
            ]}
          />
        </Container>
        <Container className="flex flex-col gap-2 border-t border-border py-6 text-[13px] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Zenrevo. Gymmigo is a Zenrevo product.</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">
              {CONTACT_EMAIL}
            </a>
            <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noreferrer" className="hover:text-ink">
              WhatsApp +91 72082 21615
            </a>
          </span>
        </Container>
      </footer>

      <LeadModal key={leadIntent ? `${leadIntent.role}:${leadIntent.source}` : 'closed'} intent={leadIntent} onClose={() => setLeadIntent(null)} />
      <ShopModal open={shopOpen} onClose={() => setShopOpen(false)} />
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith('http') ? (
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[15px] text-ink-subtle transition-colors hover:text-ink">
                {label} <ArrowUpRight size={13} />
              </a>
            ) : (
              <Link to={href} className="text-[15px] text-ink-subtle transition-colors hover:text-ink">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input, button, a')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-overlay" onClick={onClose} />
      <motion.div
        ref={panel}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative w-full max-w-lg rounded-t-3xl border border-border bg-surface p-6 shadow-float sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-subtle hover:bg-surface-sunken hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-border bg-surface-raised px-4 text-[15px] text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20';

function LeadModal({ intent, onClose }: { intent: LeadIntent | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<LeadRole>(intent?.role ?? 'general');

  if (!intent) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = [
      `Hi Gymmigo team, I'm interested as a ${roleLabels[role].toLowerCase()}.`,
      name ? `Name: ${name}` : '',
      phone ? `Phone: ${phone}` : '',
      city ? `City or gym: ${city}` : '',
      intent.source ? `From: ${intent.source}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.open(buildWhatsappUrl(message), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const emailBody = `Hi Gymmigo team,\n\nI'm interested as a ${roleLabels[role].toLowerCase()}.\n\nName:\nPhone:\nCity or gym:\n`;

  return (
    <Dialog title="Talk to the Gymmigo team" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-[15px] leading-6 text-ink-muted">We'll open WhatsApp with these details filled in. Nothing is stored on this page.</p>
        <fieldset>
          <legend className="text-[13px] font-semibold text-ink">I'm a</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['member', 'owner', 'trainer', 'general'] as LeadRole[]).map(item => (
              <button
                key={item}
                type="button"
                aria-pressed={role === item}
                onClick={() => setRole(item)}
                className={cn(
                  'rounded-full border px-4 py-2 text-[14px] font-medium transition-colors',
                  role === item ? 'border-ink bg-ink text-background' : 'border-border-strong text-ink-muted hover:text-ink',
                )}
              >
                {roleLabels[item]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <input aria-label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputClass} />
          <input aria-label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" inputMode="tel" className={inputClass} />
          <input aria-label="City or gym name" value={city} onChange={e => setCity(e.target.value)} placeholder="City or gym name" className={cn(inputClass, 'sm:col-span-2')} />
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-cta px-5 text-[15px] font-semibold text-white transition-colors hover:bg-cta-pressed">
            <MessageCircle size={17} /> Continue on WhatsApp
          </button>
          <a href={buildEmailUrl('Gymmigo enquiry', emailBody)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-sunken">
            <Mail size={17} /> Email us
          </a>
        </div>
      </form>
    </Dialog>
  );
}

function ShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Dialog title="Gymmigo Shop" onClose={onClose}>
      <p className="text-[15px] leading-7 text-ink-muted">
        Supplements and gear are sold on our separate store at shop.gymmigo.in. Rewards you earn in the app show up in your wallet there.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href={SHOP_URL} target="_blank" rel="noreferrer" onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-background">
          Open the shop <ExternalLink size={16} />
        </a>
        <button type="button" onClick={onClose} className="h-12 rounded-full border border-border-strong px-5 text-[15px] font-semibold text-ink">
          Not now
        </button>
      </div>
    </Dialog>
  );
}

