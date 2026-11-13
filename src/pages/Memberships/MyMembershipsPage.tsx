import { useMemo, useState } from 'react';
import { Building2, CreditCard } from 'lucide-react';
import { AppBar, Badge, Button, Card, EmptyState, ErrorState, SegmentedControl, Skeleton, Text, type Tone } from '../../components/kit';
import { useMyMemberships } from '../../hooks/useProfileQueries';
import MembershipDetailView from '../Dashboard/MembershipDetailView';

/* eslint-disable @typescript-eslint/no-explicit-any -- membership payloads are untyped */

const STATUS_TONE: Record<string, Tone> = { active: 'success', pending: 'warning', expired: 'neutral', cancelled: 'danger', rejected: 'danger' };
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** My memberships: active and past passes, grouped by gym, with renew and details (GET /memberships/my). */
export default function MyMembershipsPage() {
  const q = useMyMemberships();
  const [view, setView] = useState<'active' | 'past'>('active');
  const [open, setOpen] = useState<any>(null);
  const [now] = useState(() => Date.now());

  const groups = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of (q.data ?? []) as any[]) {
      const g = (map[m.gym_id] ??= { gym_id: m.gym_id, gym_name: m.gym_name, gym_logo_url: m.gym_logo_url, current_occupancy: m.current_occupancy, max_capacity: m.max_capacity, memberships: [] });
      g.memberships.push(m);
    }
    return Object.values(map);
  }, [q.data]);
  const isActive = (m: any) => m.status === 'active' || m.status === 'pending';
  const shown = groups.filter(g => (view === 'active' ? g.memberships.some(isActive) : g.memberships.every((m: any) => !isActive(m))));

  if (open) return <MembershipDetailView gymGroup={open} onBack={() => setOpen(null)} />;

  return (
    <div className="mx-auto w-full max-w-[880px] pb-10">
      <AppBar backTo="/app/profile" caption="MY MEMBERSHIPS" />
      <div className="mt-2 flex flex-col gap-5">
        <Text variant="h1">My memberships</Text>
        <SegmentedControl<'active' | 'past'>
          aria-label="Memberships"
          value={view}
          onChange={setView}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'past', label: 'Past' },
          ]}
        />
        {q.isLoading ? (
          <Skeleton className="h-36 rounded-gm-xl" />
        ) : q.isError ? (
          <ErrorState onRetry={() => q.refetch()} />
        ) : !shown.length ? (
          <EmptyState
            icon={CreditCard}
            title={view === 'active' ? 'No active pass' : 'No past memberships'}
            message={view === 'active' ? 'Find a gym near you and pick a plan.' : 'Expired and cancelled passes show up here.'}
            actionLabel={view === 'active' ? 'Explore gyms' : undefined}
            actionTo={view === 'active' ? '/app/discovery' : undefined}
          />
        ) : (
          <div className="flex flex-col gap-3" data-testid="memberships-list">
            {shown.map(g => {
              const latest = [...g.memberships].sort((a: any, b: any) => String(b.end_date).localeCompare(String(a.end_date)))[0];
              const left = latest?.end_date ? Math.ceil((new Date(latest.end_date).getTime() - now) / 86_400_000) : null;
              return (
                <Card key={g.gym_id} padding="lg">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-gm-md bg-surface-sunken">
                      {g.gym_logo_url ? <img src={g.gym_logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 size={20} className="text-accent" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Text variant="title" className="truncate">
                        {g.gym_name || 'Gym'}
                      </Text>
                      <Text variant="caption" tone="subtle">
                        {g.memberships.length} pass{g.memberships.length > 1 ? 'es' : ''} · {view === 'active' ? `valid until ${fmt(latest?.end_date)}` : `ended ${fmt(latest?.end_date)}`}
                      </Text>
                    </div>
                    {view === 'active' && left != null ? <Badge label={left > 0 ? `${left}d left` : 'Ends today'} tone={left <= 7 ? 'warning' : 'accent'} /> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.memberships.map((m: any) => (
                      <Badge key={m.id} label={`${m.plan_name || 'Plan'} · ${m.status}`} tone={STATUS_TONE[m.status] ?? 'neutral'} />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button label="Details" variant="secondary" size="md" onClick={() => setOpen(g)} />
                    <Button label={view === 'active' ? 'Renew pass' : 'Rejoin'} size="md" to={`/app/gyms/${g.gym_id}?tab=plans`} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
