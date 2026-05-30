import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  MessageCircle,
  PlayCircle,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import premiumHero from '../../assets/clubs/premium-club-hero.jpg';
import {
  FAQBlock,
  FeatureCard,
  MetricStrip,
  PublicSiteFrame,
  SectionHeader,
  TrustBand,
  toneStyles,
} from './PublicSiteFrame';
import {
  PLAY_STORE_URL,
  SHOP_URL,
  homeFaqs,
  platformFlow,
  productPillars,
  roleCards,
  trustStats,
} from './publicSiteContent';

export default function LandingPage() {
  return (
    <PublicSiteFrame active="home">
      {(actions) => (
        <>
          <section className="relative min-h-[92svh] overflow-hidden border-b border-white/10">
            <img src={premiumHero} alt="Premium Gymmigo fitness facility" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,15,29,0.96)_0%,rgba(9,15,29,0.82)_42%,rgba(9,15,29,0.36)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,15,29,0.34)_0%,rgba(9,15,29,0.18)_58%,#090f1d_100%)]" />
            <div className="relative mx-auto flex min-h-[92svh] max-w-7xl items-center px-4 pb-20 pt-32 sm:px-6">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl space-y-8">
                <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="text-[11px] font-black uppercase tracking-[0.32em] text-white/70">
                    Gymmigo Fitness Operating System
                  </span>
                </div>
                <div className="space-y-5">
                  <h1 className="max-w-5xl text-5xl font-black leading-[0.88] tracking-tight text-white sm:text-7xl lg:text-8xl">
                    One platform for gyms, trainers, members, rewards, AI, and shop.
                  </h1>
                  <p className="max-w-2xl text-lg font-semibold leading-8 text-white/70 sm:text-xl">
                    Gymmigo connects the full fitness loop: discover, join, check in, train with Migo AI, book trainers, earn rewards, use wallet value, and shop.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link to={actions.getStartedPath} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:brightness-110">
                    Get started <ArrowRight size={18} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => actions.openLead('owner', 'homepage hero demo')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.08] px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:border-primary/40"
                  >
                    Book demo <MessageCircle size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={actions.openShop}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.12] px-6 py-4 text-sm font-black uppercase tracking-widest text-emerald-100 transition hover:bg-emerald-300/[0.18]"
                  >
                    Shop <ShoppingBag size={18} />
                  </button>
                  <Link
                    to={actions.appLink('/app/discovery')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-black/25 px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 transition hover:text-white"
                  >
                    Explore gyms <Sparkles size={18} />
                  </Link>
                </div>
                <MetricStrip stats={trustStats} />
              </motion.div>
            </div>
          </section>

          <TrustBand />

          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                eyebrow="Who it serves"
                title="Three roles. One connected fitness loop."
                copy="The public site now explains every major role Gymmigo supports and points each audience toward the right conversion path."
                align="center"
              />
              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                {roleCards.map((role, index) => {
                  const Icon = role.icon;
                  const tone = toneStyles[role.tone || 'orange'];
                  return (
                    <motion.div
                      key={role.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      viewport={{ once: true }}
                      className={`rounded-xl border bg-white/[0.045] p-6 transition hover:bg-white/[0.07] ${tone.border}`}
                    >
                      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-lg border ${tone.bg} ${tone.border} ${tone.text}`}>
                        <Icon size={26} />
                      </div>
                      <h3 className="text-2xl font-black text-white">{role.title}</h3>
                      <p className="mt-3 min-h-[96px] text-sm font-semibold leading-6 text-white/50">{role.desc}</p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                        <Link to={role.href} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/[0.07] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/75 transition hover:bg-white/[0.11] hover:text-white">
                          {role.cta} <ArrowRight size={15} />
                        </Link>
                        <button type="button" onClick={() => actions.openLead(role.leadRole, `${role.title} card`)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/25 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-primary transition hover:bg-primary/10">
                          WhatsApp
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-white/[0.025] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                eyebrow="Platform flow"
                title="From discovery to retention."
                copy="This is the complete Gymmigo operating loop: member activity creates useful context, rewards create motivation, and owners/trainers get operational clarity."
              />
              <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                {platformFlow.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      viewport={{ once: true }}
                      className="rounded-xl border border-white/10 bg-[#0f172a]/72 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-black text-primary">{item.step}</span>
                        <Icon size={20} className="text-white/40" />
                      </div>
                      <h3 className="mt-5 text-lg font-black leading-tight text-white">{item.title}</h3>
                      <p className="mt-3 text-xs font-semibold leading-5 text-white/50">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <SectionHeader
                  eyebrow="Features"
                  title="All points covered in one public story."
                  copy="The feature grid covers members, gym owners, trainers, shop, AI, wallet, finance, CRM, bookings, and legal trust without adding backend scope."
                />
                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="flex items-start gap-4">
                    <Bot className="shrink-0 text-primary" size={30} />
                    <div>
                      <h3 className="text-xl font-black text-white">Migo AI stays polished.</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/50">
                        The public site explains AI coaching while the app and backend sanitizer keep tool traces out of user-facing messages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {productPillars.map((item) => (
                  <FeatureCard
                    key={item.title}
                    {...item}
                    onClick={item.detailId ? () => actions.openFeature(item.detailId!) : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-[#0b1222] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                eyebrow="Product previews"
                title="A platform that feels connected from every side."
                copy="Instead of separate marketing claims, each preview maps to an actual dashboard or app area."
                align="center"
              />
              <div className="mt-12 grid gap-5 lg:grid-cols-3">
                <PreviewPanel
                  label="Member app"
                  title="AI score, schedule, clubs, and rewards"
                  icon={<Smartphone size={24} />}
                  tone="cyan"
                  items={['Migo AI workout and diet context', 'Daily fitness score and streaks', 'Club Road, FitCard, wallet, shop']}
                  action={<Link to="/members" className="text-cyan-200">See members <ArrowRight size={14} /></Link>}
                />
                <PreviewPanel
                  label="Owner console"
                  title="Members, finance, leads, attendance"
                  icon={<QrCode size={24} />}
                  tone="orange"
                  items={['Member import/export and edits', 'QR check-ins, occupancy, reviews', 'Products, plans, invoices, referrals']}
                  action={<Link to="/gym-owners" className="text-primary">See owners <ArrowRight size={14} /></Link>}
                />
                <PreviewPanel
                  label="Trainer business"
                  title="Profile, packages, clients, sessions"
                  icon={<Dumbbell size={24} />}
                  tone="emerald"
                  items={['Certifications, gallery, pricing', 'Bookings and package progress', 'Online, offline, and home visits']}
                  action={<Link to="/trainers" className="text-emerald-200">See trainers <ArrowRight size={14} /></Link>}
                />
              </div>
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-6">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-300">Shop and wallet</p>
                <h2 className="text-4xl font-black leading-tight text-white sm:text-6xl">
                  Rewards should lead somewhere useful.
                </h2>
                <p className="max-w-xl text-base font-semibold leading-7 text-white/50">
                  Gymmigo connects Club Road, wallet value, reward claims, and supplement partner offers to a dedicated external shop.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={actions.openShop} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
                    Open shop popup <ShoppingBag size={17} />
                  </button>
                  <a href={SHOP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:text-white">
                    Direct shop <ExternalLink size={17} />
                  </a>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {['Wallet balance', 'Lifetime earned value', 'Reward claims', 'Supplement partner offers'].map((item, index) => (
                  <div key={item} className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] p-6">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/[0.12] text-emerald-200">
                      {index === 0 ? <ShoppingBag size={21} /> : index === 1 ? <Sparkles size={21} /> : index === 2 ? <CheckCircle2 size={21} /> : <PlayCircle size={21} />}
                    </div>
                    <h3 className="text-lg font-black text-white">{item}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/50">Visible value that keeps the member reward loop concrete.</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-white/[0.025] py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
              <SectionHeader
                eyebrow="Trust and support"
                title="Built for real deployment."
                copy="Public pages route users to the right protected app path, WhatsApp conversation, email fallback, Play Store, or external shop."
              />
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['Secure access', 'OTP login, role onboarding, protected dashboards, privacy and terms pages.', ShieldCheck],
                  ['PWA and Android', 'Members can use web/PWA and Android app pathways.', Smartphone],
                  ['WhatsApp-first', 'Demo, pricing, role questions, and setup support open direct WhatsApp.', MessageCircle],
                  ['Email fallback', 'Official email fallback is available for formal queries and support.', Sparkles],
                ].map(([title, desc, Icon]) => (
                  <div key={title as string} className="rounded-xl border border-white/10 bg-white/[0.045] p-6">
                    <Icon className="text-primary" size={24} />
                    <h3 className="mt-5 text-xl font-black text-white">{title as string}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{desc as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeader eyebrow="FAQ" title="Everything before the first click." copy="Short answers for members, owners, trainers, shop, and backend scope." />
              <FAQBlock faqs={homeFaqs} />
            </div>
          </section>

          <section className="px-4 pb-20 sm:px-6">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-primary/25 bg-[#0b1222]">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-8 sm:p-12">
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">Start now</p>
                  <h2 className="mt-5 text-4xl font-black leading-tight text-white sm:text-6xl">
                    Bring your fitness ecosystem into one connected platform.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/50">
                    Members get motivation. Owners get control. Trainers get business tools. Gymmigo ties the loop together.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => actions.openLead('general', 'homepage final CTA')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
                      Talk on WhatsApp <MessageCircle size={17} />
                    </button>
                    <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:text-white">
                      Play Store <ExternalLink size={17} />
                    </a>
                  </div>
                </div>
                <div
                  className="min-h-[320px] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(135deg,rgba(241,130,44,0.24),rgba(52,211,153,0.16)),url(${premiumHero})` }}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}

function PreviewPanel({
  label,
  title,
  icon,
  tone,
  items,
  action,
}: {
  label: string;
  title: string;
  icon: ReactNode;
  tone: keyof typeof toneStyles;
  items: string[];
  action: ReactNode;
}) {
  const toneClass = toneStyles[tone];
  return (
    <div className={`rounded-xl border bg-white/[0.045] p-6 ${toneClass.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${toneClass.bg} ${toneClass.border} ${toneClass.text}`}>
          {icon}
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
      <h3 className="mt-6 text-2xl font-black leading-tight text-white">{title}</h3>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm font-semibold leading-6 text-white/50">
            <CheckCircle2 className={toneClass.text} size={16} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest">
        {action}
      </div>
    </div>
  );
}
