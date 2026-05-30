import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Mail,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import {
  CONTACT_EMAIL,
  SHOP_URL,
  WHATSAPP_PHONE,
  type FeatureDetailId,
  type LeadRole,
  featureDetails,
  homeFaqs,
} from './publicSiteContent';

type LeadIntent = {
  role: LeadRole;
  source?: string;
};

export type PublicActions = {
  getStartedPath: string;
  appLink: (path: string) => string;
  openLead: (role?: LeadRole, source?: string) => void;
  openShop: () => void;
  openFeature: (featureId: FeatureDetailId) => void;
};

type FrameProps = {
  active?: 'home' | 'members' | 'owners' | 'trainers' | 'pricing' | 'contact';
  children: (actions: PublicActions) => ReactNode;
};

const roleLabels: Record<LeadRole, string> = {
  member: 'Member',
  owner: 'Gym Owner',
  trainer: 'Trainer',
  pricing: 'Pricing',
  general: 'General',
};

export const toneStyles = {
  orange: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    solid: 'bg-primary text-black',
    hover: 'hover:border-primary/40',
  },
  emerald: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-300/25',
    solid: 'bg-emerald-300 text-black',
    hover: 'hover:border-emerald-300/40',
  },
  cyan: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-300/25',
    solid: 'bg-cyan-300 text-black',
    hover: 'hover:border-cyan-300/40',
  },
  blue: {
    text: 'text-blue-300',
    bg: 'bg-blue-400/10',
    border: 'border-blue-300/25',
    solid: 'bg-blue-300 text-black',
    hover: 'hover:border-blue-300/40',
  },
  amber: {
    text: 'text-amber-300',
    bg: 'bg-amber-300/10',
    border: 'border-amber-300/25',
    solid: 'bg-amber-300 text-black',
    hover: 'hover:border-amber-300/40',
  },
};

const navItems = [
  { label: 'Members', path: '/members', active: 'members' },
  { label: 'Gym Owners', path: '/gym-owners', active: 'owners' },
  { label: 'Trainers', path: '/trainers', active: 'trainers' },
  { label: 'Pricing', path: '/pricing', active: 'pricing' },
] as const;

const buildWhatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

const buildEmailUrl = (subject: string, body = '') =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export function PublicSiteFrame({ active = 'home', children }: FrameProps) {
  const { token } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [leadIntent, setLeadIntent] = useState<LeadIntent | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [featureId, setFeatureId] = useState<FeatureDetailId | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const actions = useMemo<PublicActions>(
    () => ({
      getStartedPath: token ? '/app/dashboard' : '/login',
      appLink: (path: string) => (token ? path : '/login'),
      openLead: (role = 'general', source = '') => setLeadIntent({ role, source }),
      openShop: () => setShopOpen(true),
      openFeature: (id: FeatureDetailId) => setFeatureId(id),
    }),
    [token]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090f1d] text-white selection:bg-primary/30">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,#090f1d_0%,#0f172a_38%,#111827_70%,#090f1d_100%)]" />
      <header
        className={clsx(
          'fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300',
          scrolled ? 'border-white/10 bg-[#090f1d]/88 py-3 backdrop-blur-xl' : 'border-transparent bg-transparent py-5'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="shrink-0">
            <BrandLogo size={42} showText />
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest transition',
                  active === item.active ? 'bg-primary text-black' : 'text-white/50 hover:bg-white/[0.07] hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={actions.openShop}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-300/10"
            >
              <ShoppingBag size={14} /> Shop
            </button>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white">
              Login
            </Link>
            <button
              type="button"
              onClick={() => actions.openLead('owner', 'top navigation demo')}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-widest text-black transition hover:brightness-110"
            >
              Book demo <MessageCircle size={15} />
            </button>
            <Link
              to={actions.getStartedPath}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:border-white/25 hover:bg-white/[0.12]"
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/70 lg:hidden"
            aria-label="Toggle public navigation"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-3 top-20 z-50 rounded-xl border border-white/10 bg-[#0b1222]/96 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-lg px-4 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:bg-white/[0.07]"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={actions.openShop}
                className="flex items-center justify-between rounded-lg px-4 py-4 text-sm font-black uppercase tracking-widest text-emerald-200 hover:bg-emerald-300/10"
              >
                Shop <ShoppingBag size={18} />
              </button>
              <button
                type="button"
                onClick={() => actions.openLead('owner', 'mobile navigation demo')}
                className="mt-2 rounded-lg bg-primary px-4 py-4 text-sm font-black uppercase tracking-widest text-black"
              >
                Book demo on WhatsApp
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{children(actions)}</main>

      <footer className="border-t border-white/10 bg-[#070c17]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
            <div className="space-y-5">
              <BrandLogo size={50} showText />
              <p className="max-w-sm text-sm font-semibold leading-6 text-white/50">
                Gymmigo is a fitness operating system by Zenrevo for members, gym owners, and trainers.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => actions.openLead('general', 'footer')}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-widest text-black"
                >
                  WhatsApp <MessageCircle size={15} />
                </button>
                <a
                  href={buildEmailUrl('Gymmigo inquiry')}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white"
                >
                  Email <Mail size={15} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <FooterColumn title="Platform" links={[
                ['Members', '/members'],
                ['Gym owners', '/gym-owners'],
                ['Trainers', '/trainers'],
                ['Pricing', '/pricing'],
              ]} />
              <FooterColumn title="App" links={[
                ['Login', '/login'],
                ['Explore gyms', actions.appLink('/app/discovery')],
                ['Migo AI', actions.appLink('/app/assistant')],
                ['Clubs', actions.appLink('/app/clubs')],
              ]} />
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.28em] text-white">Shop</h4>
                <button
                  type="button"
                  onClick={actions.openShop}
                  className="block text-left text-sm font-bold text-white/40 transition hover:text-emerald-200"
                >
                  Gymmigo Shop
                </button>
                <a href={SHOP_URL} target="_blank" rel="noreferrer" className="block text-sm font-bold text-white/40 transition hover:text-emerald-200">
                  Open shop directly
                </a>
              </div>
              <FooterColumn title="Legal" links={[
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
                ['Contact', '/contact'],
              ]} />
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[10px] font-black uppercase tracking-[0.28em] text-white/22 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Gymmigo.in by Zenrevo</span>
            <span>WhatsApp +91 72082 21615</span>
          </div>
        </div>
      </footer>

      <LeadModal intent={leadIntent} onClose={() => setLeadIntent(null)} />
      <ShopBridgeModal open={shopOpen} onClose={() => setShopOpen(false)} />
      <FeatureDetailModal featureId={featureId} onClose={() => setFeatureId(null)} />
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[11px] font-black uppercase tracking-[0.28em] text-white">{title}</h4>
      <ul className="space-y-3">
        {links.map(([label, href]) => (
          <li key={`${title}-${label}`}>
            <Link to={href} className="text-sm font-bold text-white/40 transition hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeadModal({ intent, onClose }: { intent: LeadIntent | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<LeadRole>('general');

  useEffect(() => {
    if (intent?.role) setRole(intent.role);
  }, [intent?.role]);

  if (!intent) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = [
      `Hi Gymmigo team, I am interested in ${roleLabels[role]}.`,
      name ? `Name: ${name}` : '',
      phone ? `Phone: ${phone}` : '',
      city ? `City/Gym: ${city}` : '',
      intent.source ? `Source: ${intent.source}` : '',
      'Please guide me with the next step.',
    ].filter(Boolean).join('\n');
    window.open(buildWhatsappUrl(message), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const emailBody = `Hi Gymmigo team,\n\nI am interested in ${roleLabels[role]}.\n\nName:\nPhone:\nCity/Gym:\n\nPlease guide me with the next step.`;

  return (
    <ModalShell onClose={onClose} title="Talk to Gymmigo">
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm font-semibold leading-6 text-white/60">
          Share the basics and we will open WhatsApp with a ready message. No backend form storage in this flow.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['member', 'owner', 'trainer', 'pricing'] as LeadRole[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={clsx(
                'rounded-lg border px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition',
                role === item ? 'border-primary bg-primary text-black' : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
              )}
            >
              {roleLabels[item]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/60" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/60" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or gym name" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/60 sm:col-span-2" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110">
            Open WhatsApp <MessageCircle size={16} />
          </button>
          <a href={buildEmailUrl('Gymmigo inquiry', emailBody)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-white/70 transition hover:text-white">
            Email instead <Mail size={16} />
          </a>
        </div>
      </form>
    </ModalShell>
  );
}

function ShopBridgeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <ModalShell onClose={onClose} title="Gymmigo Shop">
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
          <ShoppingBag className="mb-4 text-emerald-200" size={32} />
          <p className="text-sm font-semibold leading-6 text-white/60">
            The shop runs on a dedicated Gymmigo storefront. Members can connect shop purchases with wallet value, rewards, and supplement partner benefits inside the app.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {['Supplements', 'Fitness gear', 'Reward-led offers'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs font-black uppercase tracking-widest text-white/60">
              {item}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={SHOP_URL} target="_blank" rel="noreferrer" onClick={onClose} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110">
            Open shop <ExternalLink size={16} />
          </a>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white">
            Stay here
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function FeatureDetailModal({ featureId, onClose }: { featureId: FeatureDetailId | null; onClose: () => void }) {
  if (!featureId) return null;
  const detail = featureDetails[featureId];
  const Icon = detail.icon;

  return (
    <ModalShell onClose={onClose} title={detail.title}>
      <div className="space-y-5">
        <div className="flex items-start gap-4 rounded-lg border border-primary/20 bg-primary/10 p-5">
          <Icon className="mt-1 shrink-0 text-primary" size={28} />
          <p className="text-sm font-semibold leading-6 text-white/60">{detail.desc}</p>
        </div>
        <div className="space-y-3">
          {detail.bullets.map((bullet) => (
            <div key={bullet} className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold leading-6 text-white/60">
              <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={17} />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Close modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/72 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0d1424] shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1424]/95 px-5 py-4 backdrop-blur">
            <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 sm:p-6">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  copy,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={clsx('space-y-4', align === 'center' && 'mx-auto max-w-3xl text-center')}>
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">{eyebrow}</p>
      <h2 className="text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h2>
      {copy && <p className="max-w-2xl text-base font-semibold leading-7 text-white/50 sm:text-lg">{copy}</p>}
    </div>
  );
}

export function FeatureCard({
  title,
  desc,
  icon: Icon,
  tone = 'orange',
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: keyof typeof toneStyles;
  onClick?: () => void;
}) {
  const toneClass = toneStyles[tone];
  const interactive = Boolean(onClick);
  const inner = (
    <>
      <div className={clsx('mb-5 flex h-12 w-12 items-center justify-center rounded-lg border', toneClass.bg, toneClass.border, toneClass.text)}>
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{desc}</p>
      {interactive && <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary">Details <ArrowRight size={14} /></span>}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx('h-full rounded-xl border border-white/10 bg-white/[0.045] p-6 text-left transition hover:bg-white/[0.07]', toneClass.hover)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={clsx('h-full rounded-xl border border-white/10 bg-white/[0.045] p-6 transition hover:bg-white/[0.07]', toneClass.hover)}>
      {inner}
    </div>
  );
}

export function MetricStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={`${stat.value}-${stat.label}`} className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-3xl font-black tracking-tight text-white">{stat.value}</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function FAQBlock({ faqs = homeFaqs }: { faqs?: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div key={faq.question} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
          <button
            type="button"
            onClick={() => setOpen(open === index ? -1 : index)}
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
          >
            <span className="text-base font-black text-white">{faq.question}</span>
            {open === index ? <Minus className="shrink-0 text-primary" size={18} /> : <Plus className="shrink-0 text-primary" size={18} />}
          </button>
          <AnimatePresence initial={false}>
            {open === index && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <p className="border-t border-white/10 px-5 py-5 text-sm font-semibold leading-6 text-white/50">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function TrustBand() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
        {[
          ['Role-aware platform', 'Members, owners, and trainers have separate journeys but shared data loops.'],
          ['WhatsApp-first sales', 'Public demo and pricing CTAs open a direct Gymmigo conversation.'],
          ['Secure app access', 'Core app routes remain protected behind OTP login and role onboarding.'],
        ].map(([title, desc], index) => (
          <div key={title} className="flex gap-4 rounded-xl border border-white/10 bg-[#0f172a]/70 p-5">
            {index === 0 ? <Sparkles className="shrink-0 text-primary" size={24} /> : index === 1 ? <MessageCircle className="shrink-0 text-emerald-300" size={24} /> : <ShieldCheck className="shrink-0 text-cyan-300" size={24} />}
            <div>
              <h3 className="font-black text-white">{title}</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-white/50">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export { buildEmailUrl, buildWhatsappUrl };
