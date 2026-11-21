import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Faq } from '../../../components/marketing/Site';
import { Callout, Cards, ClubsLayout, Equation, Section, Table } from './ClubsLayout';
import {
  CAPS, CASHBACK, CLUB_FAQS, CLUB_PAGES, COIN_CEILINGS, COIN_TYPES, DIFFICULTY, DIMENSIONS, GLOSSARY, LEVELS, LOSS_CAPS, MULTIPLIERS,
  PASSPORT_MOVES, REWARD_TYPES, SEVERITY, SHIELD, SOURCES, STREAK_TABLE,
} from './clubsContent';
import { consistency, gcpi, multiplier, rawPenalty, streakScore, type Dims } from './clubsMath';

const fmt = (n: number) => n.toLocaleString('en-IN');

// ─── /clubs ────────────────────────────────────────────────────────────────

export function ClubsOverviewPage() {
  return (
    <ClubsLayout path="/clubs" lead={<>Every verified workout, healthy habit and good week earns <strong>Club Points</strong>. Points move you up <strong>eight club levels</strong>, your recent performance can <strong>multiply</strong> what you earn, and your gym rewards you for the level you reach. Fair rules, explained in full.</>}>
      {() => (
        <>
          <Section title="How a day works">
            <Cards items={[
              { kicker: 'Step 1', title: 'Get your missions', body: 'Up to 3 core missions and 1 optional bonus each day, built around your plan, your gym and how recovered you are. Rest days get rest-day missions.' },
              { kicker: 'Step 2', title: 'Do them, they verify themselves', body: 'Check-ins, Migo workouts and meal plans, runs, steps and sleep are recognised automatically. Small habits like water or mobility you tick off yourself.' },
              { kicker: 'Step 3', title: 'Earn Club Points', body: 'Each mission has points set by its difficulty. Your GCPI multiplier (1× to 4×) can increase them, within fair daily and weekly limits.' },
              { kicker: 'Step 4', title: 'Climb the levels', body: 'Reach a level’s threshold and keep a good rhythm, and you are promoted at the next review. Higher levels unlock better rewards at your gym.' },
              { kicker: 'Every 28 days', title: 'Your review', body: 'Your Performance Index is worked out across six areas, sets your multiplier for the next 28 days and tells you exactly how to improve.' },
              { kicker: 'Always', title: 'Fair play', body: 'One weak week only brings a warning. Illness, travel and gym closures are protected. Lifetime CP is never taken away.' },
            ]} />
          </Section>
          <Section title="The 8 club levels" intro="Thresholds are cumulative Active CP. Promotion happens at a review, one level at a time.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {LEVELS.map(l => (
                <div key={l.level} className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-[13px] font-semibold text-ink-subtle">Level {l.level}</p>
                  <p className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.02em]">{l.name}</p>
                  <p className="mt-1 text-[15px] font-semibold text-accent-text">{fmt(l.cp)} CP</p>
                  <p className="mt-2 text-[14px] leading-6 text-ink-muted">{l.feel}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Three balances, kept separate">
            <Table head={['Balance', 'What it is', 'When you change gyms']} rows={[
              ['Lifetime CP', 'Your permanent achievement record. It only goes up.', 'Moves with you.'],
              ['Active CP', 'Your current points at a gym; it sets your level there.', 'Mapped by Migo Passport.'],
              ['Migo Coins', 'Loyalty credit worth ₹1 of eligible redemption value per coin.', 'Depends on who gave them.'],
            ]} />
            <div className="mt-4"><Callout title="Points are not money">Club Points measure progress. Migo Coins are a separate loyalty balance. One never turns into the other.</Callout></div>
          </Section>
          <Section title="Explore the rules">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CLUB_PAGES.slice(1).map(p => (
                <Link key={p.path} to={p.path} className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-ink">
                  <p className="font-display text-[18px] font-bold">{p.label}</p>
                  <p className="mt-1.5 text-[14px] leading-6 text-ink-muted">{p.description}</p>
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/levels ─────────────────────────────────────────────────────────

export function ClubsLevelsPage() {
  return (
    <ClubsLayout path="/clubs/levels" lead="Eight levels from Starter to Immortal. The rules are the same at every Gymmigo gym; each gym chooses the rewards it offers at each level.">
      {() => (
        <>
          <Section title="Levels and thresholds">
            <Table head={['Level', 'Name', 'Active CP needed', 'What it can unlock (set by your gym)']}
              rows={LEVELS.map(l => [String(l.level), l.name, `${fmt(l.cp)} CP`, l.unlocks])} />
            <p className="mt-3 text-[14px] text-ink-subtle">Rewards are examples of what gyms can offer at each level, not guaranteed benefits. Every gym sets its own catalogue.</p>
          </Section>
          <Section title="How promotion works">
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Reaching a threshold makes you <strong>eligible</strong> for promotion; it doesn’t happen automatically.</li>
              <li>You also need at least <strong>2 qualifying weeks in the last 4</strong> and no open fair-play issue.</li>
              <li>You move up <strong>one level at a time</strong>, even if your points already cover more.</li>
              <li>Some gyms give a level-up bonus in Gym Coins.</li>
            </ul>
          </Section>
          <Section title="Keeping your level">
            <Cards items={[
              { title: 'No instant downgrades', body: 'One weak week or one missed task never lowers your level.' },
              { title: 'Warnings first', body: 'You get a warning, an explanation and a recovery plan before anything changes.' },
              { title: 'Downgrade only after repeated reviews', body: 'Only after two weak 28-day reviews in a row, and after any Club Shield you hold. Lifetime CP and badges always stay.' },
              { title: 'Come back stronger', body: 'After a downgrade, one clean 28-day period restores your previous level.' },
            ]} />
          </Section>
          <Section title="Free at every level">
            <Callout tone="good" title="Basics are never locked">Core fitness support, workout guidance, safety information, your history and the essential app features are available to every member at every level. Higher levels add privileges and rewards, never basic support.</Callout>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/points ─────────────────────────────────────────────────────────

export function ClubsPointsPage() {
  return (
    <ClubsLayout path="/clubs/points" lead="Club Points (CP) come from verified missions and challenges. Missions are personal: two members at the same level can get different missions because goals, history, time and recovery differ.">
      {() => (
        <>
          <Section title="Daily missions" intro="Up to 3 core missions plus 1 optional bonus each day, and one weekly mission. Missions fit your normal routine and never require training every day.">
            <Table head={['Difficulty', 'Base CP', 'Examples']} rows={DIFFICULTY.map(d => [d.level, d.cp, d.examples])} />
            <p className="mt-3 text-[14px] text-ink-subtle">Difficulty is relative to you. Recovery, mobility and habit missions earn real points too.</p>
          </Section>
          <Section title="How your CP is calculated">
            <Equation note="Eligible Base CP = the points of your verified missions after the limits below. The multiplier comes from your Performance Index.">Gross CP = Eligible Base CP × GCPI multiplier</Equation>
          </Section>
          <Section title="Fair limits" intro="Limits keep the game fair and stop anyone farming points with sheer volume.">
            <Table head={['Limit', 'Base CP']} rows={[['Per day (all missions)', String(CAPS.daily)], ['Per week', String(CAPS.weekly)],
              ...CAPS.categories.map(([c, n]) => [`${c} per day`, String(n)])]} />
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Each mission counts once. Duplicate check-ins, repeated or replayed evidence and extra accounts earn nothing.</li>
              <li>Harder missions need verified activity; only easy habits can be ticked off yourself.</li>
              <li>Missions are only given when you have what they need (your gym’s equipment, a connected watch for steps or sleep, and so on).</li>
            </ul>
          </Section>
          <Section title="What earns CP">
            <Table head={['Source', 'How it counts']} rows={SOURCES.map(s => [s.source, s.treatment])} />
          </Section>
          <Section title="Missions adapt to you">
            <Table head={['If you…', 'Migo…']} rows={[
              ['keep completing your missions', 'gradually makes them more varied or a little harder'],
              ['keep struggling', 'makes them shorter or easier, or suggests a restart plan'],
              ['show tiredness or poor recovery', 'lowers the load and adds rest and recovery missions'],
              ['have a rest day in your plan', 'gives recovery and lifestyle missions instead of training'],
            ]} />
          </Section>
          <Section title="Something looks wrong?">
            <Callout title="Every point is explained">Your CP history shows each mission or reason, the multiplier and any limit that applied. If a mission didn’t verify or a deduction looks wrong, appeal it from the app.</Callout>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/performance-index ──────────────────────────────────────────────

function GcpiCalculator() {
  const [d, setD] = useState<Dims>({ C: 90, P: 80, H: 85, B: 75, R: 90, E: 80 });
  const [base, setBase] = useState(280);
  const [prev4x, setPrev4x] = useState(false);
  const score = gcpi(d);
  const m = multiplier(score, d, prev4x);
  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        {DIMENSIONS.map(x => (
          <label key={x.key} className="block">
            <span className="flex justify-between text-[14px]"><span className="font-medium text-ink">{x.key} · {x.name} <span className="text-ink-subtle">({Math.round(x.weight * 100)}%)</span></span><span className="font-mono">{d[x.key]}</span></span>
            <input type="range" min={0} max={100} value={d[x.key]} onChange={e => setD({ ...d, [x.key]: Number(e.target.value) })} className="mt-1 w-full accent-[var(--color-accent)]" aria-label={x.name} />
          </label>
        ))}
        <label className="flex items-center gap-3 text-[14px]">
          <span className="text-ink">Base CP this period</span>
          <input type="number" min={0} max={2000} value={base} onChange={e => setBase(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded-lg border border-border bg-background px-2 py-1 font-mono" />
        </label>
        <label className="flex items-center gap-2 text-[14px] text-ink-muted"><input type="checkbox" checked={prev4x} onChange={e => setPrev4x(e.target.checked)} /> Previous period also qualified for 4×</label>
      </div>
      <div className="flex flex-col justify-center gap-3 rounded-2xl bg-background p-5">
        <p className="text-[14px] text-ink-subtle">Your GCPI</p>
        <p className="font-display text-[48px] font-extrabold leading-none tracking-[-0.03em]">{score.toFixed(2)}</p>
        <p className="text-[16px]">Multiplier <strong className="text-accent-text">{m.x}×</strong> · {m.label}</p>
        <p className="text-[16px]">{fmt(base)} × {m.x} = <strong>{fmt(Math.floor(base * m.x))} CP</strong></p>
        {m.notes.map(n => <p key={n} className="text-[13px] text-warning">{n}</p>)}
      </div>
    </div>
  );
}

export function ClubsGcpiPage() {
  return (
    <ClubsLayout path="/clubs/performance-index" eyebrow="GCPI" lead="The Gymmigo Club Performance Index (GCPI) is one 0–100 score of how balanced and steady your last 28 days were. It sets your multiplier — so quality, consistency and recovery pay more than hours alone.">
      {() => (
        <>
          <Section title="The equation">
            <Equation note="Each dimension is scored 0–100. C = Consistency, P = Personal improvement, H = Challenge performance, B = Lifestyle balance, R = Recovery, E = Engagement.">GCPI = 0.25C + 0.20P + 0.20H + 0.15B + 0.10R + 0.10E</Equation>
          </Section>
          <Section title="The six dimensions">
            <Table head={['Dimension', 'Weight', 'What it measures']} rows={DIMENSIONS.map(x => [`${x.key} · ${x.name}`, `${Math.round(x.weight * 100)}%`, x.what])} />
            <p className="mt-3 text-[14px] text-ink-subtle">If there is simply no data for a dimension (for example no watch connected), it counts as neutral, not zero.</p>
          </Section>
          <Section title="Consistency in detail">
            <Equation note="A = how much of your personal plan you completed in the period; S = your streak score from qualifying weeks in a row.">C = 0.70A + 0.30S</Equation>
            <div className="mt-4"><Table head={['Qualifying weeks in a row', 'Streak score (S)']} rows={STREAK_TABLE.map(r => [r.weeks, String(r.s)])} /></div>
            <p className="mt-3 text-[14px] text-ink-subtle">Example: 80% adherence with a 5-week streak → C = 0.70×80 + 0.30×{streakScore(5)} = {consistency(80, 5)}.</p>
          </Section>
          <Section title="Multiplier table" intro="Your GCPI from the last completed 28 days sets the multiplier for the next 28 days — so points you earn now never boost themselves.">
            <Table head={['GCPI', 'Multiplier', 'Label']} rows={MULTIPLIERS.map(m => [m.range, `${m.x.toFixed(2)}×`, m.label])} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Callout title="3× and above">Need every one of the six dimensions at 80 or more — one outstanding area isn’t enough.</Callout>
              <Callout title="4×">Needs GCPI of at least 99, no dimension below 90, and two qualifying 28-day periods in a row.</Callout>
            </div>
          </Section>
          <Section title="Worked example">
            <Table head={['Dimension', 'Score', 'Weight', 'Weighted']} rows={[
              ['Consistency', '90', '25%', '22.50'], ['Personal improvement', '80', '20%', '16.00'], ['Challenge performance', '85', '20%', '17.00'],
              ['Lifestyle balance', '75', '15%', '11.25'], ['Recovery', '90', '10%', '9.00'], ['Engagement', '80', '10%', '8.00'], ['Total GCPI', '', '', '83.75'],
            ]} highlight={6} />
            <p className="mt-3 text-[16px] leading-7 text-ink-muted">83.75 falls in the 80–87 band → <strong>1.75×</strong>. With 280 eligible base CP: 280 × 1.75 = <strong>490 CP</strong>.</p>
          </Section>
          <Section title="Try it"><GcpiCalculator /></Section>
          <Section title="When it’s calculated">
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Every 28 days, using the previous completed 28 days.</li>
              <li>Each review explains every dimension and what would raise it.</li>
              <li>Gym or app outages are never treated as your failure.</li>
            </ul>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/fair-play ──────────────────────────────────────────────────────

function PenaltyCalculator() {
  const [t, setT] = useState(350);
  const [w, setW] = useState(55);
  const [weeks, setWeeks] = useState(2);
  const [cp, setCp] = useState(12000);
  const [lvl, setLvl] = useState(3);
  const s = [0, 0, 0.5, 1, 1.5, 2][Math.min(5, weeks)];
  const raw = w >= 60 ? 0 : rawPenalty(t, w, s);
  const capPct = [2, 2, 1.5, 1.5, 1, 1, 0.75, 0.5][lvl - 1];
  const cap = Math.floor((cp * capPct) / 100);
  const field = 'w-24 rounded-lg border border-border bg-background px-2 py-1 font-mono';
  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-4 text-[14px]">
        <label>Weekly target CP (T)<input type="number" className={field} value={t} onChange={e => setT(Number(e.target.value) || 0)} /></label>
        <label>Compliance W (%)<input type="number" min={0} max={100} className={field} value={w} onChange={e => setW(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} /></label>
        <label>Weeks below 60% in a row<input type="number" min={1} max={8} className={field} value={weeks} onChange={e => setWeeks(Math.max(1, Number(e.target.value) || 1))} /></label>
        <label>Level<input type="number" min={1} max={8} className={field} value={lvl} onChange={e => setLvl(Math.min(8, Math.max(1, Number(e.target.value) || 1)))} /></label>
        <label className="col-span-2">Active CP<input type="number" className={field} value={cp} onChange={e => setCp(Number(e.target.value) || 0)} /></label>
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-2xl bg-background p-5 text-[16px]">
        <p>Severity S = <strong>{s}×</strong></p>
        <p>Raw penalty = 0.20 × {t} × (1 − {w}/100) × {s} = <strong>{raw.toFixed(2)} CP</strong></p>
        <p>Your 28-day cap at level {lvl}: {capPct}% × {fmt(cp)} = <strong>{fmt(cap)} CP</strong></p>
        <p className="text-[14px] text-ink-subtle">The review applies the lower of all raw penalties in the period and the cap. Lifetime CP is never touched.</p>
      </div>
    </div>
  );
}

export function ClubsFairPlayPage() {
  return (
    <ClubsLayout path="/clubs/fair-play" lead="Missing a task only means you don’t earn its points. Deductions are reserved for repeated weeks below your plan, are capped by your level, only touch Active CP, and always come with a recovery plan.">
      {() => (
        <>
          <Section title="Weekly compliance">
            <Equation note="Only your core missions count. Optional bonus missions, approved protected days and freezes are left out.">W = 100 × Completed core missions ÷ Available core missions</Equation>
            <p className="mt-3 text-[16px] leading-7 text-ink-muted">A week at <strong>60% or more</strong> is a qualifying week and grows your streak. Below 60% is a deficient week.</p>
          </Section>
          <Section title="Severity by week">
            <Table head={['Deficient weeks in a row', 'Severity (S)', 'What happens']} rows={SEVERITY.map(s => [s.week, s.s, s.response])} />
          </Section>
          <Section title="The penalty equation">
            <Equation note="T = your personal weekly target (base CP of your core missions); W = weekly compliance; S = severity.">Raw Penalty = 0.20 × T × (1 − W/100) × S</Equation>
            <p className="mt-3 text-[16px] leading-7 text-ink-muted">Example: 350 CP weekly target, 55% compliance, second deficient week (S = 0.5) → 0.20 × 350 × 0.45 × 0.5 = <strong>15.75 CP</strong>. The 28-day cap is then checked and the lower amount applies.</p>
          </Section>
          <Section title="Caps by level" intro="Higher levels are protected more: the most Active CP you can lose in one 28-day review.">
            <Table head={['Level', 'Max Active CP loss per review']} rows={LOSS_CAPS.map(c => [c.clubs, c.pct])} />
          </Section>
          <Section title="Try it"><PenaltyCalculator /></Section>
          <Section title="Downgrades, step by step">
            <ol className="list-decimal space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>You are told as soon as you enter an at-risk state.</li>
              <li>You see exactly which commitments were missed and how compliance was calculated.</li>
              <li>You get a recovery period and a personal re-entry plan.</li>
              <li>A downgrade is only considered after two weak 28-day reviews in a row — never after one week.</li>
              <li>A Club Shield, if you hold one, blocks that downgrade review.</li>
              <li>Lifetime CP, badges and history always stay. One clean 28-day period restores your previous level.</li>
            </ol>
          </Section>
          <Section title="Protected — never counted against you">
            <Cards items={[
              { title: 'Illness or injury', body: 'Ask for a protection in the app; approved days are removed from your targets. Never train through pain to save a streak.' },
              { title: 'Travel or membership freeze', body: 'Approved travel and freezes pause your targets.' },
              { title: 'Gym closure or app outage', body: 'If the gym is closed or Gymmigo is down, those days don’t count.' },
              { title: 'Rest days', body: 'Rest and recovery in your plan are part of training, never a penalty.' },
            ]} />
          </Section>
          <Section title="Club Shield" intro="An earned protection for members who have shown sustained commitment. It blocks one downgrade review and starts a recovery plan.">
            <Table head={['Level', 'Earned after', 'Max held']} rows={SHIELD.map(s => [s.clubs, s.interval, String(s.max)])} />
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Earned through qualifying weeks, not just time passing.</li>
              <li>You can hold one unused shield. It can’t be bought with coins or given to anyone.</li>
              <li>It doesn’t undo a capped deduction; it protects your level for one review.</li>
              <li>You never need to spend a shield for an approved illness, injury, freeze, closure or outage.</li>
            </ul>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/rewards-and-coins ──────────────────────────────────────────────

export function ClubsRewardsPage() {
  return (
    <ClubsLayout path="/clubs/rewards-and-coins" lead="Your level decides which rewards you can claim. Each gym chooses its own rewards, quantities and terms — so rewards differ from gym to gym, while the level rules stay the same everywhere.">
      {() => (
        <>
          <Section title="Who rewards you">
            <Cards items={[
              { title: 'Your gym', body: 'Renewal discounts, guest passes, assessments, PT sessions, classes, merchandise, membership extensions.' },
              { title: 'Gymmigo', body: 'Platform campaigns, digital challenge prizes and Gymmigo events.' },
              { title: 'Partner brands', body: 'Offers on supplements, apparel, healthy food, accessories, recovery and events.' },
            ]} />
          </Section>
          <Section title="Kinds of rewards">
            <Table head={['Type', 'Example']} rows={REWARD_TYPES.map(r => [r.family, r.example])} />
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Claim a reward in the app and show the code at your gym’s desk.</li>
              <li>Each reward shows its level, limits, dates and any restrictions before you claim it.</li>
              <li>Rewards may have limited stock or a per-member limit. A claimed reward stays valid even if the offer later ends.</li>
            </ul>
          </Section>
          <Section title="Migo Coins">
            <Equation note="A coin can reduce the price of an eligible purchase by ₹1 under its sponsor’s terms. It isn’t cash.">1 Migo Coin = ₹1 of eligible redemption value</Equation>
            <div className="mt-4"><Table head={['Coin type', 'Given by', 'Use it for', 'If you change gyms']} rows={COIN_TYPES.map(c => [c.name, c.from, c.use, c.moves])} /></div>
          </Section>
          <Section title="Ways to earn coins">
            <Table head={['Way', 'Example']} rows={[
              ['Cashback', 'A small percentage of a settled eligible payment at your gym.'],
              ['Activity rewards', 'A level-up or a verified milestone, where your gym offers it.'],
              ['Promotions', 'Sponsored campaigns with their own dates and limits.'],
              ['Special recognition', 'A one-time achievement reward.'],
            ]} />
          </Section>
          <Section title="Limits by level" intro="Maximum figures. Each gym can set lower limits or switch an earning type off.">
            <Table head={['Level', 'Coins per 28 days (up to)', 'Cashback (up to)']} rows={LEVELS.map((l, i) => [`${l.level} · ${l.name}`, String(COIN_CEILINGS[i]), CASHBACK[i]])} />
            <p className="mt-3 text-[14px] text-ink-subtle">Cashback is worked out on the amount actually paid after discounts, excluding taxes and excluded charges. If a payment is refunded, its cashback is reversed.</p>
          </Section>
          <Section title="Using coins">
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Coins can cover up to <strong>20%</strong> of an eligible bill (your gym may set less), with one gym coupon per bill.</li>
              <li>Every coin shows who gave it and when it expires — before you earn it and in your wallet.</li>
              <li>No transfers between people, no cash withdrawal and no top-ups. Your balance can never go below zero.</li>
            </ul>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/migo-passport ──────────────────────────────────────────────────

export function ClubsPassportPage() {
  return (
    <ClubsLayout path="/clubs/migo-passport" eyebrow="Migo Passport" lead="Moving city or switching gym? Migo Passport carries your Gymmigo identity — Lifetime CP, badges and history — to any Gymmigo gym, so you never start from zero.">
      {() => (
        <>
          <Section title="What moves with you">
            <Table head={['Your…', 'On transfer']} rows={PASSPORT_MOVES.map(([a, b]) => [a, b])} />
          </Section>
          <Section title="How a transfer works">
            <ol className="list-decimal space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Join your new Gymmigo gym, then request a transfer in the app.</li>
              <li>The new gym confirms your membership; Gymmigo checks the request.</li>
              <li>Your old gym’s rewards, coupons and Gym Coins stay under that gym’s terms.</li>
              <li>You start <strong>one level below</strong> your verified level (the <strong>same level</strong> between gyms of the same chain).</li>
              <li>Keep your plan for <strong>30 days</strong> and your previous level is restored.</li>
              <li>Your streak is protected for <strong>14 days</strong> while you settle in.</li>
            </ol>
          </Section>
          <Section title="Good to know">
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-7 text-ink-muted">
              <li>Your new gym’s reward catalogue applies once you’re active there.</li>
              <li>Milestone bonuses aren’t paid twice because of a transfer.</li>
              <li>There’s a short wait (90 days) between transfers.</li>
              <li>Your personal information is only shared with the new gym with your consent.</li>
            </ul>
          </Section>
        </>
      )}
    </ClubsLayout>
  );
}

// ─── /clubs/glossary ───────────────────────────────────────────────────────

export function ClubsGlossaryPage() {
  return (
    <ClubsLayout path="/clubs/glossary" lead="Every term used in Gymmigo Clubs, in plain words.">
      {() => (
        <>
          <Section title="Glossary">
            <dl className="grid gap-3 sm:grid-cols-2">
              {GLOSSARY.map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-border bg-surface p-5">
                  <dt className="font-display text-[18px] font-bold">{t}</dt>
                  <dd className="mt-1.5 text-[15px] leading-7 text-ink-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <section className="py-8">
            <Container>
              <h2 className="mb-6 font-display text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">Questions</h2>
              <Faq items={CLUB_FAQS.map(f => ({ question: f.q, answer: f.a }))} />
            </Container>
          </section>
        </>
      )}
    </ClubsLayout>
  );
}
