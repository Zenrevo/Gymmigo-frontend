import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  FAQBlock,
  FeatureCard,
  MetricStrip,
  PublicSiteFrame,
  SectionHeader,
  TrustBand,
  toneStyles,
} from './PublicSiteFrame';
import { SHOP_URL, type RolePageData } from './publicSiteContent';

const activeMap = {
  members: 'members',
  'gym-owners': 'owners',
  trainers: 'trainers',
} as const;

export default function RoleMarketingPage({ data }: { data: RolePageData }) {
  const audienceName = data.eyebrow.replace(/^For\s+/i, '').toLowerCase();

  return (
    <PublicSiteFrame active={activeMap[data.slug]}>
      {(actions) => (
        <>
          <section className="relative overflow-hidden border-b border-white/10 bg-[#0b1222] pt-32">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(241,130,44,0.18),transparent_34%,rgba(52,211,153,0.10)_70%,transparent)]" />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
                <div className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-primary">
                  {data.eyebrow}
                </div>
                <div className="space-y-5">
                  <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    {data.title}
                  </h1>
                  <p className="max-w-2xl text-xl font-black leading-8 text-primary">{data.accent}</p>
                  <p className="max-w-2xl text-base font-semibold leading-7 text-white/60 sm:text-lg">{data.subtitle}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to={data.slug === 'gym-owners' ? '/login' : actions.getStartedPath} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:brightness-110">
                    {data.primaryCta} <ArrowRight size={17} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => actions.openLead(data.leadRole, `${data.eyebrow} role page`)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 transition hover:border-primary/35 hover:text-white"
                  >
                    {data.secondaryCta} <MessageCircle size={17} />
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-white/10 bg-white/[0.055] p-5">
                <MetricStrip stats={data.stats} />
                <div className="mt-5 rounded-lg border border-white/10 bg-[#090f1d]/70 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/40">Role workflow</p>
                  <div className="mt-5 space-y-4">
                    {data.workflow.map((item) => (
                      <div key={item.step} className="grid grid-cols-[44px_1fr] gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-black text-primary">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="font-black text-white">{item.title}</h3>
                          <p className="mt-1 text-sm font-semibold leading-6 text-white/50">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <TrustBand />

          <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow="Why it matters" title="Built around real app behavior." copy="Every public promise below maps to an existing app surface: discovery, dashboards, bookings, schedules, AI, clubs, wallet, finance, or member operations." />
              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.promises.map((item) => (
                  <FeatureCard
                    key={item.title}
                    {...item}
                    onClick={item.detailId ? () => actions.openFeature(item.detailId!) : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-white/[0.025] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader eyebrow="Capabilities" title={`Everything ${audienceName} need.`} copy="A practical feature set for daily usage, not just landing-page noise." />
              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.capabilities.map((item) => (
                  <FeatureCard key={item.title} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeader eyebrow="Proof" title="Designed for the job to be done." copy="The public site should feel polished, but the product story stays grounded in the actual platform." />
              <div className="grid gap-4 md:grid-cols-2">
                {data.proof.map((item, index) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.045] p-6">
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${index === 0 ? toneStyles.orange.border : toneStyles.emerald.border} ${index === 0 ? toneStyles.orange.bg : toneStyles.emerald.bg}`}>
                      <CheckCircle2 className={index === 0 ? 'text-primary' : 'text-emerald-300'} size={22} />
                    </div>
                    <h3 className="text-xl font-black text-white">{item.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-white/10 bg-[#0b1222] py-20">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-300">Wallet and shop loop</p>
                <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl">Rewards should feel spendable, not abstract.</h2>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/50">
                  Gymmigo links member rewards and wallet context to a dedicated shop experience for supplements, fitness products, and partner offers.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <button type="button" onClick={actions.openShop} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
                  Shop popup <ShoppingBag size={17} />
                </button>
                <a href={SHOP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black uppercase tracking-widest text-white/75 hover:text-white">
                  Open shop
                </a>
              </div>
            </div>
          </section>

          <section className="py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeader eyebrow="FAQ" title="Questions before you start?" copy="The implementation keeps public marketing separate from protected app workflows." />
              <FAQBlock faqs={data.faqs} />
            </div>
          </section>

          <section className="px-4 pb-20 sm:px-6">
            <div className="mx-auto max-w-7xl rounded-xl border border-primary/25 bg-[linear-gradient(135deg,rgba(241,130,44,0.18),rgba(15,23,42,0.82))] p-8 sm:p-12">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">Ready</p>
                  <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">{data.primaryCta} with Gymmigo.</h2>
                  <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/60">
                    Talk to the Gymmigo team on WhatsApp and we will guide the right setup path.
                  </p>
                </div>
                <button type="button" onClick={() => actions.openLead(data.leadRole, `${data.eyebrow} final CTA`)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-5 text-sm font-black uppercase tracking-widest text-black">
                  Talk on WhatsApp <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}
