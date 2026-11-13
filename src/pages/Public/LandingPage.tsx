import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LaptopFrame, PhoneFrame } from '../../components/marketing/Frames';
import { Reveal } from '../../components/marketing/Motion';
import { useParallax } from '../../components/marketing/motionUtils';
import { RouteLine } from '../../components/marketing/RouteLine';
import { Shot, type ShotName } from '../../components/marketing/Shot';
import { Container, Eyebrow, Faq, Heading, StoreButtons } from '../../components/marketing/Site';
import { usePageMeta } from '../../components/marketing/usePageMeta';
import { cn } from '../../components/kit/cn';
import { PublicSiteFrame, type PublicActions } from './PublicSiteFrame';
import { homeFaqs } from './publicSiteContent';

const STEPS = [
  { title: 'Find a gym', body: 'Compare passes, facilities and how busy it is right now, for gyms around you.' },
  { title: 'Check in with QR', body: 'Scan at the front desk. Visits, streaks and club progress update on their own.' },
  { title: 'Train with a plan you approved', body: 'Migo drafts it, you review it, and only then does it land in your calendar.' },
  { title: 'Run with friends', body: 'Record runs with GPS and see your friends on the same live map.' },
];

export default function LandingPage() {
  usePageMeta({
    title: 'Gymmigo: gyms, runs and an AI coach in one app',
    description: 'Find a gym near you, check in with QR, follow training plans you approve, and run with friends on a live map. Free for members.',
  });
  return <PublicSiteFrame active="home">{actions => <Landing actions={actions} />}</PublicSiteFrame>;
}

function Landing({ actions }: { actions: PublicActions }) {
  return (
    <>
      <Hero actions={actions} />
      <HowItWorks />
      <FeatureRow
        eyebrow="Gyms"
        title="Pick a gym the way you'd pick a café."
        body="Explore shows partner gyms near you with their passes, facilities, reviews and live occupancy. Choose a plan in the app, pay at the front desk, and your pass is ready."
        points={['Monthly, quarterly and day passes side by side', 'Live occupancy, so you skip the 7 pm rush', 'A QR check-in that works at every partner gym']}
        shots={['gym-profile', 'checkout']}
        alts={['Iron Haus Fitness gym page with passes, facilities and occupancy', 'Checkout review showing the monthly plan and total due at the gym']}
      />
      <FeatureRow
        flip
        eyebrow="Migo, your AI coach"
        title="A coach that asks before it plans."
        body="Migo knows your goal, injuries and training history. Ask about a workout, a meal or your form. When you want structure, it drafts a 7, 30, 45 or 90-day plan, and nothing reaches your calendar until you approve it."
        points={['Review the phases and first week, then approve, change or discard', 'Log each day as done, partly done or skipped', 'Diet plans broken into meals with calories and protein']}
        shots={['plan-review', 'migo-meal-plan']}
        alts={['Review screen for a 45-day lean muscle plan', 'Today’s meal plan with breakfast and lunch, calories and protein']}
      />
      <RunsRow />
      <SmallThings />
      <OnTheWeb actions={actions} />
      <Owners actions={actions} />
      <Trainers actions={actions} />
      <PricingTeaser />
      <section className="py-24 sm:py-32" aria-labelledby="faq-title">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-title" className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
              Straight answers.
            </h2>
            <p className="mt-4 text-[17px] leading-7 text-ink-muted">
              Something else on your mind?{' '}
              <Link to="/contact" className="font-semibold text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink">
                Ask us
              </Link>
              .
            </p>
          </div>
          <Faq items={homeFaqs} />
        </Container>
      </section>
      <FinalCta actions={actions} />
    </>
  );
}

function Hero({ actions }: { actions: PublicActions }) {
  const { ref, y } = useParallax(60);
  return (
    <section ref={ref} className="relative overflow-hidden pb-20 pt-12 sm:pt-16 lg:pb-28">
      <div aria-hidden className="pointer-events-none absolute right-[-12%] top-[-10%] h-[680px] w-[680px] rounded-full bg-accent-soft opacity-70 blur-3xl [[data-theme=dark]_&]:opacity-40" />
      <Container className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> New: Gymmigo Run Club, a shared map for every run
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[60px] lg:text-[68px]">
              Your gym, your runs and a coach that knows both.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[18px] leading-8 text-ink-muted">
              Find a gym near you, check in with a QR code, follow a training plan you approved, and run with friends on a live map. One app, free for members.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <StoreButtons className="mt-8" />
            <Link to={actions.getStartedPath} className="group mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              Or open the web app <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        <div className="relative mx-auto h-[540px] w-full max-w-[460px] sm:h-[600px]">
          <RouteLine className="absolute -left-10 top-6 h-[420px] w-[420px] text-ink sm:-left-16" />
          <motion.div style={{ y }} className="absolute left-0 top-12 w-[52%] sm:w-[240px]">
            <Reveal delay={0.25} y={30}>
              <PhoneFrame className="-rotate-[4deg]">
                <Shot name="run-together" priority alt="Live room map with four runners, their routes and a leaderboard" />
              </PhoneFrame>
            </Reveal>
          </motion.div>
          <div className="absolute right-0 top-0 w-[56%] sm:w-[262px]">
            <Reveal delay={0.15} y={30}>
              <PhoneFrame className="rotate-[2deg]">
                <Shot name="sports-home" priority alt="Sports home with this week's distance, active time and the Gymmigo Run Club" />
              </PhoneFrame>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface py-20 sm:py-24" aria-labelledby="how-title">
      <Container>
        <Heading eyebrow="How it works" title={<span id="how-title">From your first visit to your hundredth.</span>} />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.06} className="bg-surface p-7">
              <span className="font-display text-[15px] font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 text-[19px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-ink-subtle">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 space-y-3.5">
      {items.map(p => (
        <li key={p} className="flex gap-3 text-[16px] leading-6 text-ink-muted">
          <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          {p}
        </li>
      ))}
    </ul>
  );
}

function PhonePair({ shots, alts, children }: { shots: [ShotName, ShotName]; alts: [string, string]; children?: ReactNode }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[520px] items-start justify-center gap-5 sm:gap-7">
      {children}
      <Reveal delay={0.05} y={28} className="w-[46%] max-w-[238px]">
        <PhoneFrame>
          <Shot name={shots[0]} alt={alts[0]} />
        </PhoneFrame>
      </Reveal>
      <Reveal delay={0.15} y={28} className="mt-14 w-[46%] max-w-[238px]">
        <PhoneFrame>
          <Shot name={shots[1]} alt={alts[1]} />
        </PhoneFrame>
      </Reveal>
    </div>
  );
}

function FeatureRow(props: { eyebrow: string; title: string; body: string; points: string[]; shots: [ShotName, ShotName]; alts: [string, string]; flip?: boolean }) {
  return (
    <section className="py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <div className={cn('max-w-xl', props.flip && 'lg:order-2')}>
          <Reveal>
            <Heading eyebrow={props.eyebrow} title={props.title} />
            <p className="mt-5 text-[17px] leading-7 text-ink-muted">{props.body}</p>
            <Points items={props.points} />
          </Reveal>
        </div>
        <PhonePair shots={props.shots} alts={props.alts} />
      </Container>
    </section>
  );
}

function RunsRow() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface py-24 sm:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        <div className="max-w-xl">
          <Reveal>
            <Heading
              eyebrow="Runs and the Run Club"
              title="Run alone, or with half the city."
            />
            <p className="mt-5 text-[17px] leading-7 text-ink-muted">
              Record runs, walks and rides with GPS, even with the screen locked. Every day the Gymmigo Run Club starts a fresh shared map: see who is out right now and every route from today. Or open a room for your friends, live or open for up to 30 days.
            </p>
            <Points
              items={[
                'Splits, pace and climb for every kilometre',
                'Cheer runners from the sidelines',
                'The first and last 200 m of your route stay hidden from others',
              ]}
            />
          </Reveal>
        </div>
        <PhonePair shots={['run-club', 'gps-run']} alts={['Gymmigo Run Club map for today with routes from three runners', 'Active GPS run showing 4.43 km, pace and splits']}>
          <RouteLine className="absolute -right-20 -top-16 h-[380px] w-[380px] text-ink opacity-90" delay={0.4} />
        </PhonePair>
      </Container>
    </section>
  );
}

function SmallThings() {
  const cards: Array<{ title: string; body: string; shot: ShotName; alt: string }> = [
    {
      title: 'Share a run that looks like a run',
      body: 'Route cards on a real map, story cards and stickers for Instagram. The link opens the run in Gymmigo.',
      shot: 'share-card',
      alt: 'Share studio with a route card for a 6.24 km run',
    },
    {
      title: 'Heart rate from your watch',
      body: 'Optional. Read through Health Connect on Android or Apple Health on iPhone, with zones for each run.',
      shot: 'watch-data',
      alt: 'Run summary with average heart rate 158 bpm and time in zones',
    },
    {
      title: 'Clubs that reward showing up',
      body: 'Check-ins move you up your gym’s club ladder, with perks your gym sets, like renewal discounts.',
      shot: 'clubs',
      alt: 'Rhythm Club tier with streak, progress and reward wallet',
    },
  ];
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <Heading eyebrow="And the small things" title="Details you notice on day thirty." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="p-7 pb-0">
                <h3 className="text-[19px] font-semibold tracking-[-0.01em]">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-ink-subtle">{c.body}</p>
              </div>
              <div className="relative mt-7 h-[300px] overflow-hidden px-10">
                <div className="mx-auto w-[230px] translate-y-2 transition-transform duration-500 ease-out group-hover:translate-y-0">
                  <PhoneFrame>
                    <Shot name={c.shot} alt={c.alt} />
                  </PhoneFrame>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function OnTheWeb({ actions }: { actions: PublicActions }) {
  return (
    <section className="border-y border-border bg-surface py-24 sm:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Heading
            eyebrow="On the web"
            title="The same account on a bigger screen."
            lead="Plans, calendar, Migo, gyms and your runs are all on the web app. Recording a GPS run needs the phone, because browsers stop tracking when the screen locks."
          />
          <Link to={actions.getStartedPath} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-border-strong px-6 text-[15px] font-semibold transition-colors hover:bg-surface-sunken">
            Open the web app <ArrowRight size={16} />
          </Link>
        </Reveal>
        <Reveal delay={0.1} y={30}>
          <LaptopFrame>
            <Shot name="web-plans" alt="Gymmigo web app showing Migo training plans and today’s plan" />
          </LaptopFrame>
        </Reveal>
      </Container>
    </section>
  );
}

function Owners({ actions }: { actions: PublicActions }) {
  return (
    <section data-theme="dark" className="relative overflow-hidden bg-background py-24 text-ink sm:py-32" aria-labelledby="owners-title">
      <Container className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="max-w-xl">
          <Eyebrow>For gym owners</Eyebrow>
          <h2 id="owners-title" className="mt-3 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
            Run the gym from your phone. Keep the desk for welcoming people.
          </h2>
          <p className="mt-5 text-[17px] leading-7 text-ink-muted">
            Approve memberships, check members in, raise invoices and see today’s occupancy, for one gym or several. Bring your members over from Excel on day one.
          </p>
          <Points items={['Members, plans and renewals in one list', 'A club ladder that turns check-ins into referrals', 'Revenue, expenses and products per gym']} />
          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" onClick={() => actions.openLead('owner', 'landing owners')} className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white transition-colors hover:bg-accent-pressed">
              List your gym
            </button>
            <Link to="/gym-owners" className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong px-6 text-[15px] font-semibold transition-colors hover:bg-surface">
              How it works for owners <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
        <div className="relative mx-auto flex w-full max-w-[560px] items-start justify-center gap-4">
          {(
            [
              ['owner-members', 'Members list with active and pending memberships', 'mt-16'],
              ['owner-home', 'Owner home with members, revenue and occupancy per gym', ''],
              ['owner-clubs', 'Published club ladder with eight tiers', 'mt-24'],
            ] as Array<[ShotName, string, string]>
          ).map(([name, alt, offset], i) => (
            <Reveal key={name} delay={i * 0.08} y={30} className={cn('w-[32%] max-w-[190px]', offset)}>
              <PhoneFrame>
                <Shot name={name} scheme="dark" alt={alt} />
              </PhoneFrame>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Trainers({ actions }: { actions: PublicActions }) {
  return (
    <section className="py-24 sm:py-28">
      <Container>
        <Reveal className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-border bg-surface p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-xl">
            <Eyebrow>For trainers</Eyebrow>
            <h2 className="mt-3 font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[38px]">Packages, bookings and sessions, without the spreadsheet.</h2>
            <p className="mt-4 text-[17px] leading-7 text-ink-muted">
              Publish session packs, take booking requests and keep every client in one calendar. Trainer accounts are opening in stages.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => actions.openLead('trainer', 'landing trainers')} className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-background">
                Request early access
              </button>
              <Link to="/trainers" className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-ink-muted hover:text-ink">
                Learn more <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative -mb-24 mx-auto w-[230px] sm:-mb-28">
            <PhoneFrame>
              <Shot name="trainer-home" alt="Trainer home with clients, sessions delivered and new requests" />
            </PhoneFrame>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="border-y border-border bg-surface py-20 sm:py-24">
      <Container className="grid gap-5 md:grid-cols-2">
        <Reveal className="rounded-3xl border border-border bg-background p-8">
          <Eyebrow>Members</Eyebrow>
          <p className="mt-4 font-display text-[40px] font-extrabold tracking-[-0.03em]">Free</p>
          <p className="mt-3 text-[16px] leading-7 text-ink-muted">The app costs nothing. Gyms and trainers set their own prices, and you see the full amount before you confirm.</p>
        </Reveal>
        <Reveal delay={0.08} className="rounded-3xl border border-border bg-background p-8">
          <Eyebrow>Gyms</Eyebrow>
          <p className="mt-4 font-display text-[40px] font-extrabold tracking-[-0.03em]">Priced to your size</p>
          <p className="mt-3 text-[16px] leading-7 text-ink-muted">Three setups, Launch, Growth and Network, agreed on a short call after we understand your gym.</p>
          <Link to="/pricing" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            See what each includes <ArrowRight size={16} />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

function FinalCta({ actions }: { actions: PublicActions }) {
  return (
    <section id="get-the-app" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-[#131315] px-8 py-16 text-white sm:px-14 sm:py-20">
          <RouteLine className="absolute -right-24 -top-10 h-[460px] w-[460px] text-white opacity-60" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">Your next workout starts with one tap.</h2>
            <p className="mt-5 text-[17px] leading-7 text-white/70">Get Gymmigo on Android today. The iPhone app is coming soon, and the web app works everywhere.</p>
            <StoreButtons tone="inverse" className="mt-9" />
            <Link to={actions.getStartedPath} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white">
              Open the web app <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
