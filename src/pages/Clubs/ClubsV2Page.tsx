import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Coins, Gift, Info, Shield, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, ProgressRing, Skeleton, Text, TextField, useToast } from '../../components/kit';
import { getApiErrorMessage } from '../../utils/api';
import { clubsV2, type ClubStanding, type Mission } from '../../api/clubsV2';

type Tab = 'overview' | 'missions' | 'performance' | 'rewards' | 'coins' | 'history' | 'passport';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'missions', label: 'Missions' }, { value: 'performance', label: 'Performance' },
  { value: 'rewards', label: 'Rewards' }, { value: 'coins', label: 'Coins' }, { value: 'history', label: 'History' }, { value: 'passport', label: 'Passport' },
];
const fmt = (n: number) => n.toLocaleString('en-IN');
const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');
const STATUS: Record<string, { tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'; label: string }> = {
  healthy: { tone: 'success', label: 'On track' }, warning: { tone: 'warning', label: 'Warning' }, at_risk: { tone: 'danger', label: 'At risk' },
  shielded: { tone: 'accent', label: 'Shield used' }, requalifying: { tone: 'warning', label: 'Requalifying' }, restored: { tone: 'success', label: 'Level restored' },
  downgraded: { tone: 'danger', label: 'Level lowered' },
};
const VERIFY: Record<string, string> = {
  auto_check_in: 'Completes when you check in at your gym', auto_workout_done: 'Completes when you finish the workout in Migo',
  auto_diet_done: 'Completes when you mark your meal plan done', auto_run: 'Completes from a tracked run or ride',
  auto_steps: 'Counted from your phone or watch', auto_sleep: 'Counted from your sleep data', self_report: 'Tick it off yourself',
};

export default function ClubsV2Page() {
  const [gymId, setGymId] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>('overview');
  const q = useQuery({ queryKey: ['clubs-v2', 'me', gymId], queryFn: () => clubsV2.me(gymId) });
  if (q.isLoading) return <div className="mx-auto max-w-5xl p-4"><Skeleton className="h-64" rounded="xl" /></div>;
  if (q.isError || !q.data) {
    const msg = getApiErrorMessage(q.error);
    return (
      <div className="mx-auto max-w-3xl p-4">
        {/join a gym/i.test(msg)
          ? <EmptyState title="Join a gym to start your club journey" message="Club levels, missions and rewards begin with an active membership at a Gymmigo gym." actionLabel="Find a gym" actionTo="/app/explore" />
          : <ErrorState onRetry={() => q.refetch()} />}
      </div>
    );
  }
  const d = q.data;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Text variant="label" tone="subtle">Gymmigo Clubs · {d.gym.name}</Text>
          <Text variant="h1" as="h1">{d.level.name}</Text>
        </div>
        <div className="flex items-center gap-2">
          {d.gyms.length > 1 ? (
            <select aria-label="Gym" value={d.gym.id} onChange={e => setGymId(e.target.value)} className="h-10 rounded-gm-lg border border-border bg-surface px-3 text-sm">
              {d.gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : null}
          <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-accent-text underline"><Info size={14} aria-hidden /> How clubs work</Link>
        </div>
      </div>
      <div role="tablist" aria-label="Clubs section" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TABS.map(t => (
          <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === t.value ? 'bg-ink text-background' : 'bg-surface text-ink-muted hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' ? <Overview d={d} go={setTab} /> : null}
      {tab === 'missions' ? <Missions d={d} /> : null}
      {tab === 'performance' ? <Performance d={d} /> : null}
      {tab === 'rewards' ? <Rewards gymId={d.gym.id} level={d.level.level} /> : null}
      {tab === 'coins' ? <CoinsTab d={d} /> : null}
      {tab === 'history' ? <HistoryTab gymId={d.gym.id} /> : null}
      {tab === 'passport' ? <PassportTab /> : null}
    </div>
  );
}

function Overview({ d, go }: { d: ClubStanding; go: (t: Tab) => void }) {
  const st = STATUS[d.review.status] ?? STATUS.healthy;
  const done = d.missions.filter(m => m.kind === 'daily' && m.status === 'completed').length;
  const daily = d.missions.filter(m => m.kind === 'daily').length;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <div className="flex items-center gap-5">
          <ProgressRing value={d.progress_pct / 100} size={112} stroke={10} label={`${d.progress_pct}% to next level`}>
            <div className="text-center"><div className="text-2xl font-bold">L{d.level.level}</div><div className="text-xs text-ink-subtle">{d.progress_pct}%</div></div>
          </ProgressRing>
          <div className="min-w-0">
            <Text variant="title">{fmt(d.active_cp)} Active CP</Text>
            <Text tone="muted">{!d.next_level ? 'Top level reached' : d.cp_to_next > 0 ? `${fmt(d.cp_to_next)} CP to ${d.next_level.name}`
              : d.review.status === 'requalifying' ? `${d.next_level.name} threshold reached — promotion resumes after requalifying` : `${d.next_level.name} threshold reached — promotion at your next review`}</Text>
            <Text variant="caption" tone="subtle">Lifetime CP {fmt(d.lifetime_cp)} · never goes down</Text>
            <div className="mt-2 flex flex-wrap gap-1.5"><Badge label={st.label} tone={st.tone} /><Badge label={`${d.multiplier.value}× ${d.multiplier.label}`} tone="accent" /><Badge label={`${d.streak_weeks}-week streak`} /></div>
          </div>
        </div>
        {d.review.message ? <p className="mt-4 rounded-gm-md bg-warning-soft px-3 py-2 text-sm text-warning">{d.review.message}</p> : null}
        {d.next_level ? <Text variant="caption" tone="subtle" className="mt-3">Promotion happens at a review once you reach the threshold and have 2 qualifying weeks in the last 4.</Text> : null}
      </Card>
      <div className="grid gap-4">
        <Card variant="raised">
          <div className="flex items-center justify-between"><Text variant="subtitle">Today</Text><Button size="sm" variant="ghost" label="Missions" onClick={() => go('missions')} /></div>
          <Text tone="muted">{done} of {daily} missions done · this week {d.this_week.core_done}/{d.this_week.core_issued} core (qualifying at {d.this_week.threshold_pct}%)</Text>
        </Card>
        <Card variant="raised">
          <div className="flex items-center gap-2"><Shield size={18} aria-hidden /><Text variant="subtitle">Club Shield</Text></div>
          <Text tone="muted">{d.shield.available_at_level
            ? d.shield.held ? 'You hold a shield: it protects your level for one review.' : `${d.shield.qualifying_days} of ${d.shield.days_needed} qualifying days to earn one.`
            : 'Shields start at level 5 (Elite).'}</Text>
        </Card>
        <Card variant="raised">
          <div className="flex items-center gap-2"><Coins size={18} aria-hidden /><Text variant="subtitle">{fmt(d.coins.gym_balance)} Gym Coins</Text></div>
          <Text tone="muted">1 coin = ₹1 off eligible purchases here · {d.coins.cashback_pct}% cashback at your level</Text>
        </Card>
      </div>
      <Card className="lg:col-span-2">
        <Text variant="subtitle" className="mb-3">Your ladder</Text>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {d.ladder.map(l => (
            <div key={l.level} className={`rounded-gm-md border p-2 text-center ${l.level === d.level.level ? 'border-accent bg-accent-soft' : l.level < d.level.level ? 'border-border bg-surface' : 'border-border opacity-60'}`}>
              <div className="text-xs text-ink-subtle">L{l.level}</div><div className="text-sm font-semibold">{l.name}</div><div className="text-xs">{fmt(l.threshold)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MissionCard({ m, onDone, busy }: { m: Mission; onDone: () => void; busy: boolean }) {
  return (
    <Card variant={m.status === 'completed' ? 'sunken' : 'raised'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5"><Badge label={m.category} />{m.kind === 'weekly' ? null : <Badge label={m.difficulty} tone="neutral" />}{m.core ? null : <Badge label={m.kind === 'weekly' ? 'Weekly' : 'Bonus'} tone="accent" />}</div>
          <Text variant="subtitle" className="mt-2">{m.title}</Text>
          {m.instructions ? <Text tone="muted">{m.instructions}</Text> : null}
          {m.safety_note ? <Text variant="caption" tone="subtle" className="mt-1">Safety: {m.safety_note}</Text> : null}
          <Text variant="caption" tone="subtle" className="mt-1">{VERIFY[m.verification] ?? 'Verified automatically'}</Text>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold">{m.base_cp}</div><div className="text-xs text-ink-subtle">base CP</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {m.status === 'completed' ? <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 size={16} aria-hidden /> Done</span>
          : m.status === 'expired' ? <span className="text-sm text-ink-subtle">Expired</span>
          : <span className="inline-flex items-center gap-1 text-sm text-ink-subtle"><Clock size={14} aria-hidden /> Until {day(m.expires_at)}</span>}
        {m.status === 'issued' && m.self_report ? <Button size="sm" label="Mark done" loading={busy} onClick={onDone} /> : null}
      </div>
    </Card>
  );
}

function Missions({ d }: { d: ClubStanding }) {
  const qc = useQueryClient();
  const toast = useToast();
  const done = useMutation({
    mutationFn: (id: string) => clubsV2.complete(id),
    onSuccess: () => { toast({ tone: 'success', title: 'Nice — points added' }); qc.invalidateQueries({ queryKey: ['clubs-v2'] }); },
    onError: e => toast({ tone: 'danger', title: getApiErrorMessage(e) }),
  });
  const daily = d.missions.filter(m => m.kind === 'daily');
  const weekly = d.missions.filter(m => m.kind === 'weekly');
  return (
    <div className="flex flex-col gap-4">
      <Text tone="muted">Points × your multiplier ({d.multiplier.value}×), within {d.limits.daily_cap} base CP a day and {d.limits.weekly_cap} a week.</Text>
      <div className="grid gap-3 md:grid-cols-2">{daily.map(m => <MissionCard key={m.id} m={m} busy={done.isPending && done.variables === m.id} onDone={() => done.mutate(m.id)} />)}</div>
      {weekly.length ? <><Text variant="label" tone="subtle">This week</Text><div className="grid gap-3 md:grid-cols-2">{weekly.map(m => <MissionCard key={m.id} m={m} busy={false} onDone={() => undefined} />)}</div></> : null}
      <ProtectionForm gymId={d.gym.id} />
    </div>
  );
}

function ProtectionForm({ gymId }: { gymId: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ reason: 'illness', starts_on: '', ends_on: '', note: '' });
  const send = useMutation({
    mutationFn: () => clubsV2.protect({ gym_id: gymId, ...f }),
    onSuccess: () => { toast({ tone: 'success', title: 'Request sent — approved days never count against you' }); setOpen(false); },
    onError: e => toast({ tone: 'danger', title: getApiErrorMessage(e) }),
  });
  if (!open) return <Button variant="ghost" size="sm" label="Ill, injured or travelling? Pause your targets" onClick={() => setOpen(true)} />;
  return (
    <Card>
      <Text variant="subtitle">Pause targets</Text>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Reason
          <select className="mt-1 h-10 w-full rounded-gm-lg border border-border bg-surface px-3" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })}>
            {['illness', 'injury', 'travel', 'freeze', 'other'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <TextField label="Note" optional value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <TextField label="From" type="date" value={f.starts_on} onChange={e => setF({ ...f, starts_on: e.target.value })} />
        <TextField label="To" type="date" value={f.ends_on} onChange={e => setF({ ...f, ends_on: e.target.value })} />
      </div>
      <div className="mt-3 flex gap-2"><Button label="Send request" loading={send.isPending} disabled={!f.starts_on || !f.ends_on} onClick={() => send.mutate()} /><Button variant="ghost" label="Cancel" onClick={() => setOpen(false)} /></div>
    </Card>
  );
}

function Performance({ d }: { d: ClubStanding }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><Text variant="label" tone="subtle">Club Performance Index</Text><Text variant="h2">{d.gcpi.score != null ? d.gcpi.score.toFixed(1) : 'First review pending'}</Text></div>
          <div className="text-right"><Text variant="title">{d.multiplier.value}× · {d.multiplier.label}</Text><Text variant="caption" tone="subtle">Next review {day(d.gcpi.next_review)}</Text></div>
        </div>
        <Text variant="caption" tone="subtle" className="mt-2">GCPI = 0.25C + 0.20P + 0.20H + 0.15B + 0.10R + 0.10E, from the last completed 28 days. It sets the multiplier for the next 28 days.</Text>
        {d.gcpi.notes.map(n => <p key={n} className="mt-2 text-sm text-warning">{n}</p>)}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(d.gcpi.dimensions).map(([k, x]) => (
          <Card key={k} variant="raised">
            <div className="flex items-center justify-between"><Text variant="subtitle">{k} · {x.name}</Text><Text variant="title">{x.score ?? '—'}</Text></div>
            <div className="mt-2 h-2 rounded-full bg-surface-sunken"><div className="h-2 rounded-full bg-accent" style={{ width: `${x.score ?? 0}%` }} /></div>
            <Text variant="caption" tone="subtle" className="mt-2">Weight {Math.round(x.weight * 100)}% · {x.why ?? 'Scored at your next review.'}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Rewards({ gymId, level }: { gymId: string; level: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['clubs-v2', 'rewards', gymId], queryFn: () => clubsV2.rewards(gymId) });
  const mine = useQuery({ queryKey: ['clubs-v2', 'redemptions'], queryFn: clubsV2.redemptions });
  const redeem = useMutation({
    mutationFn: (id: string) => clubsV2.redeem(id),
    onSuccess: r => { toast({ tone: 'success', title: `Claimed — show code ${r.code} at the desk` }); qc.invalidateQueries({ queryKey: ['clubs-v2'] }); },
    onError: e => toast({ tone: 'danger', title: getApiErrorMessage(e) }),
  });
  if (list.isLoading) return <Skeleton className="h-40" rounded="xl" />;
  const rows = list.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? <EmptyState icon={Gift} title="No rewards yet" message="Your gym hasn't added club rewards yet. Your level and points keep counting." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(r => (
            <Card key={r.id} variant={r.eligible ? 'raised' : 'sunken'}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5"><Badge label={`Level ${r.min_level}+`} tone={r.eligible ? 'success' : 'neutral'} />{r.sponsor_name ? <Badge label={r.sponsor_name} /> : null}</div>
                  <Text variant="subtitle" className="mt-2">{r.name}</Text>
                  {r.description ? <Text tone="muted">{r.description}</Text> : null}
                  <Text variant="caption" tone="subtle" className="mt-1">
                    {[r.discount_pct ? `${r.discount_pct}% off` : null, r.discount_inr ? `₹${r.discount_inr} off` : null, r.max_discount_inr ? `up to ₹${r.max_discount_inr}` : null,
                      r.min_spend_inr ? `min spend ₹${r.min_spend_inr}` : null, r.coin_cost ? `${r.coin_cost} coins` : null, r.left != null ? `${r.left} left` : null,
                      r.ends_on ? `until ${day(r.ends_on)}` : null].filter(Boolean).join(' · ')}
                  </Text>
                  {r.restrictions ? <Text variant="caption" tone="subtle">{r.restrictions}</Text> : null}
                </div>
              </div>
              <div className="mt-3">
                {r.eligible ? <Button size="sm" label={(r.used ?? 0) >= r.per_member_limit ? 'Claimed' : 'Claim'} disabled={(r.used ?? 0) >= r.per_member_limit || r.left === 0}
                  loading={redeem.isPending && redeem.variables === r.id} onClick={() => redeem.mutate(r.id)} />
                  : <Text variant="caption" tone="subtle">Unlocks at level {r.min_level} (you're level {level}).</Text>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {mine.data?.length ? (
        <Card>
          <Text variant="subtitle" className="mb-2">My claims</Text>
          {mine.data.map(x => (
            <div key={x.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
              <span>{x.reward}</span><span className="font-mono font-semibold">{x.code}</span><Badge label={x.status} tone={x.status === 'redeemed' ? 'success' : x.status === 'issued' ? 'accent' : 'neutral'} />
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  );
}

function CoinsTab({ d }: { d: ClubStanding }) {
  const q = useQuery({ queryKey: ['clubs-v2', 'coins'], queryFn: clubsV2.coins });
  const c = q.data;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Text variant="label" tone="subtle">Migo Coins</Text>
        <Text variant="h2">{fmt(c?.total ?? 0)} coins</Text>
        <Text tone="muted">1 coin = ₹{c?.coin_value_inr ?? 1} off eligible purchases at the gym that gave it. Up to {c?.rules.invoice_cap_pct ?? 20}% of a bill. Not cash; can't be transferred.</Text>
        <Text variant="caption" tone="subtle" className="mt-1">This 28-day cycle: {d.coins.issued_this_cycle} of up to {d.coins.cycle_ceiling} coins earned · cashback {d.coins.cashback_pct}%</Text>
      </Card>
      {c?.buckets.map(b => (
        <Card key={`${b.bucket}${b.gym}`} variant="raised"><div className="flex justify-between"><Text>{b.gym ?? b.bucket}</Text><Text variant="title">{fmt(b.balance)}</Text></div>
          {b.next_expiry ? <Text variant="caption" tone="subtle">Next expiry {day(b.next_expiry)}</Text> : null}</Card>
      ))}
      <Card>
        <Text variant="subtitle" className="mb-2">History</Text>
        {(c?.history ?? []).length === 0 ? <Text tone="muted">No coins yet.</Text> : c!.history.map(h => (
          <div key={h.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
            <span>{day(h.at)} · {h.reason.replace(/_/g, ' ')}</span>
            <span className={h.direction === 'issue' ? 'text-success' : 'text-ink'}>{h.direction === 'issue' ? '+' : '−'}{h.amount}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function HistoryTab({ gymId }: { gymId: string }) {
  const toast = useToast();
  const led = useQuery({ queryKey: ['clubs-v2', 'ledger', gymId], queryFn: () => clubsV2.ledger(gymId) });
  const hist = useQuery({ queryKey: ['clubs-v2', 'history', gymId], queryFn: () => clubsV2.history(gymId) });
  const [appealFor, setAppealFor] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const appeal = useMutation({
    mutationFn: () => clubsV2.appeal({ gym_id: gymId, cp_transaction_id: appealFor ?? undefined, message: msg }),
    onSuccess: () => { toast({ tone: 'success', title: 'Appeal sent' }); setAppealFor(null); setMsg(''); },
    onError: e => toast({ tone: 'danger', title: getApiErrorMessage(e) }),
  });
  return (
    <div className="flex flex-col gap-4">
      {hist.data?.evaluations.length ? (
        <Card>
          <div className="mb-2 flex items-center gap-2"><TrendingUp size={18} aria-hidden /><Text variant="subtitle">28-day reviews</Text></div>
          {hist.data.evaluations.map(e => (
            <div key={e.start} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
              <span>{day(e.start)} – {day(e.end)}</span><span>GCPI {e.gcpi.toFixed(1)} → {e.multiplier}×</span>
              <span>{e.penalty ? `−${e.penalty} CP` : 'no deduction'}</span><Badge label={STATUS[e.review]?.label ?? e.review} tone={STATUS[e.review]?.tone ?? 'neutral'} />
            </div>
          ))}
        </Card>
      ) : null}
      <Card>
        <Text variant="subtitle" className="mb-2">Club Points history</Text>
        {(led.data ?? []).length === 0 ? <Text tone="muted">Nothing yet.</Text> : led.data!.map(t => (
          <div key={t.id} className="border-b border-border py-2 last:border-0">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{t.reason}</span>
              <span className={t.cp < 0 ? 'font-semibold text-danger' : 'font-semibold text-success'}>{t.cp > 0 ? '+' : ''}{fmt(t.cp)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-ink-subtle">
              <span>{day(t.at)} · {t.kind}{t.multiplier !== 1 ? ` · ${t.base_cp} × ${t.multiplier}` : ''}{t.cap ? ` · limit: ${t.cap}` : ''}</span>
              {t.kind === 'penalty' || t.kind === 'earn' ? <button className="underline" onClick={() => setAppealFor(t.id)}>Appeal</button> : null}
            </div>
            {appealFor === t.id ? (
              <div className="mt-2 flex flex-col gap-2">
                <TextField label="What's wrong?" value={msg} onChange={e => setMsg(e.target.value)} />
                <div className="flex gap-2"><Button size="sm" label="Send" disabled={msg.trim().length < 5} loading={appeal.isPending} onClick={() => appeal.mutate()} /><Button size="sm" variant="ghost" label="Cancel" onClick={() => setAppealFor(null)} /></div>
              </div>
            ) : null}
          </div>
        ))}
      </Card>
    </div>
  );
}

function PassportTab() {
  const q = useQuery({ queryKey: ['clubs-v2', 'passport'], queryFn: clubsV2.passport });
  const p = q.data;
  if (!p) return <Skeleton className="h-40" rounded="xl" />;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Text variant="label" tone="subtle">Migo Passport</Text>
        <Text variant="h2">{fmt(p.lifetime_cp)} Lifetime CP</Text>
        <Text tone="muted">Best level: {p.best_level.name}. Lifetime CP, badges and history move with you to any Gymmigo gym.</Text>
        <Text variant="caption" tone="subtle" className="mt-1">On transfer you start {p.rules.level_drop} level lower (same level within one chain) and restore it after {p.rules.requalify_days} days; your streak is protected for {p.rules.streak_grace_days} days.</Text>
      </Card>
      {p.gyms.map(g => <Card key={g.gym_id} variant="raised"><div className="flex justify-between"><Text>{g.gym}</Text><Text variant="title">{g.level.name} · {fmt(g.active_cp)} CP</Text></div>{g.active ? null : <Text variant="caption" tone="subtle">Moved away</Text>}</Card>)}
      {p.transfers.map(t => <Card key={t.id}><Text>Transfer · {t.status} · {day(t.created_at)}</Text></Card>)}
      <Text variant="caption" tone="subtle">{p.cooldown_days_left ? `Next transfer possible in ${p.cooldown_days_left} days.` : 'To transfer, join your new gym first, then request a transfer from the app.'}</Text>
    </div>
  );
}
