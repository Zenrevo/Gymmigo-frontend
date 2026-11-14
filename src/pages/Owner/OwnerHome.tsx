import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, ChevronRight, MapPin, Plus, Star } from 'lucide-react';
import { ownerApi } from '../../api/owner';
import { useAuth } from '../../context/AuthContext';
import GymOwnerInsights from '../../components/GymOwnerInsights';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, SectionHeader, SignatureCard, Skeleton, StatTile, Text } from '../../components/kit';
import { compactNumber, formatINRCompact, gymWarning, type OwnerGymItem } from './ownerFormat';

type Review = { id?: string; gym_id?: string; gym_name?: string; rating?: number; comment?: string; user_name?: string; created_at?: string };

/** Owner / manager home, mirroring the app's OwnerHome: portfolio stats, gyms, insights, recent reviews. */
export default function OwnerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.active_role === 'gym_owner';
  const firstName = user?.full_name?.split(' ')[0];

  const gymsQ = useQuery({
    queryKey: ['owner', 'gyms'],
    queryFn: async () => ((await ownerApi.listGyms()).data.data ?? []) as unknown as OwnerGymItem[],
  });
  const reviewsQ = useQuery({
    queryKey: ['owner', 'reviews'],
    enabled: isOwner,
    queryFn: async () => ((await ownerApi.ownerReviews()).data.data?.reviews ?? []).slice(0, 5) as Review[],
  });

  const gyms = gymsQ.data ?? [];
  const members = gyms.reduce((n, g) => n + (g.metrics?.active_members ?? 0), 0);
  const revenue = gyms.reduce((n, g) => n + (g.metrics?.monthly_revenue ?? 0), 0);

  const header = (
    <PageHeader
      eyebrow={isOwner ? 'Gym owner' : 'Gym manager'}
      title={firstName ? `Welcome back, ${firstName}` : 'Your gyms'}
      subtitle={isOwner ? 'Your portfolio at a glance: members, revenue and what needs you today.' : 'Gyms you help run.'}
      actions={isOwner ? <Button label="Add gym" icon={Plus} to="/app/gym-owner/add-gym" size="sm" /> : undefined}
    />
  );

  if (gymsQ.isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-gm-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-gm-xl" />
      </div>
    );
  }
  if (gymsQ.isError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState title="Couldn't load your gyms" onRetry={() => gymsQ.refetch()} />
      </div>
    );
  }

  if (!gyms.length) {
    return (
      <div className="space-y-6">
        {header}
        {isOwner ? (
          <SignatureCard>
            <div className="relative max-w-xl space-y-3">
              <Badge label="Step 1" tone="accent" />
              <Text variant="display" className="text-white">List your first gym</Text>
              <Text className="text-white/75">
                Add your gym's details, plans and location. Members can then find you, buy passes and check in with your QR code.
              </Text>
              <Button label="List your gym" icon={Plus} to="/app/gym-owner/add-gym" className="mt-2" />
            </div>
          </SignatureCard>
        ) : (
          <EmptyState icon={Building2} title="No gyms assigned yet" message="Ask the gym owner to add you to their team, then refresh this page." onAction={() => gymsQ.refetch()} actionLabel="Refresh" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Gyms" value={String(gyms.length)} caption="listed" />
        <StatTile label="Members" value={compactNumber(members)} caption="active" />
        <StatTile label="Revenue" value={formatINRCompact(revenue)} caption="this month" emphasis />
      </div>

      <section className="space-y-3">
        <SectionHeader label={isOwner ? 'Your gyms' : 'Assigned gyms'} meta={isOwner ? '+ Add gym' : undefined} onMeta={isOwner ? () => navigate('/app/gym-owner/add-gym') : undefined} />
        <div className="grid gap-3 lg:grid-cols-2">
          {gyms.map(item => (
            <GymCard key={item.gym.id} item={item} onOpen={() => navigate(`/app/gym-owner/gyms/${item.gym.id}`)} />
          ))}
        </div>
      </section>

      <GymOwnerInsights gyms={gyms} />

      {isOwner && (reviewsQ.data?.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <SectionHeader label="Recent reviews" />
          <Card padding="none" className="divide-y divide-border overflow-hidden">
            {reviewsQ.data!.map((r, i) => (
              <button
                key={r.id ?? i}
                type="button"
                onClick={() => r.gym_id && navigate(`/app/gym-owner/gyms/${r.gym_id}/reviews`)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-raised">
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                  <Star size={12} className="fill-current" aria-hidden /> {r.rating ?? '–'}
                </span>
                <span className="min-w-0 flex-1">
                  <Text variant="callout" truncate>{r.comment || 'No written comment'}</Text>
                  <Text variant="caption" tone="subtle" truncate>
                    {[r.user_name, r.gym_name].filter(Boolean).join(' · ')}
                  </Text>
                </span>
                <ChevronRight size={16} className="mt-1 text-ink-subtle" aria-hidden />
              </button>
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function GymCard({ item, onOpen }: { item: OwnerGymItem; onOpen: () => void }) {
  const { gym, metrics } = item;
  const warning = gymWarning(gym);
  const city = gym.addresses?.[0]?.city ?? gym.city;
  return (
    <Card padding="none" onClick={onOpen} className="overflow-hidden" aria-label={`Open ${gym.name}`}>
      <div className="flex gap-4 p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-gm-lg bg-surface-sunken">
          {gym.logo_url || gym.cover_image_url ? (
            <img src={gym.logo_url || gym.cover_image_url || undefined} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-accent-text">
              <Building2 size={24} aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Text variant="title" truncate>{gym.name}</Text>
          {city ? (
            <Text variant="caption" tone="muted" className="flex items-center gap-1">
              <MapPin size={12} aria-hidden /> {city}
            </Text>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <Badge label={gym.is_verified ? 'Verified' : 'Unverified'} tone={gym.is_verified ? 'info' : 'warning'} />
            <Badge label={gym.is_active === false ? 'Inactive' : 'Active'} tone={gym.is_active === false ? 'danger' : 'success'} />
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-ink-subtle" aria-hidden />
      </div>
      <div className="grid grid-cols-3 border-t border-border bg-surface-raised">
        <Metric label="Members" value={String(metrics?.active_members ?? 0)} />
        <Metric label="Revenue" value={formatINRCompact(metrics?.monthly_revenue ?? 0)} />
        <Metric label="Occupancy" value={gym.max_capacity ? `${metrics?.current_occupancy ?? 0}/${gym.max_capacity}` : String(metrics?.current_occupancy ?? 0)} />
      </div>
      {warning ? (
        <div className="flex items-center gap-2 border-t border-border bg-warning-soft px-4 py-2.5 text-warning">
          <AlertTriangle size={14} aria-hidden />
          <Text variant="caption" className="text-warning">{warning}</Text>
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <Text variant="labelSm" tone="subtle">{label}</Text>
      <Text variant="subtitle">{value}</Text>
    </div>
  );
}
