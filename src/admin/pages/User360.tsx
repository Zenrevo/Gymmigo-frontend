import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, Settings2 } from 'lucide-react';
import { Badge, BarChart, Button, Card, ErrorState, SegmentedControl, Skeleton, StatTile, Text } from '../../components/kit';
import { adminError, adminGet } from '../api';
import { JsonView, LineChart, RouteMap } from '../charts';
import { inr, mapsLink, when } from '../format';
import { DataTable, Field, StatusPill } from '../ui';
import { useAdmin } from '../useAdmin';
import { ActionButton } from '../ActionSheet';
import { EditAll } from '../EditAll';
import { RecentChanges } from '../RecentChanges';
import { AiPanel, TrainerPanel, type TrainerBlock } from './MemberPanels';
import { ActivityList } from './ApiActivity';

type Row = Record<string, unknown>;
type U360 = {
  user: Row; profile: Row | null; fitness_profile: Row | null; trainer_profile: Row | null; owner_profile: Row | null;
  access: { last_seen_at: string | null; last_seen_client: string | null; last_seen_ip: string | null; last_login_at: string | null; active_sessions: number; last_session_at: string | null; devices: Row[]; last_activity: { table: string; last_at: string | null } | null };
  location: {
    addresses: Row[];
    runs: { id: string; started_at: string | null; activity_type: string; distance_m: number | null; duration_s: number | null; pace: number | null; calories: number | null; title: string | null; route: [number, number][] | null; flagged: boolean }[];
    live_points: { lat: number; lng: number; at: string }[];
    check_ins: { id: string; gym_id: string; gym: string; in: string | null; out: string | null; minutes: number | null; method: string | null; workout: string | null; lat: number | null; lng: number | null }[];
  };
  fitness: { health: Row[]; run_months: { month: string; runs: number; km: number }[]; run_totals: { runs: number; km: number; hours: number; kcal: number }; checkin_weeks: { week: string; count: number }[] };
  memberships: { id: string; gym_id: string; gym: string; plan: string | null; status: string; payment_status: string; amount: number; start: string | null; end: string | null; check_ins: number | null }[];
  trainer_bookings: Row[]; wallet: Row | null; wallet_transactions: Row[]; clubs: Row[];
  ai: { runs: number; tokens: number; last_at: string | null; rated_unhelpful: number; chat_messages: number; last_chat_at: string | null };
  ai_control: Row | null; ai_programs: Row[]; ai_recommendations: Row[]; ai_memories: Row[]; trainer: TrainerBlock | null;
  social: { following: number | null; followers: number | null };
  footprint: { table: string; column: string; group: string; count: number; last_at: string | null }[];
};
type Tab = 'overview' | 'location' | 'fitness' | 'money' | 'trainer' | 'ai' | 'activity' | 'all';

const ago = (iso?: string | null) => {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
};
const km = (m?: number | null) => (m == null ? '—' : `${(m / 1000).toFixed(2)} km`);
const dur = (s?: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const pace = (s?: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /km` : '—');
const show = (v: unknown) => (v == null || v === '' ? '—' : Array.isArray(v) ? (v.length ? v.join(', ') : '—') : typeof v === 'object' ? JSON.stringify(v) : String(v));

export default function User360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAdmin();
  const [tab, setTab] = useState<Tab>('overview');
  const [route, setRoute] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['admin', 'user360', id], queryFn: () => adminGet<U360>(`/data/users/${id}`) });
  const d = q.data;
  if (q.isLoading) return <Skeleton className="h-96" rounded="xl" />;
  if (q.isError || !d) return <ErrorState message={adminError(q.error).message} onRetry={() => q.refetch()} />;
  const name = (d.profile?.full_name as string) || (d.user.phone as string);
  const status = d.user.is_banned ? 'banned' : d.user.is_active ? 'active' : 'deactivated';
  const health = d.fitness.health;
  const hx = (r: Row) => String(r.date).slice(5);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
        <div className="min-w-0 flex-1">
          <Text variant="h1" as="h1" truncate>{name}</Text>
          <Text tone="muted">{String(d.user.phone)} · {(d.user.roles as string[]).join(', ')} · joined {when(d.user.created_at as string, false)}</Text>
        </div>
        <StatusPill status={status} />
        {can('users.view') ? <Button size="sm" variant="secondary" icon={Settings2} label="Status & roles" to={`/admin/users?open=${id}`} /> : null}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Last access" value={ago(d.access.last_seen_at ?? d.access.last_login_at)} caption={d.access.last_seen_client ?? (d.access.last_seen_at ? '' : 'from last sign-in')} />
        <StatTile label="Runs" value={String(d.fitness.run_totals.runs)} caption={`${d.fitness.run_totals.km} km · ${d.fitness.run_totals.hours} h`} />
        <StatTile label="Gym check-ins" value={String(d.location.check_ins.length)} caption={d.location.check_ins[0] ? `last ${ago(d.location.check_ins[0].in)}` : 'none yet'} />
        <StatTile label="Migo AI" value={String(d.ai.chat_messages)} caption={`messages · ${d.ai.tokens.toLocaleString('en-IN')} tokens`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton entity="member" entityId={id!} op="profile.update" label="Edit profile" initial={d.profile} variant="secondary" />
        <ActionButton entity="member" entityId={id!} op="fitness.update" label="Edit fitness profile" initial={d.fitness_profile} variant="secondary" />
        <ActionButton entity="member" entityId={id!} op="phone.change" label="Change phone" />
        <ActionButton entity="member" entityId={id!} op="wallet.adjust" label="Wallet credit / debit" initial={{ direction: 'credit' }} />
        <ActionButton entity="member" entityId={id!} op="account.delete" label="Delete account" variant="danger" />
      </div>

      <SegmentedControl aria-label="Section" value={tab} onChange={setTab} className="mb-4" options={[
        { value: 'overview', label: 'Overview' }, { value: 'location', label: 'Location' }, { value: 'fitness', label: 'Fitness' },
        { value: 'money', label: 'Gyms & money' }, ...(d.trainer ? [{ value: 'trainer' as Tab, label: (d.user.roles as string[]).includes('trainer') ? 'Trainer' : 'Trainer (role removed)' }] : []),
        { value: 'ai', label: 'Migo AI' }, ...(can('audit.view') ? [{ value: 'activity' as Tab, label: 'API activity' }] : []), { value: 'all', label: 'All data' },
      ]} />

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Access</Text>{d.user ? <EditAll table="users" row={d.user} /> : null}</div>
            <Field label="Last access">{d.access.last_seen_at ? `${when(d.access.last_seen_at)} (${ago(d.access.last_seen_at)})` : '—'}</Field>
            <Field label="Client">{d.access.last_seen_client}</Field>
            <Field label="IP address">{d.access.last_seen_ip}</Field>
            <Field label="Last sign-in (OTP)">{when(d.access.last_login_at)}</Field>
            <Field label="Signed-in sessions">{d.access.active_sessions}</Field>
            <Field label="Latest activity">{d.access.last_activity ? `${d.access.last_activity.table.replace(/_/g, ' ')} · ${when(d.access.last_activity.last_at)}` : '—'}</Field>
            <Field label="Devices (push)">{d.access.devices.length ? d.access.devices.map(x => `${x.platform}${x.is_active ? '' : ' (off)'}`).join(', ') : '—'}</Field>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Profile</Text>{d.profile ? <EditAll table="personal_profiles" row={d.profile} /> : null}</div>
            {d.profile ? (['full_name', 'username', 'gender', 'date_of_birth', 'email', 'city', 'bio'] as const).map(k => <Field key={k} label={k.replace(/_/g, ' ')}>{show(d.profile![k])}</Field>) : <Text tone="muted">No profile.</Text>}
            <Field label="Social">{d.social.followers ?? 0} followers · {d.social.following ?? 0} following</Field>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Fitness profile</Text>{d.fitness_profile ? <EditAll table="user_fitness_profiles" row={d.fitness_profile} /> : null}</div>
            {d.fitness_profile ? (['primary_goal', 'activity_level', 'experience_level', 'height', 'current_weight', 'target_weight', 'workout_days_per_week', 'preferred_workout_duration', 'dietary_preference', 'food_allergies', 'injuries', 'medical_conditions', 'training_style'] as const)
              .map(k => <Field key={k} label={k.replace(/_/g, ' ')}>{show(d.fitness_profile![k])}</Field>) : <Text tone="muted">Not set up.</Text>}
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Roles</Text>
            {d.trainer_profile ? (
              <Field label={(d.user.roles as string[]).includes('trainer') ? 'Trainer' : 'Trainer (role removed)'}>
                <StatusPill status={String(d.trainer_profile.verification_status)} /> {show(d.trainer_profile.experience_years)} yrs <EditAll table="trainer_profiles" row={d.trainer_profile} />
              </Field>
            ) : null}
            {d.owner_profile ? (
              <Field label={(d.user.roles as string[]).includes('gym_owner') ? 'Gym owner' : 'Gym owner (role removed)'}>
                <StatusPill status={String(d.owner_profile.verification_status)} /> {show(d.owner_profile.business_name)} <EditAll table="gym_owner_profiles" row={d.owner_profile} />
              </Field>
            ) : null}
            {(d.user.roles as string[]).includes('gym_owner') ? <div className="mt-2"><ActionButton entity="member" entityId={id!} op="gym.create" label="+ Create a gym for this owner" mode="create" /></div> : null}
            <Field label="Migo AI">{d.ai.chat_messages} messages · last {ago(d.ai.last_chat_at)} · {d.ai.rated_unhelpful} rated not helpful</Field>
            {d.fitness_profile?.ai_memory_summary ? <><Text variant="label" tone="subtle" className="mt-3">Migo's memory</Text><Text variant="footnote" className="mt-1 whitespace-pre-line">{String(d.fitness_profile.ai_memory_summary)}</Text></> : null}
          </Card>
        </div>
      ) : null}

      {tab === 'overview' ? <div className="mt-4"><RecentChanges targetId={id!} /></div> : null}

      {tab === 'location' ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Runs, live tracking and gyms</Text>{route ? <Button size="sm" variant="ghost" label="Show all" onClick={() => setRoute(null)} /> : null}</div>
            <RouteMap
              selected={route}
              onSelect={setRoute}
              tracks={[
                ...d.location.runs.filter(r => r.route?.length).map(r => ({ id: r.id, points: r.route!, label: `${when(r.started_at)} · ${km(r.distance_m)}` })),
                ...(d.location.live_points.length > 1 ? [{ id: 'live', points: d.location.live_points.map(p => [p.lng, p.lat] as [number, number]).reverse(), label: 'Live run-room points', color: 'var(--gm-success, #16a34a)' }] : []),
              ]}
              pins={[
                ...[...new Map(d.location.check_ins.filter(c => c.lat != null).map(c => [c.gym_id, { lat: c.lat!, lng: c.lng!, label: c.gym }])).values()],
                ...d.location.addresses.filter(a => a.latitude != null).map(a => ({ lat: Number(a.latitude), lng: Number(a.longitude), label: String(a.label || 'Saved address') })),
              ]}
            />
          </Card>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Runs ({d.location.runs.length})</Text>
            <DataTable rows={d.location.runs} rowKey={r => r.id} onRowClick={r => setRoute(r.id)} empty="No runs." columns={[
              { key: 'w', label: 'When', render: r => when(r.started_at) },
              { key: 't', label: 'Type', render: r => <>{r.activity_type}{r.flagged ? <Badge label="distance flagged" tone="warning" className="ml-1" /> : null}</> },
              { key: 'd', label: 'Distance', render: r => km(r.distance_m) },
              { key: 'u', label: 'Time', render: r => dur(r.duration_s) },
              { key: 'p', label: 'Pace', render: r => pace(r.pace) },
              { key: 'g', label: 'GPS', render: r => (r.route?.length ? `${r.route.length} pts` : 'none') },
            ]} />
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Gym check-ins ({d.location.check_ins.length})</Text>
            <DataTable rows={d.location.check_ins} rowKey={c => c.id} empty="No check-ins." columns={[
              { key: 'g', label: 'Gym', render: c => <Link className="text-accent-text underline" to={`/admin/gyms/${c.gym_id}`}>{c.gym}</Link> },
              { key: 'i', label: 'In', render: c => when(c.in) },
              { key: 'o', label: 'Out', render: c => (c.out ? when(c.out) : 'still in') },
              { key: 'm', label: 'Minutes', render: c => c.minutes ?? '—' },
              { key: 'w', label: 'Workout', render: c => c.workout || '—' },
              { key: 'h', label: 'How', render: c => c.method || '—' },
            ]} />
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Saved addresses</Text>
            {d.location.addresses.length ? d.location.addresses.map(a => (
              <Card key={String(a.id)} variant="sunken" className="mb-2">
                <div className="flex items-start justify-between gap-3">
                  <Text>{[a.label, a.address_line1, a.address_line2, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</Text>
                  {a.latitude != null ? <Button size="sm" variant="ghost" icon={MapPin} label="Map" href={mapsLink(Number(a.latitude), Number(a.longitude))} target="_blank" /> : null}
                </div>
              </Card>
            )) : <Text tone="muted">No saved addresses.</Text>}
          </section>
        </div>
      ) : null}

      {tab === 'fitness' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ['Steps', 'steps', (v: number) => Math.round(v).toLocaleString('en-IN')],
            ['Weight (kg)', 'weight_kg', (v: number) => v.toFixed(1)],
            ['Sleep (hours)', 'sleep_hours', (v: number) => v.toFixed(1)],
            ['Resting heart rate', 'resting_heart_rate', (v: number) => `${Math.round(v)} bpm`],
            ['Active minutes', 'active_minutes', (v: number) => String(Math.round(v))],
            ['Calories burned', 'calories_burned', (v: number) => Math.round(v).toLocaleString('en-IN')],
          ].map(([title, key, fmt]) => (
            <Card key={key as string}>
              <Text variant="subtitle" className="mb-2">{title as string} <span className="text-xs font-normal text-ink-subtle">· last 180 days</span></Text>
              <LineChart label={title as string} points={health.map(r => ({ x: hx(r), y: r[key as string] == null ? null : Number(r[key as string]) }))} format={fmt as (v: number) => string} />
            </Card>
          ))}
          <Card>
            <Text variant="subtitle" className="mb-2">Running per month (km)</Text>
            <BarChart bars={d.fitness.run_months.map(m => ({ label: m.month.slice(5, 7), value: m.km, caption: `${m.runs} runs` }))} height={110} formatValue={v => `${v} km`} />
          </Card>
          <Card>
            <Text variant="subtitle" className="mb-2">Gym check-ins per week</Text>
            <BarChart bars={d.fitness.checkin_weeks.map(w => ({ label: '', value: w.count, caption: w.week }))} height={110} />
          </Card>
        </div>
      ) : null}

      {tab === 'money' ? (
        <div className="flex flex-col gap-4">
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Gym memberships</Text>
            <DataTable rows={d.memberships} rowKey={m => m.id} empty="No memberships." columns={[
              { key: 'g', label: 'Gym', render: m => m.gym },
              { key: 'p', label: 'Plan', render: m => m.plan ?? '—' },
              { key: 'd', label: 'Dates', render: m => `${when(m.start, false)} → ${when(m.end, false)}` },
              { key: 'a', label: 'Amount', render: m => inr(m.amount) },
              { key: 'ps', label: 'Payment', render: m => <StatusPill status={m.payment_status} /> },
              { key: 's', label: 'Status', render: m => <StatusPill status={m.status} /> },
              { key: 'x', label: '', render: m => (
                <div className="flex flex-wrap justify-end gap-1">
                  {m.status === 'pending' ? <ActionButton entity="gym" entityId={m.gym_id} op="member.accept" itemId={m.id} label="Accept" variant="primary" initial={{ received: false }} /> : null}
                  <ActionButton entity="gym" entityId={m.gym_id} op="member.payment" itemId={m.id} label="Payment" initial={{ received: m.payment_status !== 'paid', amount: m.amount }} />
                  <ActionButton entity="gym" entityId={m.gym_id} op="member.edit" itemId={m.id} label="Edit" initial={{ start_date: m.start, end_date: m.end, amount_paid: m.amount, status: m.status }} />
                  {['active', 'pending'].includes(m.status) ? <ActionButton entity="gym" entityId={m.gym_id} op="member.cancel" itemId={m.id} label="Cancel" variant="danger" /> : null}
                </div>
              ) },
            ]} />
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Trainer plans</Text>
            <DataTable rows={d.trainer_bookings} rowKey={b => String(b.id)} empty="No trainer plans." columns={[
              { key: 's', label: 'Start', render: b => when(b.start_date as string, false) },
              { key: 'n', label: 'Sessions', render: b => `${b.sessions_completed}/${b.total_sessions}` },
              { key: 'a', label: 'Amount', render: b => inr(Number(b.total_amount)) },
              { key: 'p', label: 'Payment', render: b => <StatusPill status={String(b.payment_status)} /> },
              { key: 't', label: 'Status', render: b => <StatusPill status={String(b.status)} /> },
            ]} />
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <Text variant="subtitle" className="mb-2">Wallet</Text>
              {d.wallet ? <><Field label="Balance">{inr(Number(d.wallet.balance_inr))}</Field><Field label="Earned">{inr(Number(d.wallet.lifetime_earned_inr))}</Field><Field label="Spent">{inr(Number(d.wallet.lifetime_spent_inr))}</Field></> : <Text tone="muted">No wallet.</Text>}
              {d.wallet_transactions.slice(0, 10).map(t => (
                <Field key={String(t.id)} label={when(t.created_at as string)}>
                  {show(t.description ?? t.transaction_type)} · {t.direction === 'debit' ? '−' : '+'}{inr(Number(t.amount_inr))}
                </Field>
              ))}
            </Card>
            <Card>
              <Text variant="subtitle" className="mb-2">Clubs</Text>
              {d.clubs.length ? d.clubs.map(c => (
                <Field key={String(c.id)} label={c.is_active ? 'Active' : 'Left'}>{show(c.club_name ?? c.club_code)} · joined {when(c.joined_at as string, false)}</Field>
              )) : <Text tone="muted">Not in any club.</Text>}
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'trainer' && d.trainer ? <TrainerPanel uid={id!} t={d.trainer} /> : null}
      {tab === 'ai' ? (
        <AiPanel uid={id!} ai={{ control: d.ai_control, programs: d.ai_programs, recommendations: d.ai_recommendations, memories: d.ai_memories,
          memorySummary: (d.fitness_profile?.ai_memory_summary as string | null) ?? null, stats: d.ai }} />
      ) : null}

      {tab === 'activity' ? <ActivityList actorId={id!} compact /> : null}

      {tab === 'all' ? (
        <section>
          <Text tone="muted" className="mb-3">Every table that references this member. Open one to browse, filter, analyse or export those rows.</Text>
          <DataTable rows={d.footprint} rowKey={f => `${f.table}.${f.column}`} onRowClick={f => navigate(`/admin/data/${f.table}?f=${encodeURIComponent(JSON.stringify([{ col: f.column, op: 'eq', value: id }]))}`)} columns={[
            { key: 't', label: 'Table', render: f => <span className="font-semibold">{f.table.replace(/_/g, ' ')}</span> },
            { key: 'g', label: 'Area', render: f => f.group },
            { key: 'c', label: 'Rows', render: f => f.count.toLocaleString('en-IN') },
            { key: 'l', label: 'Latest', render: f => when(f.last_at) },
            { key: 'x', label: '', render: () => <ExternalLink size={14} className="text-ink-subtle" aria-hidden /> },
          ]} />
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-ink-muted">Raw account record</summary>
            <JsonView value={d.user} />
          </details>
        </section>
      ) : null}
    </>
  );
}
