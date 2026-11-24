import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, Lock, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { Avatar, Badge, BarChart, Button, Card, Chip, EmptyState, ErrorState, IconButton, SegmentedControl, Skeleton, StatTile, Text, TextArea, useToast } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { inr, ownerSuite, type AnalyticsRange, type MemberAnalytics } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';
import { InvoiceSheet } from './BillingTab';
import { Row } from './Row';
import { RANGES, toBars } from './shared';

type Tab = 'overview' | 'attendance' | 'payments' | 'club' | 'training' | 'pt' | 'timeline' | 'notes';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'attendance', label: 'Attendance' }, { value: 'payments', label: 'Payments' }, { value: 'club', label: 'Club' },
  { value: 'training', label: 'Training' }, { value: 'pt', label: 'PT' }, { value: 'timeline', label: 'Activity' }, { value: 'notes', label: 'Notes' },
];
const DIM: Record<string, string> = { C: 'Consistency', P: 'Progress', H: 'Health', B: 'Body', R: 'Reliability', E: 'Engagement' };
const d = (s?: string | null, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => (s ? new Date(s).toLocaleDateString('en-IN', o) : '—');
const hour = (h: number | null) => (h == null ? '—' : `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`);

/** One member at this gym: KPIs, attendance, payments, club, PT, training (if shared), activity and staff notes. */
export default function MemberAnalyticsPage() {
  const { gymId } = useGym();
  const { userId = '' } = useParams();
  const toast = useToast();
  const [range, setRange] = useState<AnalyticsRange>('90d');
  const [tab, setTab] = useState<Tab>('overview');
  const [invoice, setInvoice] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['owner', gymId, 'member', userId, range], queryFn: () => ownerSuite.memberAnalytics(gymId!, userId, range), enabled: !!gymId && !!userId });
  const remind = async (kind: 'dues' | 'expiry') => {
    try { await ownerSuite.remind(gymId!, userId, { kind }); toast({ tone: 'success', title: 'Reminder sent' }); } catch (e) { toast({ tone: 'danger', title: 'Could not send', message: getApiErrorMessage(e) }); }
  };
  if (!gymId) return null;
  const a = q.data;
  const base = `/app/gym-owner/gyms/${gymId}`;
  return (
    <div className="space-y-5">
      <Link to={`${base}/members`} className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"><ArrowLeft size={16} /> Members</Link>
      {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !a ? <Skeleton className="h-96" /> : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={a.member.name} src={a.member.avatar_url} size={64} />
            <div className="min-w-0 flex-1">
              <Text variant="h1">{a.member.name ?? 'Member'}</Text>
              <Text variant="footnote" tone="subtle">Member since {d(a.member.member_since, { month: 'short', year: 'numeric' })} · {a.club.level_name} · {a.member.phone}</Text>
            </div>
            {a.member.phone ? <IconButton icon={Phone} label="Call" onClick={() => window.open(`tel:${a.member.phone}`)} /> : null}
            {a.member.phone ? <IconButton icon={MessageCircle} label="WhatsApp" onClick={() => window.open(`https://wa.me/${(a.member.phone ?? '').replace(/\D/g, '').slice(-10).replace(/^/, '91')}`, '_blank')} /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">{RANGES.map(r => <Chip key={r.value} label={r.label} selected={range === r.value} onClick={() => setRange(r.value)} />)}</div>
          <div className="overflow-x-auto"><SegmentedControl options={TABS} value={tab} onChange={setTab} size="sm" /></div>
          {tab === 'overview' ? <Overview a={a} onRemind={remind} />
            : tab === 'attendance' ? <Attendance a={a} />
            : tab === 'payments' ? <Payments a={a} onOpen={setInvoice} onRemind={() => remind('dues')} />
            : tab === 'club' ? <Club a={a} />
            : tab === 'training' ? <Training a={a} />
            : tab === 'pt' ? <Pt a={a} to={`${base}/trainers?tab=pt&assign=${userId}&name=${encodeURIComponent(a.member.name ?? '')}`} />
            : tab === 'timeline' ? <Timeline gymId={gymId} userId={userId} />
            : <Notes gymId={gymId} userId={userId} />}
        </>
      )}
      {invoice ? <InvoiceSheet gymId={gymId} invoiceId={invoice} onClose={() => setInvoice(null)} onChanged={() => q.refetch()} /> : null}
    </div>
  );
}

function Overview({ a, onRemind }: { a: MemberAnalytics; onRemind: (k: 'dues' | 'expiry') => void }) {
  const k = a.kpis;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Visits" value={k.visits_in_range} caption={`${k.visits_per_week}/week`} emphasis />
        <StatTile label="Weekly streak" value={k.streak_weeks} unit="wk" caption={k.days_since_visit != null ? `last visit ${k.days_since_visit === 0 ? 'today' : `${k.days_since_visit}d ago`}` : 'no visits yet'} />
        <StatTile label="Lifetime value" value={inr(k.lifetime_value)} caption="paid here" />
        <StatTile label="Due" value={inr(k.dues)} caption={k.days_left != null ? `${k.days_left} days left on plan` : 'no active plan'} captionTone={k.dues ? 'danger' : 'subtle'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <Row label="Usually comes at" value={hour(k.preferred_hour)} />
          <Row label="Average visit" value={k.avg_minutes ? `${k.avg_minutes} min` : '—'} />
          <Row label="Club level" value={`${a.club.level_name} · ${a.club.active_cp.toLocaleString('en-IN')} CP`} />
          <Row label="Personal training" value={a.pt.find(p => p.status === 'confirmed') ? `${a.pt.find(p => p.status === 'confirmed')!.sessions_left} sessions left` : 'none'} />
        </Card>
        <Card padding="lg">
          <div className="flex items-center justify-between"><Text variant="bodyStrong">Churn risk</Text>
            {k.churn_risk ? <Badge tone={k.churn_risk.level === 'low' ? 'success' : k.churn_risk.level === 'medium' ? 'warning' : 'danger'} label={`${k.churn_risk.level} · ${k.churn_risk.score}`} /> : <Badge label="not scored yet" />}</div>
          {k.churn_risk?.action ? <Text variant="footnote" tone="muted" className="mt-1">{k.churn_risk.action}</Text> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {k.dues ? <Button size="sm" icon={Bell} onClick={() => onRemind('dues')}>Remind to pay</Button> : null}
            {k.days_left != null && k.days_left <= 10 ? <Button size="sm" variant="secondary" onClick={() => onRemind('expiry')}>Remind to renew</Button> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Attendance({ a }: { a: MemberAnalytics }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg" className="space-y-2"><Text variant="title">Visits</Text><BarChart bars={toBars(a.attendance.series)} ariaLabel="Visits" /></Card>
      <Card padding="lg" className="space-y-2"><Text variant="title">Time of day</Text><BarChart bars={a.attendance.by_hour.map(h => ({ label: String(h.hour % 12 || 12), value: h.value }))} height={110} ariaLabel="Visits by hour" /></Card>
      <Card padding="lg" className="lg:col-span-2">
        <Text variant="title">Recent visits</Text>
        {a.attendance.recent.length ? a.attendance.recent.map(v => <Row key={v.at} label={new Date(v.at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} value={v.minutes ? `${v.minutes} min` : '—'} />)
          : <Text variant="caption" tone="subtle">No visits yet.</Text>}
      </Card>
    </div>
  );
}

function Payments({ a, onOpen, onRemind }: { a: MemberAnalytics; onOpen: (id: string) => void; onRemind: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="lg">
        <Text variant="title">Memberships</Text>
        {a.memberships.map(m => <Row key={m.id} label={`${d(m.start)} → ${d(m.end)} · ${m.status}${m.auto_renew ? ' · auto-renew' : ''}`} value={`${inr(m.amount)} ${m.payment_status === 'paid' ? '✓' : m.payment_status}`} />)}
      </Card>
      <Card padding="lg">
        <div className="flex items-center justify-between"><Text variant="title">Invoices</Text>{a.kpis.dues ? <Button size="sm" icon={Bell} onClick={onRemind}>Remind about {inr(a.kpis.dues)}</Button> : null}</div>
        {a.invoices.length ? a.invoices.map(i => (
          <button key={i.id} type="button" onClick={() => onOpen(i.id)} className="flex w-full items-center justify-between gap-2 py-1.5 text-left hover:opacity-80">
            <span><Text variant="callout">{i.invoice_number}</Text><Text variant="caption" tone="subtle">{d(i.date)} · {i.source}</Text></span>
            <span className="text-right"><Text variant="bodyStrong">{inr(i.total)}</Text><Badge tone={i.status === 'paid' ? 'success' : i.status === 'overdue' ? 'danger' : i.status === 'partial' ? 'warning' : 'neutral'} label={i.balance ? `${inr(i.balance)} due` : i.status} /></span>
          </button>
        )) : <Text variant="caption" tone="subtle">No invoices yet.</Text>}
      </Card>
    </div>
  );
}

function Club({ a }: { a: MemberAnalytics }) {
  const c = a.club;
  const dims = Object.entries(c.dimensions ?? {}).map(([k, v]) => ({ k, score: typeof v === 'number' ? v : (v as { score?: number | null })?.score ?? 0 }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label={c.level_name} value={c.active_cp.toLocaleString('en-IN')} unit="CP" caption={`${c.lifetime_cp.toLocaleString('en-IN')} lifetime`} emphasis />
        <StatTile label="Performance index" value={c.gcpi != null ? Math.round(c.gcpi) : '—'} caption={`${c.multiplier}× ${c.multiplier_label ?? ''}`} />
      </div>
      {dims.length ? <Card padding="lg"><BarChart bars={dims.map(x => ({ label: x.k, value: Math.round(x.score ?? 0), caption: DIM[x.k] }))} height={100} ariaLabel="Performance index dimensions" />
        <Text variant="caption" tone="subtle">{dims.map(x => `${x.k} ${DIM[x.k] ?? ''}`).join(' · ')}</Text></Card> : null}
      <Card padding="lg">
        <Row label="Missions done" value={`${c.missions_done} of ${c.missions_issued}`} />
        <Row label="Weekly streak" value={`${c.streak_weeks} weeks`} />
        <Row label="Review" value={c.review_status ?? '—'} />
        <Row label="Engagement stage" value={c.retention_stage ?? '—'} />
        <Row label="Gym Coins" value={c.coins} />
      </Card>
      {c.claims.length ? <Card padding="lg"><Text variant="title">Reward claims</Text>{c.claims.map(x => <Row key={x.code} label={`${x.code} · ${d(x.at)}`} value={x.status} />)}</Card> : null}
    </div>
  );
}

function Training({ a }: { a: MemberAnalytics }) {
  if (!a.training_shared || !a.training) return <EmptyState icon={Lock} title="Not shared with the gym" message="This member keeps workouts, diet, health and runs private. They can turn on sharing in their app or website settings." />;
  const t = a.training;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Workouts" value={t.workouts.total} caption="logged" emphasis />
        <StatTile label="Runs" value={t.runs.count} caption={`${t.runs.km} km`} />
      </div>
      <Card padding="lg">
        <Row label="Avg steps" value={t.health.avg_steps != null ? Math.round(t.health.avg_steps).toLocaleString('en-IN') : '—'} />
        <Row label="Avg sleep" value={t.health.avg_sleep_h != null ? `${t.health.avg_sleep_h} h` : '—'} />
        <Row label="Resting heart rate" value={t.health.avg_resting_hr != null ? `${t.health.avg_resting_hr} bpm` : '—'} />
        <Row label="Weight" value={t.health.weight_kg != null ? `${t.health.weight_kg} kg${t.health.weight_change_kg ? ` (${t.health.weight_change_kg > 0 ? '+' : ''}${t.health.weight_change_kg})` : ''}` : '—'} />
        <Row label="Diet plans followed" value={t.diet?.followed ?? '—'} />
      </Card>
      <Card padding="lg" className="lg:col-span-2">
        <Text variant="title">Recent training</Text>
        {t.workouts.recent.length ? t.workouts.recent.map((w, i) => <Row key={i} label={`${d(w.date, { day: 'numeric', month: 'short' })} · ${w.label}`} value={w.minutes ? `${w.minutes} min` : w.km ? `${w.km} km` : w.status ?? ''} />)
          : <Text variant="caption" tone="subtle">Nothing logged yet.</Text>}
      </Card>
    </div>
  );
}

function Pt({ a, to }: { a: MemberAnalytics; to: string }) {
  return (
    <div className="space-y-3">
      {a.pt.length ? a.pt.map(p => (
        <Card key={p.id} padding="lg">
          <div className="flex items-center justify-between"><Text variant="bodyStrong">{p.trainer}</Text><Badge tone={p.status === 'confirmed' ? 'success' : 'neutral'} label={p.status === 'confirmed' ? `${p.sessions_left} left` : p.status} /></div>
          <Row label={`${p.sessions_used}/${p.sessions_total} sessions · until ${d(p.end_date)}`} value={p.balance_due ? `${inr(p.balance_due)} due` : inr(p.price)} />
        </Card>
      )) : <EmptyState title="No personal training" message="Pair this member with one of your trainers." />}
      <Button variant="secondary" to={to}>Allocate PT</Button>
    </div>
  );
}

function Timeline({ gymId, userId }: { gymId: string; userId: string }) {
  const q = useQuery({ queryKey: ['owner', gymId, 'member', userId, 'timeline'], queryFn: () => ownerSuite.timeline(gymId, userId) });
  if (!q.data) return <Skeleton className="h-48" />;
  if (!q.data.length) return <EmptyState title="Nothing yet" />;
  return (
    <Card padding="none" className="divide-y divide-line">
      {q.data.map((e, i) => (
        <div key={`${e.at}-${i}`} className="flex items-start justify-between gap-3 px-5 py-3">
          <div className="min-w-0"><Text variant="callout">{e.title}</Text>{e.detail ? <Text variant="caption" tone="subtle">{e.detail}</Text> : null}</div>
          <Text variant="caption" tone="subtle" className="shrink-0">{new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
        </div>
      ))}
    </Card>
  );
}

function Notes({ gymId, userId }: { gymId: string; userId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['owner', gymId, 'member', userId, 'notes'];
  const q = useQuery({ queryKey: key, queryFn: () => ownerSuite.notes(gymId, userId) });
  const [body, setBody] = useState('');
  const add = async () => {
    try { await ownerSuite.addNote(gymId, userId, { body: body.trim() }); setBody(''); qc.invalidateQueries({ queryKey: key }); } catch (e) { toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) }); }
  };
  return (
    <div className="space-y-3">
      <TextArea label="Add a note" helper="Only you and your team see notes." value={body} onChange={e => setBody(e.target.value)} placeholder="Knee niggle, go easy on squats" />
      <Button disabled={!body.trim()} onClick={add}>Save note</Button>
      {(q.data ?? []).map(n => (
        <Card key={n.id} padding="md" className="flex items-start justify-between gap-3">
          <div><Text variant="body">{n.body}</Text><Text variant="caption" tone="subtle">{n.author ?? 'Staff'} · {d(n.at)}</Text></div>
          <IconButton icon={Trash2} label="Delete note" onClick={async () => { await ownerSuite.deleteNote(gymId, userId, n.id).catch(() => undefined); qc.invalidateQueries({ queryKey: key }); }} />
        </Card>
      ))}
    </div>
  );
}
