import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PhoneFrame } from '../../components/marketing/Frames';
import { Reveal } from '../../components/marketing/Motion';
import { useParallax } from '../../components/marketing/motionUtils';
import { RouteLine } from '../../components/marketing/RouteLine';
import { Shot } from '../../components/marketing/Shot';
import { Container, Eyebrow, Faq, Heading, PLAY_URL, StoreButtons } from '../../components/marketing/Site';
import { usePageMeta } from '../../components/marketing/usePageMeta';
import { cn } from '../../components/kit/cn';
import { motion } from 'framer-motion';
import { PublicSiteFrame, type PublicActions } from './PublicSiteFrame';
import type { RolePage } from './publicSiteContent';

const ACTIVE = { members: 'members', 'gym-owners': 'owners', trainers: 'trainers' } as const;
const META: Record<RolePage['slug'], { title: string; description: string }> = {
  members: {
    title: 'Gymmigo for members: gyms, runs and training plans',
    description: 'Find gyms near you, check in with QR, follow plans you approve and run with friends. Free for members.',
  },
  'gym-owners': {
    title: 'Gymmigo for gym owners: memberships, check-ins and clubs',
    description: 'Run memberships, QR check-ins, invoices, staff and a loyalty ladder for one gym or several, from your phone.',
  },
  trainers: {
    title: 'Gymmigo for trainers: packages, bookings and sessions',
    description: 'Publish packages, take bookings and keep every session in one calendar. Early access for trainers.',
  },
};

export default function RoleMarketingPage({ page }: { page: RolePage }) {
  usePageMeta(META[page.slug]);
  return <PublicSiteFrame active={ACTIVE[page.slug]}>{actions => <RoleBody page={page} actions={actions} />}</PublicSiteFrame>;
}

function Cta({ kind, label, page, actions, primary }: { kind: 'app' | 'lead' | 'pricing' | 'store'; label: string; page: RolePage; actions: PublicActions; primary?: boolean }) {
  const cls = cn(
    'inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    primary ? 'bg-accent text-white hover:bg-accent-pressed' : 'border border-border-strong text-ink hover:bg-surface-sunken',
  );
  if (kind === 'lead') return <button type="button" className={cls} onClick={() => actions.openLead(page.leadRole, `${page.slug} page`)}>{label}</button>;
  if (kind === 'store') return <a className={cls} href={PLAY_URL} target="_blank" rel="noreferrer">{label}</a>;
  const to = kind === 'pricing' ? '/pricing' : actions.getStartedPath;
  return <Link className={cls} to={to}>{label}{primary ? <ArrowRight size={16} /> : null}</Link>;
}

function RoleBody({ page, actions }: { page: RolePage; actions: PublicActions }) {
  const { ref, y } = useParallax(40);
  return (
    <>
      <section ref={ref} className="relative overflow-hidden pb-20 pt-12 sm:pt-16 lg:pb-24">
        <div aria-hidden className="pointer-events-none absolute right-[-15%] top-[-15%] h-[600px] w-[600px] rounded-full bg-accent-soft opacity-60 blur-3xl [[data-theme=dark]_&]:opacity-30" />
        <Container className="relative grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <Reveal><Eyebrow>{page.eyebrow}</Eyebrow></Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[56px]">{page.title}</h1>
            </Reveal>
            <Reveal delay={0.1}><p className="mt-6 text-[18px] leading-8 text-ink-muted">{page.lead}</p></Reveal>
            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              <Cta kind={page.primary.to} label={page.primary.label} page={page} actions={actions} primary />
              {page.secondary ? <Cta kind={page.secondary.to} label={page.secondary.label} page={page} actions={actions} /> : null}
            </Reveal>
            {page.note ? <Reveal delay={0.2}><p className="mt-5 text-[14px] text-ink-subtle">{page.note}</p></Reveal> : null}
          </div>
          <div className="relative mx-auto flex h-[520px] w-full max-w-[460px] items-start justify-center gap-5 sm:h-[580px]">
            <RouteLine className="absolute -left-12 top-10 h-[380px] w-[380px] text-ink" />
            <motion.div style={{ y }} className="relative mt-16 w-[46%] max-w-[220px]">
              <Reveal delay={0.25} y={30}>
                <PhoneFrame className="-rotate-[3deg]"><Shot name={page.hero[1]} priority alt={page.heroAlt[1]} /></PhoneFrame>
              </Reveal>
            </motion.div>
            <div className="relative w-[50%] max-w-[240px]">
              <Reveal delay={0.15} y={30}>
                <PhoneFrame className="rotate-[2deg]"><Shot name={page.hero[0]} priority alt={page.heroAlt[0]} /></PhoneFrame>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-surface py-20" aria-label="Steps">
        <Container>
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {page.steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.06} className="bg-surface p-7">
                <span className="font-display text-[15px] font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.01em]">{s.title}</h2>
                <p className="mt-2 text-[15px] leading-6 text-ink-subtle">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {page.sections.map((s, i) => (
        <section key={s.title} className={cn('py-20 sm:py-28', i % 2 === 1 && 'bg-surface border-y border-border')}>
          <Container className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal className={cn('max-w-xl', i % 2 === 1 && 'lg:order-2')}>
              <Heading title={s.title} lead={s.body} />
              <ul className="mt-8 space-y-3.5">
                {s.points.map(p => (
                  <li key={p} className="flex gap-3 text-[16px] leading-6 text-ink-muted">
                    <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} y={30} className="mx-auto w-[64%] max-w-[260px]">
              <PhoneFrame><Shot name={s.shot} alt={s.alt} /></PhoneFrame>
            </Reveal>
          </Container>
        </section>
      ))}

      <section className="py-20 sm:py-28" aria-labelledby="role-faq">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 id="role-faq" className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">Before you start.</h2>
          </div>
          <Faq items={page.faqs} />
        </Container>
      </section>

      <section id="get-the-app" className="scroll-mt-20 pb-24 sm:pb-32">
        <Container>
          <Reveal className="flex flex-col items-start justify-between gap-8 rounded-[2rem] border border-border bg-surface p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[38px]">
                {page.slug === 'members' ? 'Get Gymmigo on your phone.' : page.slug === 'gym-owners' ? 'Tell us about your gym.' : 'Tell us about your practice.'}
              </h2>
              <p className="mt-3 text-[17px] leading-7 text-ink-muted">
                {page.slug === 'members'
                  ? 'Android today, iPhone soon. Or use the web app in any browser.'
                  : 'A short WhatsApp chat with our team: what you run, how many members or clients, and what you want to fix first.'}
              </p>
            </div>
            {page.slug === 'members' ? (
              <StoreButtons />
            ) : (
              <Cta kind="lead" label={page.primary.label} page={page} actions={actions} primary />
            )}
          </Reveal>
        </Container>
      </section>
    </>
  );
}
