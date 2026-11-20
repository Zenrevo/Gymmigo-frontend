import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CircleCheck, RefreshCw } from 'lucide-react';
import { Card, ErrorState, Skeleton, StatTile, Text } from '../../components/kit';
import { adminGet } from '../api';
import { LineChart } from '../charts';
import { inr, when } from '../format';
import { useAdmin } from '../useAdmin';
import { DataTable, PageTitle } from '../ui';

type LiveData = {
  generated_at: string;
  people: { online_now: number; active_today: number; wau: number; mau: number; signups_today: number; total: number; in_gyms_now: number; live_run_rooms: number | null; dau_30d: { date: string; users: number }[] };
  business: { check_ins_today: number; membership_requests_today: number; membership_requests_pending: number; trainer_requests_pending: number; gym_cash_today: number; trainer_cash_today: number; gym_cash_due: number };
  ai: { runs_today: number; failed_today: number; tokens_today: number; guardrails_today: number; unhelpful_today: number; blocked_today: number; error_rate_1h: number | null };
  system: {
    requests: number; requests_last_5m: number; rpm_last_5m: number; errors_5xx: number; errors_5xx_last_5m: number; errors_4xx: number;
    p50_ms: number | null; p95_ms: number | null; p99_ms: number | null; per_minute: number[]; errors_per_minute: number[]; db_ping_ms: number;
    recent_errors: { at: string; path: string; method: string; status: number; request_id: string | null; ms: number }[];
  };
  alerts: { level: 'danger' | 'warning'; title: string; message: string }[];
};

const n = (v: number) => v.toLocaleString('en-IN');

/** Live: what's happening on Gymmigo right now. Refreshes every 30 seconds. */
export default function Live() {
  const { admin, can } = useAdmin();
  const q = useQuery({ queryKey: ['admin', 'live'], queryFn: () => adminGet<LiveData>('/monitor/live'), refetchInterval: 30_000, refetchIntervalInBackground: false });
  const d = q.data;
  return (
    <>
      <PageTitle
        title={`Live${admin?.full_name ? ` · ${admin.full_name.split(' ')[0]}` : ''}`}
        subtitle={d ? <span className="inline-flex items-center gap-2"><RefreshCw size={14} className={q.isFetching ? 'animate-spin' : ''} aria-hidden />Updated {when(d.generated_at)} · refreshes every 30 s</span> : 'Loading…'}
      />
      {q.isLoading ? <Skeleton className="h-96" rounded="xl" /> : q.isError || !d ? <ErrorState onRetry={() => q.refetch()} /> : (
        <div className="flex flex-col gap-5">
          {d.alerts.length ? (
            <div className="flex flex-col gap-2" role="alert">
              {d.alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-gm-lg border p-3 ${a.level === 'danger' ? 'border-danger/40 bg-danger-soft text-danger' : 'border-warning/40 bg-warning-soft text-warning'}`}>
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                  <div><p className="font-semibold">{a.title}</p><p className="text-sm">{a.message}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-gm-lg border border-success/30 bg-success-soft p-3 text-success"><CircleCheck size={18} aria-hidden /><span className="text-sm font-semibold">All systems normal</span></div>
          )}

          <section>
            <Text variant="label" tone="subtle" className="mb-2">People</Text>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Online now" value={n(d.people.online_now)} caption="active in the last 15 min" emphasis />
              <StatTile label="Active today" value={n(d.people.active_today)} caption={`${n(d.people.signups_today)} new sign-ups`} />
              <StatTile label="In gyms now" value={n(d.people.in_gyms_now)} caption={d.people.live_run_rooms != null ? `${d.people.live_run_rooms} live run rooms` : 'checked in'} />
              <StatTile label="Weekly / monthly active" value={`${n(d.people.wau)} / ${n(d.people.mau)}`} caption={`of ${n(d.people.total)} members`} />
            </div>
            <Card className="mt-3">
              <Text variant="subtitle" className="mb-2">Daily active members · 30 days</Text>
              <LineChart label="Daily active members" points={d.people.dau_30d.map(x => ({ x: x.date.slice(5), y: x.users }))} format={v => String(Math.round(v))} />
            </Card>
          </section>

          <section>
            <Text variant="label" tone="subtle" className="mb-2">Business today</Text>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Check-ins" value={n(d.business.check_ins_today)} />
              <StatTile label="Cash collected" value={inr(d.business.gym_cash_today + d.business.trainer_cash_today)} caption={`gyms ${inr(d.business.gym_cash_today)} · trainers ${inr(d.business.trainer_cash_today)}`} captionTone="success" />
              <Link to="/admin/memberships?status=pending"><StatTile label="Membership requests" value={n(d.business.membership_requests_pending)} caption={`${d.business.membership_requests_today} new today`} captionTone={d.business.membership_requests_pending ? 'warning' : 'subtle'} /></Link>
              <Link to="/admin/bookings?status=pending"><StatTile label="Trainer requests" value={n(d.business.trainer_requests_pending)} caption={`gym cash due ${inr(d.business.gym_cash_due)}`} captionTone={d.business.trainer_requests_pending ? 'warning' : 'subtle'} /></Link>
            </div>
          </section>

          {can('ai.view') ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-2">AI today</Text>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Link to="/admin/ai"><StatTile label="AI runs" value={n(d.ai.runs_today)} caption={`${n(d.ai.tokens_today)} tokens`} /></Link>
                <StatTile label="Failed / fallback" value={n(d.ai.failed_today)} caption={d.ai.error_rate_1h != null ? `${d.ai.error_rate_1h}% in the last hour` : 'no runs in the last hour'} captionTone={d.ai.failed_today ? 'danger' : 'subtle'} />
                <StatTile label="Guardrail hits" value={n(d.ai.guardrails_today)} caption={`${n(d.ai.blocked_today)} blocked`} />
                <StatTile label="Rated not helpful" value={n(d.ai.unhelpful_today)} captionTone={d.ai.unhelpful_today ? 'warning' : 'subtle'} />
              </div>
            </section>
          ) : null}

          <section>
            <Text variant="label" tone="subtle" className="mb-2">System (this server, last 60 minutes)</Text>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Requests / min" value={String(d.system.rpm_last_5m)} caption={`${n(d.system.requests)} in the last hour`} />
              <StatTile label="Server errors" value={n(d.system.errors_5xx)} caption={`${d.system.errors_5xx_last_5m} in the last 5 min · ${n(d.system.errors_4xx)} client errors`} captionTone={d.system.errors_5xx ? 'danger' : 'subtle'} />
              <StatTile label="Response time p95" value={d.system.p95_ms != null ? `${Math.round(d.system.p95_ms)} ms` : '—'} caption={`p50 ${d.system.p50_ms ?? '—'} · p99 ${d.system.p99_ms ?? '—'} ms`} />
              <StatTile label="Database ping" value={`${d.system.db_ping_ms} ms`} captionTone={d.system.db_ping_ms > 200 ? 'warning' : 'success'} caption={d.system.db_ping_ms > 200 ? 'slow' : 'healthy'} />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <Card><Text variant="subtitle" className="mb-2">Requests per minute</Text><LineChart label="Requests per minute" height={90} points={d.system.per_minute.map((v, i) => ({ x: `${60 - i} min ago`, y: v }))} format={v => `${Math.round(v)}/min`} /></Card>
              <Card><Text variant="subtitle" className="mb-2">Server errors per minute</Text><LineChart label="Server errors per minute" height={90} points={d.system.errors_per_minute.map((v, i) => ({ x: `${60 - i} min ago`, y: v }))} format={v => `${Math.round(v)} errors`} /></Card>
            </div>
            {d.system.recent_errors.length ? (
              <div className="mt-3">
                <Text variant="label" tone="subtle" className="mb-2">Recent server errors</Text>
                <DataTable rows={d.system.recent_errors} rowKey={e => `${e.at}${e.request_id}`} columns={[
                  { key: 't', label: 'When', render: e => when(e.at) },
                  { key: 'p', label: 'Request', render: e => <code className="text-xs">{e.method} {e.path}</code> },
                  { key: 's', label: 'Status', render: e => e.status },
                  { key: 'r', label: 'Request id', render: e => <code className="text-xs">{e.request_id?.slice(0, 12) ?? '—'}</code> },
                ]} />
              </div>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}
