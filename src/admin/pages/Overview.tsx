import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BarChart, Card, ErrorState, Skeleton, StatTile, Text } from '../../components/kit';
import { adminGet } from '../api';
import { useAdmin } from '../useAdmin';
import { inr } from '../format';
import { PageTitle } from '../ui';

type OverviewData = {
  users: { total: number; new_7d: number; new_30d: number; banned: number; deactivated: number; trainers: number; gym_owners: number; active_7d: number };
  gyms: { total: number; verified: number; inactive: number };
  queues: { trainer_verifications: number; owner_verifications: number; membership_requests: number; booking_requests: number; club_transfers: number };
  memberships: { active: number; pending: number };
  bookings: { pending: number; confirmed: number };
  cash: { gym_collected_30d: number; trainer_collected_30d: number; gym_due: number; trainer_due: number };
  signups_30d: { date: string; count: number }[];
};

export default function Overview() {
  const { admin, can } = useAdmin();
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: () => adminGet<OverviewData>('/overview') });
  const d = q.data;

  return (
    <>
      <PageTitle title={`Hello${admin?.full_name ? `, ${admin.full_name.split(' ')[0]}` : ''}`} subtitle="Everything happening on Gymmigo right now." />
      {q.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" rounded="xl" />)}</div>
      ) : q.isError || !d ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Needs attention">
            <Text variant="label" tone="subtle" className="mb-2">Needs attention</Text>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Trainer verifications', n: d.queues.trainer_verifications, to: '/admin/verifications?kind=trainer', perm: 'verification.manage' },
                { label: 'Gym owner verifications', n: d.queues.owner_verifications, to: '/admin/verifications?kind=gym_owner', perm: 'verification.manage' },
                { label: 'Membership requests', n: d.queues.membership_requests, to: '/admin/memberships?status=pending', perm: 'memberships.view' },
                { label: 'Trainer requests', n: d.queues.booking_requests, to: '/admin/bookings?status=pending', perm: 'bookings.view' },
                { label: 'Club transfers', n: d.queues.club_transfers, to: '/admin/club-transfers', perm: 'clubs.manage' },
              ].filter(x => can(x.perm)).map(x => (
                <Link key={x.label} to={x.to} className="group flex items-center justify-between gap-3 rounded-gm-xl border border-border bg-surface p-4 shadow-card hover:border-accent-border">
                  <span>
                    <span className={x.n ? 'block text-2xl font-bold text-warning' : 'block text-2xl font-bold text-ink'}>{x.n}</span>
                    <span className="text-xs text-ink-muted">{x.label}</span>
                  </span>
                  <ArrowRight size={16} className="text-ink-subtle group-hover:text-accent-text" aria-hidden />
                </Link>
              ))}
            </div>
          </section>

          <section aria-label="Users" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Users" value={d.users.total.toLocaleString('en-IN')} caption={`+${d.users.new_7d} this week`} />
            <StatTile label="Active (7 days)" value={d.users.active_7d.toLocaleString('en-IN')} caption="signed in" />
            <StatTile label="Trainers" value={d.users.trainers.toLocaleString('en-IN')} caption="with the trainer role" />
            <StatTile label="Gym owners" value={d.users.gym_owners.toLocaleString('en-IN')} caption={`${d.gyms.total} gyms · ${d.gyms.verified} verified`} />
          </section>

          {can('payments.view') ? (
            <section aria-label="Cash" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Gym cash (30d)" value={inr(d.cash.gym_collected_30d)} caption="collected at desks" captionTone="success" />
              <StatTile label="Trainer cash (30d)" value={inr(d.cash.trainer_collected_30d)} caption="collected by trainers" captionTone="success" />
              <StatTile label="Gym cash due" value={inr(d.cash.gym_due)} caption="unpaid memberships" captionTone="warning" />
              <StatTile label="Trainer cash due" value={inr(d.cash.trainer_due)} caption="accepted, unpaid" captionTone="warning" />
            </section>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <Text variant="subtitle">Sign-ups, last 30 days</Text>
              <Text variant="caption" tone="subtle">{d.users.new_30d} new users</Text>
              <BarChart
                className="mt-4"
                ariaLabel="Daily sign-ups"
                bars={last30(d.signups_30d).map((s, i, all) => ({
                  label: i % 5 === 0 || i === all.length - 1 ? String(s.day) : '',
                  value: s.count,
                  highlight: i === all.length - 1,
                }))}
              />
            </Card>
            <Card>
              <Text variant="subtitle">Health</Text>
              <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-ink-muted">Active memberships</dt><dd className="text-right font-semibold">{d.memberships.active}</dd>
                <dt className="text-ink-muted">Active trainer plans</dt><dd className="text-right font-semibold">{d.bookings.confirmed}</dd>
                <dt className="text-ink-muted">Inactive gyms</dt><dd className="text-right font-semibold">{d.gyms.inactive}</dd>
                <dt className="text-ink-muted">Banned users</dt><dd className="text-right font-semibold">{d.users.banned}</dd>
                <dt className="text-ink-muted">Deactivated</dt><dd className="text-right font-semibold">{d.users.deactivated}</dd>
              </dl>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

/** The API lists only days with sign-ups; show all 30 days, zeros included. */
function last30(rows: { date: string; count: number }[]) {
  const byDay = new Map(rows.map(r => [r.date, r.count]));
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { day: d.getUTCDate(), count: byDay.get(key) ?? 0 };
  });
}
