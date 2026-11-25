import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Card, Chip, ErrorState, PageHeader, Skeleton, StatTile, Text } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { inr, ownerSuite, type AnalyticsRange } from '../../../../api/ownerSuite';
import { Row } from './Row';
import { RANGES, toBars } from './shared';

const SOURCE: Record<string, string> = { membership: 'Memberships', pos: 'Desk sales', pt: 'Personal training', manual: 'Other bills' };
const LEVELS = ['Starter', 'Consistent', 'Committed', 'Athlete', 'Elite', 'Champion', 'Legend', 'Immortal'];
const short = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`);

/** Gym analytics: money collected, dues, members and retention, attendance, clubs, PT and products. */
export default function AnalyticsTab() {
  const { gymId } = useGym();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const q = useQuery({ queryKey: ['owner', gymId, 'analytics', range], queryFn: () => ownerSuite.analytics(gymId!, range), enabled: !!gymId });
  const a = q.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Money collected, members, attendance, clubs and PT." />
      <div className="flex flex-wrap gap-2">{RANGES.map(r => <Chip key={r.value} label={r.label} selected={range === r.value} onClick={() => setRange(r.value)} />)}</div>
      {q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !a ? <Skeleton className="h-96" /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Collected" value={inr(a.revenue.collected)} caption={`profit ${inr(a.revenue.profit)}`} emphasis />
            <StatTile label="Due now" value={inr(a.revenue.dues)} caption={a.revenue.overdue ? `${inr(a.revenue.overdue)} overdue` : 'none overdue'} captionTone={a.revenue.overdue ? 'danger' : 'subtle'} />
            <StatTile label="Active members" value={a.members.active} caption={`+${a.members.new} new · ${a.members.renewals} renewed`} />
            <StatTile label="Churned" value={a.members.churned} caption={a.members.churn_rate_pct != null ? `${a.members.churn_rate_pct}% churn` : '—'} captionTone={(a.members.churn_rate_pct ?? 0) > 10 ? 'danger' : 'subtle'} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="lg" className="space-y-3">
              <Text variant="title">Money collected</Text>
              <BarChart bars={toBars(a.revenue.series)} formatValue={short} ariaLabel="Money collected per day" />
              {Object.entries(a.revenue.by_source).map(([k, v]) => <Row key={k} label={SOURCE[k] ?? k} value={inr(v)} />)}
              <Row label="Expenses" value={`− ${inr(a.revenue.expenses)}`} />
            </Card>
            <Card padding="lg" className="space-y-3">
              <Text variant="title">Check-ins</Text>
              <BarChart bars={toBars(a.attendance.series)} ariaLabel="Check-ins per day" />
              <Row label="Check-ins" value={`${a.attendance.check_ins} by ${a.attendance.unique_visitors} people`} />
              <Row label="Visits per active member" value={a.attendance.avg_visits_per_active ?? '—'} />
              <Row label="Average visit" value={a.attendance.avg_minutes ? `${a.attendance.avg_minutes} min` : '—'} />
            </Card>
            <Card padding="lg" className="space-y-3">
              <Text variant="title">Busiest hours</Text>
              <BarChart bars={a.attendance.by_hour.map(h => ({ label: String(h.hour % 12 || 12), value: h.value }))} height={110} ariaLabel="Check-ins by hour" />
              <BarChart bars={a.attendance.by_weekday.map(d => ({ label: d.day, value: d.value }))} height={90} ariaLabel="Check-ins by weekday" />
            </Card>
            <Card padding="lg" className="space-y-2">
              <Text variant="title">Still active, by month they joined</Text>
              {a.members.cohorts.map(c => <Row key={c.month} label={`${new Date(`${c.month}-01`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · ${c.joined} joined`} value={c.retention_pct != null ? `${c.retention_pct}%` : '—'} />)}
            </Card>
            <Card padding="lg" className="space-y-3">
              <Text variant="title">Clubs</Text>
              <BarChart bars={a.clubs.members_by_level.map(l => ({ label: `L${l.level}`, value: l.members }))} height={100} ariaLabel="Members by club level" />
              <Row label="Average performance index" value={a.clubs.avg_gcpi ?? '—'} />
              <Row label="Core missions done" value={a.clubs.mission_completion_pct != null ? `${a.clubs.mission_completion_pct}% (${a.clubs.missions_done}/${a.clubs.missions_issued})` : '—'} />
              <Row label="Top level reached" value={(() => { const t = [...a.clubs.members_by_level].reverse().find(l => l.members); return t ? LEVELS[t.level - 1] : '—'; })()} />
            </Card>
            <Card padding="lg" className="space-y-2">
              <Text variant="title">Personal training & products</Text>
              <Row label="Active PT allocations" value={a.pt.active_allocations} />
              <Row label="Sessions used / sold" value={`${a.pt.sessions_used} / ${a.pt.sessions_sold}${a.pt.utilisation_pct != null ? ` (${a.pt.utilisation_pct}%)` : ''}`} />
              <Row label="PT sessions in this period" value={a.pt.sessions_in_range} />
              {a.top_products.map(p => <Row key={p.name} label={`${p.name} × ${p.qty}`} value={inr(p.amount)} />)}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
