import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { BarChart, Button, Card, ErrorState, SegmentedControl, Skeleton, StatTile, Text } from '../../components/kit';
import { adminError, adminGet } from '../api';
import { LineChart } from '../charts';
import { fillSeries, inr, mapsLink, when } from '../format';
import { DataTable, Field, StatusPill } from '../ui';

type Row = Record<string, unknown>;
type G360 = {
  gym: Row; owner: Row | null; owner_user: Row | null; address: Row | null; hours: Row[]; plans: Row[];
  stats: { members_by_status: Record<string, number>; cash_due: number; expiring_14d: number; check_ins_90d: number; revenue_12m: number };
  checkin_days: { date: string; count: number }[]; peak_hours_ist: { hour: number; count: number }[]; revenue_months: { month: string; amount: number; receipts: number }[];
  members: { membership_id: string; user_id: string; name: string | null; phone: string; status: string; payment_status: string; amount: number; end: string | null; check_ins: number | null; last_seen_at: string | null }[];
  trainers: { id: string; user_id: string; name: string | null; verification: string; status: string | null }[];
  reviews: Row[]; churn_risks: Row[]; clubs: Row[]; expenses: Row[];
  footprint: { table: string; column: string; group: string; count: number; last_at: string | null }[];
};
type Tab = 'overview' | 'members' | 'activity' | 'money' | 'all';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const show = (v: unknown) => (v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export default function Gym360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [memberFilter, setMemberFilter] = useState('');
  const q = useQuery({ queryKey: ['admin', 'gym360', id], queryFn: () => adminGet<G360>(`/data/gyms/${id}`) });
  const d = q.data;
  if (q.isLoading) return <Skeleton className="h-96" rounded="xl" />;
  if (q.isError || !d) return <ErrorState message={adminError(q.error).message} onRetry={() => q.refetch()} />;
  const g = d.gym;
  const active = d.stats.members_by_status.active ?? 0;
  const members = memberFilter ? d.members.filter(m => m.status === memberFilter || m.payment_status === memberFilter) : d.members;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
        <div className="min-w-0 flex-1">
          <Text variant="h1" as="h1" truncate>{String(g.name)}</Text>
          <Text tone="muted">{[g.city, g.state].filter(Boolean).join(', ')} · added {when(g.created_at as string, false)}</Text>
        </div>
        <StatusPill status={g.is_verified ? 'verified' : 'pending'} label={g.is_verified ? 'verified' : 'not verified'} />
        <StatusPill status={g.is_active ? 'active' : 'deactivated'} label={g.is_active ? 'live' : 'hidden'} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active members" value={String(active)} caption={`${d.stats.expiring_14d} expiring in 14 days`} captionTone={d.stats.expiring_14d ? 'warning' : 'subtle'} />
        <StatTile label="Check-ins (90 days)" value={d.stats.check_ins_90d.toLocaleString('en-IN')} caption={active ? `${(d.stats.check_ins_90d / active / 13).toFixed(1)} per member / week` : ''} />
        <StatTile label="Cash collected (12 mo)" value={inr(d.stats.revenue_12m)} captionTone="success" caption="paid receipts" />
        <StatTile label="Cash due" value={inr(d.stats.cash_due)} captionTone={d.stats.cash_due ? 'warning' : 'subtle'} caption="unpaid memberships" />
      </div>

      <SegmentedControl aria-label="Section" value={tab} onChange={setTab} className="mb-4" options={[
        { value: 'overview', label: 'Overview' }, { value: 'members', label: `Members (${d.members.length})` }, { value: 'activity', label: 'Activity' },
        { value: 'money', label: 'Money & plans' }, { value: 'all', label: 'All data' },
      ]} />

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <Text variant="subtitle" className="mb-2">Gym</Text>
            {(['contact_person_name', 'contact_phone', 'contact_email', 'website_url', 'max_capacity', 'current_occupancy', 'is_24_hours', 'established_year'] as const).map(k => <Field key={k} label={k.replace(/_/g, ' ')}>{show(g[k])}</Field>)}
            <Field label="Rating">{g.rating_avg != null ? `${Number(g.rating_avg).toFixed(1)} ★ (${g.rating_count})` : '—'}</Field>
            {d.address ? (
              <Field label="Address">
                {[d.address.address_line1, d.address.area ?? d.address.locality, d.address.city, d.address.pincode].filter(Boolean).join(', ')}
                {d.address.latitude != null ? <a className="ml-2 inline-flex items-center gap-1 text-accent-text underline" href={mapsLink(Number(d.address.latitude), Number(d.address.longitude))} target="_blank" rel="noreferrer"><MapPin size={12} />map</a> : null}
              </Field>
            ) : null}
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Owner</Text>
            {d.owner ? (
              <>
                <Field label="Business">{show(d.owner.business_name)}</Field>
                <Field label="Verification"><StatusPill status={String(d.owner.verification_status)} /></Field>
                <Field label="GSTIN">{show(d.owner.gstin)}</Field>
                {d.owner_user ? <Field label="Account"><Link className="text-accent-text underline" to={`/admin/users/${d.owner_user.id}`}>{String(d.owner_user.phone)}</Link> · last access {when((d.owner_user.last_seen_at ?? d.owner_user.last_login_at) as string)}</Field> : null}
              </>
            ) : <Text tone="muted">No owner profile.</Text>}
            <Text variant="label" tone="subtle" className="mb-1 mt-4">Hours</Text>
            {d.hours.length ? d.hours.map(h => <Field key={String(h.id)} label={DAYS[Number(h.day_of_week)] ?? show(h.day_of_week)}>{h.is_closed ? 'Closed' : `${show(h.open_time)} – ${show(h.close_time)}`}</Field>) : <Text tone="muted">Not set.</Text>}
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Members by status</Text>
            {Object.entries(d.stats.members_by_status).map(([k, v]) => <Field key={k} label={k}>{v}</Field>)}
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Trainers</Text>
            {d.trainers.length ? d.trainers.map(t => <Field key={t.id} label={t.status ?? ''}><Link className="text-accent-text underline" to={`/admin/users/${t.user_id}`}>{t.name ?? 'Trainer'}</Link> · {t.verification}</Field>) : <Text tone="muted">No trainers linked.</Text>}
          </Card>
        </div>
      ) : null}

      {tab === 'members' ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {['', 'active', 'pending', 'expired', 'cancelled', 'unpaid'].map(f => (
              <Button key={f} size="sm" variant={memberFilter === f ? 'primary' : 'outline'} label={f || 'All'} onClick={() => setMemberFilter(f)} />
            ))}
          </div>
          <DataTable rows={members} rowKey={m => m.membership_id} onRowClick={m => navigate(`/admin/users/${m.user_id}`)} empty="No members." columns={[
            { key: 'n', label: 'Member', render: m => <><div className="font-semibold">{m.name || '—'}</div><div className="text-xs text-ink-subtle">{m.phone}</div></> },
            { key: 's', label: 'Status', render: m => <StatusPill status={m.status} /> },
            { key: 'p', label: 'Payment', render: m => <StatusPill status={m.payment_status} label={m.payment_status === 'unpaid' ? `cash due ${inr(m.amount)}` : m.payment_status} /> },
            { key: 'e', label: 'Ends', render: m => when(m.end, false) },
            { key: 'c', label: 'Check-ins', render: m => m.check_ins ?? 0 },
            { key: 'l', label: 'Last access', render: m => when(m.last_seen_at) },
          ]} />
        </>
      ) : null}

      {tab === 'activity' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <Text variant="subtitle" className="mb-2">Check-ins per day · last 90 days</Text>
            <LineChart label="Check-ins per day" points={fillSeries(d.checkin_days.map(x => ({ bucket: x.date, count: x.count })), 'day').map(x => ({ x: x.bucket.slice(5, 10), y: x.count }))} format={v => String(Math.round(v))} />
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Busiest hours (IST)</Text>
            <BarChart bars={Array.from({ length: 24 }, (_, h) => ({ label: h % 3 === 0 ? String(h) : '', value: d.peak_hours_ist.find(x => x.hour === h)?.count ?? 0, caption: `${h}:00` }))} height={110} />
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Churn risk</Text>
            {d.churn_risks.length ? d.churn_risks.slice(0, 10).map(c => (
              <Field key={String(c.id)} label={`${show(c.risk_level)} · ${show(c.churn_score)}`}><Link className="text-accent-text underline" to={`/admin/users/${c.user_id}`}>member</Link> · {inr(Number(c.estimated_revenue_at_risk ?? 0))} at risk</Field>
            )) : <Text tone="muted">No churn scores yet.</Text>}
          </Card>
          <Card className="lg:col-span-2">
            <Text variant="subtitle" className="mb-2">Reviews</Text>
            {d.reviews.length ? d.reviews.map(r => (
              <div key={String(r.id)} className="border-b border-border py-2 last:border-0">
                <Text variant="bodyStrong">{'★'.repeat(Number(r.rating))} {show(r.title)}</Text>
                <Text variant="footnote" tone="muted">{show(r.review)}</Text>
                {r.owner_response ? <Text variant="caption" tone="subtle">Owner: {show(r.owner_response)}</Text> : null}
              </div>
            )) : <Text tone="muted">No reviews.</Text>}
          </Card>
        </div>
      ) : null}

      {tab === 'money' ? (
        <div className="flex flex-col gap-4">
          <Card>
            <Text variant="subtitle" className="mb-2">Cash collected per month</Text>
            <BarChart bars={d.revenue_months.map(m => ({ label: m.month.slice(5, 7), value: m.amount, caption: `${m.receipts} receipts` }))} height={120} formatValue={v => inr(v)} />
          </Card>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Plans</Text>
            <DataTable rows={d.plans} rowKey={p => String(p.id)} empty="No plans." columns={[
              { key: 'n', label: 'Plan', render: p => String(p.name) },
              { key: 'd', label: 'Duration', render: p => `${show(p.duration_days)} days` },
              { key: 'p', label: 'Price', render: p => <>{inr(Number(p.discounted_price ?? p.price))}{p.discounted_price ? <span className="ml-1 text-xs text-ink-subtle line-through">{inr(Number(p.price))}</span> : null}</> },
              { key: 'a', label: 'Active', render: p => (p.is_active ? 'yes' : 'no') },
            ]} />
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Expenses</Text>
            <DataTable rows={d.expenses} rowKey={e => String(e.id)} empty="No expenses recorded." columns={[
              { key: 'd', label: 'Date', render: e => when(e.expense_date as string, false) },
              { key: 'c', label: 'Category', render: e => show(e.category) },
              { key: 'a', label: 'Amount', render: e => inr(Number(e.amount)) },
              { key: 'v', label: 'Vendor', render: e => show(e.vendor_name) },
            ]} />
          </section>
        </div>
      ) : null}

      {tab === 'all' ? (
        <DataTable rows={d.footprint} rowKey={f => `${f.table}.${f.column}`} onRowClick={f => navigate(`/admin/data/${f.table}?f=${encodeURIComponent(JSON.stringify([{ col: f.column, op: 'eq', value: id }]))}`)} columns={[
          { key: 't', label: 'Table', render: f => <span className="font-semibold">{f.table.replace(/_/g, ' ')}</span> },
          { key: 'g', label: 'Area', render: f => f.group },
          { key: 'c', label: 'Rows', render: f => f.count.toLocaleString('en-IN') },
          { key: 'l', label: 'Latest', render: f => when(f.last_at) },
          { key: 'x', label: '', render: () => <ExternalLink size={14} className="text-ink-subtle" aria-hidden /> },
        ]} />
      ) : null}
    </>
  );
}
