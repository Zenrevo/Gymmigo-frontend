import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Text } from '../../components/kit';
import { ActionButton, ActionSheet } from '../ActionSheet';
import { EditAll } from '../EditAll';
import { inr, when } from '../format';
import { DataTable, Field, StatusPill } from '../ui';

type Row = Record<string, unknown>;
const show = (v: unknown) => (v == null || v === '' ? '—' : Array.isArray(v) ? (v.length ? v.join(', ') : '—') : typeof v === 'object' ? JSON.stringify(v) : String(v));

export type TrainerBlock = {
  profile: Row; packages: Row[]; specializations: Row[]; certifications: Row[]; availability: Row[];
  bookings: { id: string; member_id: string; member: string | null; phone: string; status: string; payment_status: string; total_amount: number; amount_paid: number; sessions: string; sessions_remaining: number; start_date: string | null; created_at: string | null }[];
};

/** Trainer side of a member who is also a trainer: profile, pricing, packages, bookings — all editable. */
export function TrainerPanel({ uid, t }: { uid: string; t: TrainerBlock }) {
  const [sheet, setSheet] = useState<{ op: string; item?: string; initial?: Row | null; title?: string; mode?: 'edit' | 'create' } | null>(null);
  const p = t.profile;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Trainer profile</Text>
            <div className="flex gap-2">
              <ActionButton entity="trainer" entityId={uid} op="profile.update" label="Edit" initial={p} />
              <ActionButton entity="trainer" entityId={uid} op="professional.update" label="Experience" initial={p} />
              <EditAll table="trainer_profiles" row={p} label="All fields" />
            </div>
          </div>
          <Field label="Verification"><StatusPill status={String(p.verification_status)} /></Field>
          {(['experience_years', 'experience_level', 'languages_spoken', 'location_address', 'is_available', 'is_available_online', 'is_available_offline', 'accepts_home_visits', 'travel_distance_km'] as const).map(k => <Field key={k} label={k.replace(/_/g, ' ')}>{show(p[k])}</Field>)}
          <div className="mt-2"><ActionButton entity="trainer" entityId={uid} op="flags.update" label="Availability flags" initial={p} /></div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Pricing</Text><ActionButton entity="trainer" entityId={uid} op="pricing.update" label="Edit" initial={p} /></div>
          {(['hourly_rate', 'single_session_charges', 'monthly_charges', 'session_duration_mins', 'charges_negotiable'] as const).map(k => <Field key={k} label={k.replace(/_/g, ' ')}>{show(p[k])}</Field>)}
          <Text variant="label" tone="subtle" className="mb-1 mt-4">Specializations</Text>
          <div className="flex flex-wrap items-center gap-2">
            {t.specializations.map(s => (
              <button key={String(s.id)} onClick={() => setSheet({ op: 'specialization.delete', item: String(s.id), title: `Remove ${show(s.name ?? s.specialization)}?` })}
                className="rounded-full border border-border px-3 py-1 text-xs hover:border-danger hover:text-danger">{show(s.name ?? s.specialization)} ✕</button>
            ))}
            <ActionButton entity="trainer" entityId={uid} op="specialization.add" label="+ Add" mode="create" />
          </div>
        </Card>
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between"><Text variant="label" tone="subtle">Packages ({t.packages.length})</Text>
          <ActionButton entity="trainer" entityId={uid} op="package.create" label="+ New package" mode="create" /></div>
        <DataTable rows={t.packages} rowKey={r => String(r.id)} empty="No packages." columns={[
          { key: 'n', label: 'Package', render: r => <><div className="font-semibold">{show(r.name)}</div><div className="text-xs text-ink-subtle">{show(r.total_sessions)} sessions · {show(r.validity_days)} days</div></> },
          { key: 'p', label: 'Price', render: r => <>{inr(Number(r.discounted_price ?? r.price))}{r.discounted_price ? <span className="ml-1 text-xs text-ink-subtle line-through">{inr(Number(r.price))}</span> : null}</> },
          { key: 'a', label: 'Active', render: r => (r.is_active ? 'yes' : 'no') },
          { key: 'x', label: '', render: r => (
            <div className="flex justify-end gap-1">
              <ActionButton entity="trainer" entityId={uid} op="package.update" itemId={String(r.id)} initial={r} label="Edit" />
              <EditAll table="trainer_packages" row={r} label="All fields" />
              <ActionButton entity="trainer" entityId={uid} op="package.delete" itemId={String(r.id)} label="Delete" variant="danger" title={`Delete ${show(r.name)}?`} />
            </div>
          ) },
        ]} />
      </section>
      <section>
        <Text variant="label" tone="subtle" className="mb-2">Clients & bookings ({t.bookings.length})</Text>
        <DataTable rows={t.bookings} rowKey={b => b.id} empty="No bookings." columns={[
          { key: 'm', label: 'Client', render: b => <Link className="text-accent-text underline" to={`/admin/users/${b.member_id}`}>{b.member || b.phone}</Link> },
          { key: 's', label: 'Status', render: b => <StatusPill status={b.status} label={b.status === 'pending' ? 'requested' : b.status} /> },
          { key: 'p', label: 'Payment', render: b => <><StatusPill status={b.payment_status} /> <span className="text-xs">{inr(b.total_amount)}</span></> },
          { key: 'n', label: 'Sessions', render: b => `${b.sessions} · ${b.sessions_remaining} left` },
          { key: 'x', label: '', render: b => (
            <div className="flex flex-wrap justify-end gap-1">
              {b.status === 'pending' ? (
                <>
                  <ActionButton entity="trainer" entityId={uid} op="booking.accept" itemId={b.id} label="Accept" variant="primary" />
                  <ActionButton entity="trainer" entityId={uid} op="booking.reject" itemId={b.id} label="Decline" variant="danger" />
                </>
              ) : null}
              {['confirmed', 'completed'].includes(b.status) ? <ActionButton entity="trainer" entityId={uid} op="booking.payment" itemId={b.id} label="Payment" initial={{ received: b.payment_status !== 'paid', amount: b.total_amount }} /> : null}
              <ActionButton entity="trainer" entityId={uid} op="booking.sessions" itemId={b.id} label="Sessions" />
              <EditAll table="trainer_bookings" row={{ id: b.id }} label="All fields" />
            </div>
          ) },
        ]} />
      </section>
      {sheet ? <ActionSheet entity="trainer" entityId={uid} op={sheet.op} itemId={sheet.item} initial={sheet.initial} title={sheet.title} mode={sheet.mode} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

export type AiBlock = { control: Row | null; programs: Row[]; recommendations: Row[]; memories: Row[]; memorySummary: string | null; stats: { runs: number; tokens: number; chat_messages: number; last_chat_at: string | null; rated_unhelpful: number } };

/** Migo for one member: access, memory, AI plans. */
export function AiPanel({ uid, ai }: { uid: string; ai: AiBlock }) {
  const c = ai.control;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">AI access</Text>
            <ActionButton entity="member" entityId={uid} op="ai.control" label="Change" initial={{ ai_blocked: c?.ai_blocked ?? false, daily_limit: c?.daily_limit ?? null, note: c?.note ?? '' }} /></div>
          <Field label="Migo">{c?.ai_blocked ? <StatusPill status="banned" label="blocked" /> : <StatusPill status="active" label="allowed" />}</Field>
          <Field label="Daily limit">{c?.daily_limit != null ? String(c.daily_limit) : 'Platform default'}</Field>
          <Field label="Note">{show(c?.note)}</Field>
          <Field label="Usage">{ai.stats.chat_messages} messages · {ai.stats.runs} AI runs · {ai.stats.tokens.toLocaleString('en-IN')} tokens</Field>
          <Field label="Last chat">{when(ai.stats.last_chat_at)}</Field>
          <Field label="Rated not helpful">{ai.stats.rated_unhelpful}</Field>
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between"><Text variant="subtitle">Migo's memory</Text>
            <div className="flex gap-2">
              <ActionButton entity="member" entityId={uid} op="ai.memory.set" label="Edit" initial={{ summary: ai.memorySummary ?? '' }} />
              <ActionButton entity="member" entityId={uid} op="ai.memory.clear" label="Clear" variant="danger" />
            </div>
          </div>
          <Text variant="footnote" className="whitespace-pre-line">{ai.memorySummary || 'Nothing remembered yet.'}</Text>
          {ai.memories.length ? <Text variant="caption" tone="subtle" className="mt-2">{ai.memories.length} stored memory items</Text> : null}
        </Card>
      </div>
      <section>
        <Text variant="label" tone="subtle" className="mb-2">AI plans ({ai.programs.length})</Text>
        <DataTable rows={ai.programs} rowKey={r => String(r.id)} empty="No AI plans." columns={[
          { key: 't', label: 'Plan', render: r => <><div className="font-semibold">{show(r.title)}</div><div className="text-xs text-ink-subtle">{show(r.kind)} · {show(r.duration_days)} days</div></> },
          { key: 's', label: 'Status', render: r => <StatusPill status={String(r.status)} /> },
          { key: 'd', label: 'Starts', render: r => when(r.start_date as string, false) },
          { key: 'x', label: '', render: r => (
            <div className="flex justify-end gap-1">
              {r.status === 'draft' ? <ActionButton entity="member" entityId={uid} op="program.regenerate" itemId={String(r.id)} label="Regenerate" /> : null}
              {['draft', 'active'].includes(String(r.status)) ? <ActionButton entity="member" entityId={uid} op="program.cancel" itemId={String(r.id)} label={r.status === 'draft' ? 'Delete' : 'Cancel'} variant="danger" /> : null}
            </div>
          ) },
        ]} />
      </section>
      <section>
        <Text variant="label" tone="subtle" className="mb-2">Daily AI plans ({ai.recommendations.length} latest)</Text>
        <DataTable rows={ai.recommendations} rowKey={r => String(r.id)} empty="No AI workouts or meal plans." columns={[
          { key: 'd', label: 'Date', render: r => when(r.date_for as string, false) },
          { key: 't', label: 'Plan', render: r => <><div className="font-semibold">{show(r.title)}</div><div className="text-xs text-ink-subtle">{show(r.type)}{r.is_completed ? ' · done' : ''}</div></> },
          { key: 'x', label: '', render: r => (
            <div className="flex justify-end gap-1">
              <ActionButton entity="member" entityId={uid} op="recommendation.edit" itemId={String(r.id)} initial={r} label="Edit" />
              <ActionButton entity="member" entityId={uid} op="recommendation.delete" itemId={String(r.id)} label="Delete" variant="danger" />
            </div>
          ) },
        ]} />
      </section>
    </div>
  );
}
