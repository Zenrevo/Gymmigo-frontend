import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Lock, LockOpen } from 'lucide-react';
import { Badge, Button, Card, ErrorState, SegmentedControl, Skeleton, StatTile, Text } from '../../components/kit';
import { adminGet, adminPost } from '../api';
import { inr, when } from '../format';
import { DataTable, PageTitle, PromptDialog, SearchBox, Select, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';

type GymRow = {
  gym_id: string; name: string; city: string | null; gym_active: boolean; verified: boolean; has_program: boolean; enabled: boolean; owner_locked: boolean;
  coins_enabled: boolean; budget_inr: number | null; used_inr: number; used_pct: number | null; claims_month: number; members: number; rewards: number;
  open_claims: number; coins_outstanding: number; updated_by: string | null; updated_at: string | null;
};
type Totals = { gyms: number; with_budget: number; over_budget: number; locked: number; disabled: number; budget_inr: number; used_inr: number; open_claims: number; coins_outstanding: number; members: number };
type Overview = { totals: Totals; gyms: GymRow[]; total: number };
type Claim = {
  id: string; code: string; status: string; reward: string | null; gym: string; gym_id: string; phone: string | null; user_id: string; level: number;
  coins_spent: number; est_cost_inr: number; created_at: string | null; expires_at: string | null; redeemed_at: string | null; redeemed_by: string | null;
};
type Show = 'all' | 'over_budget' | 'locked' | 'disabled' | 'no_budget' | 'has_claims';
type ClaimStatus = 'issued' | 'redeemed' | 'cancelled' | 'expired' | 'all';

/** Club programs across every gym: budgets and how much is used, owner locks, open claims and coins. */
export default function Clubs() {
  const [view, setView] = useState<'gyms' | 'claims'>('gyms');
  return (
    <>
      <PageTitle title="Clubs across gyms" subtitle="Each gym's reward budget and usage, owner locks, reward claims and Gym Coins. Levels and points follow the club template." />
      <SegmentedControl aria-label="View" value={view} onChange={setView} className="mb-4" options={[{ value: 'gyms', label: 'Gym programs' }, { value: 'claims', label: 'Reward claims' }]} />
      {view === 'gyms' ? <Programs /> : <Claims />}
    </>
  );
}

function BudgetBar({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const w = Math.min(100, pct);
  const tone = pct >= 100 ? 'bg-danger' : pct >= 75 ? 'bg-warning' : 'bg-success';
  return <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-surface-sunken"><div className={`h-full ${tone}`} style={{ width: `${w}%` }} /></div>;
}

function Programs() {
  const navigate = useNavigate();
  const { run, busy } = useAdminAction();
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('all');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState<boolean | null>(null);
  const data = useQuery({ queryKey: ['admin', 'clubs-gyms', q, show], queryFn: () => adminGet<Overview>('/clubs/gyms', { q, show }) });
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const t = data.data?.totals;
  const rows = data.data?.gyms ?? [];
  const allPicked = rows.length > 0 && rows.every(r => picked.has(r.gym_id));
  return (
    <>
      {t ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Reward budgets this month" value={inr(t.budget_inr)} caption={`${inr(t.used_inr)} used · ${t.with_budget} of ${t.gyms} gyms have one`} emphasis />
          <StatTile label="Over budget" value={String(t.over_budget)} caption="gyms at or past 100%" captionTone={t.over_budget ? 'danger' : 'subtle'} />
          <StatTile label="Open claims" value={String(t.open_claims)} caption={`${t.members} club members`} />
          <StatTile label="Gym Coins outstanding" value={t.coins_outstanding.toLocaleString('en-IN')} caption={`${t.locked} locked · ${t.disabled} switched off`} />
        </div>
      ) : null}
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Gym name or city" />
        <Select label="Show" value={show} onChange={setShow} options={[
          { value: 'all', label: 'All gyms' }, { value: 'over_budget', label: 'Over budget' }, { value: 'has_claims', label: 'Open claims' },
          { value: 'locked', label: 'Owner locked' }, { value: 'no_budget', label: 'No budget set' }, { value: 'disabled', label: 'Clubs switched off' },
        ]} />
      </Toolbar>
      {picked.size ? (
        <Card variant="sunken" className="mb-3 flex flex-wrap items-center gap-2">
          <Text variant="bodyStrong" className="mr-auto">{picked.size} selected</Text>
          <Button size="sm" icon={Lock} onClick={() => setLock(true)}>Lock owner changes</Button>
          <Button size="sm" variant="secondary" icon={LockOpen} onClick={() => setLock(false)}>Unlock</Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
        </Card>
      ) : null}
      {data.isLoading ? <Skeleton className="h-64" rounded="xl" /> : data.isError ? <ErrorState onRetry={() => data.refetch()} /> : (
        <DataTable rows={rows} rowKey={r => r.gym_id} onRowClick={r => navigate(`/admin/gyms/${r.gym_id}?tab=clubs`)} empty="No gyms match." columns={[
          { key: 'pick', label: '', className: 'w-8', render: r => (
            <input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.has(r.gym_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(r.gym_id)} />
          ) },
          { key: 'gym', label: 'Gym', render: r => (
            <div><Text variant="bodyStrong">{r.name}</Text><Text variant="caption" tone="subtle">{r.city ?? '—'}{!r.gym_active ? ' · inactive' : ''}</Text></div>
          ) },
          { key: 'budget', label: 'Budget used (month)', render: r => r.budget_inr ? (
            <div><Text variant="footnote">{inr(r.used_inr)} / {inr(r.budget_inr)} · {r.used_pct}%</Text><BudgetBar pct={r.used_pct} /></div>
          ) : <Text variant="caption" tone="subtle">{r.used_inr ? `${inr(r.used_inr)} · no budget` : 'No budget'}</Text> },
          { key: 'members', label: 'Members', render: r => r.members },
          { key: 'rewards', label: 'Rewards', render: r => r.rewards },
          { key: 'claims', label: 'Open claims', render: r => r.open_claims ? <Badge tone="warning" label={String(r.open_claims)} /> : '0' },
          { key: 'coins', label: 'Coins out', render: r => r.coins_outstanding.toLocaleString('en-IN') },
          { key: 'state', label: 'State', render: r => (
            <div className="flex flex-wrap gap-1">
              {!r.enabled ? <Badge tone="neutral" label="Off" /> : null}
              {r.owner_locked ? <Badge tone="danger" label="Locked" /> : null}
              {!r.coins_enabled ? <Badge tone="neutral" label="No coins" /> : null}
              {r.enabled && !r.owner_locked && r.coins_enabled ? <Text variant="caption" tone="subtle">{r.updated_by ? `by ${r.updated_by}` : 'Default'}</Text> : null}
            </div>
          ) },
        ]} />
      )}
      {rows.length ? (
        <div className="mt-2 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => setPicked(allPicked ? new Set() : new Set(rows.map(r => r.gym_id)))}>{allPicked ? 'Select none' : `Select all ${rows.length}`}</Button>
          {data.data && data.data.total > rows.length ? <Text variant="caption" tone="subtle">Showing {rows.length} of {data.data.total}: search to narrow.</Text> : null}
        </div>
      ) : null}
      <PromptDialog
        open={lock !== null}
        tone={lock ? 'warning' : 'default'}
        title={lock ? `Lock ${picked.size} gym(s)?` : `Unlock ${picked.size} gym(s)?`}
        message={lock ? 'Owners can no longer change their reward budget or coin settings. Members are not affected.' : 'Owners can edit their budget and coin settings again.'}
        label="Reason (for the audit log)"
        required={false}
        confirmLabel={lock ? 'Lock' : 'Unlock'}
        onCancel={() => setLock(null)}
        onConfirm={async reason => {
          if (lock === null || busy) return;
          if (await run('lock', () => adminPost('/clubs/gyms/lock', { gym_ids: [...picked], owner_locked: lock, reason: reason || undefined }), lock ? 'Owner changes locked' : 'Unlocked', ['clubs-gyms'])) {
            setLock(null);
            setPicked(new Set());
          }
        }}
      />
    </>
  );
}

function Claims() {
  const navigate = useNavigate();
  const { run } = useAdminAction();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ClaimStatus>('issued');
  const [act, setAct] = useState<{ c: Claim; action: 'redeem' | 'cancel' } | null>(null);
  const data = useQuery({
    queryKey: ['admin', 'clubs-claims', q, status],
    queryFn: () => adminGet<{ items: Claim[]; has_more: boolean }>('/clubs/redemptions', { q, status: status === 'all' ? undefined : status }),
  });
  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Code, reward or member phone" />
        <Select label="Status" value={status} onChange={setStatus} options={[
          { value: 'issued', label: 'Open' }, { value: 'expired', label: 'Expired (not used)' }, { value: 'redeemed', label: 'Honoured' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'all', label: 'All' },
        ]} />
      </Toolbar>
      {data.isLoading ? <Skeleton className="h-64" rounded="xl" /> : data.isError || !data.data ? <ErrorState onRetry={() => data.refetch()} /> : (
        <>
          <DataTable rows={data.data.items} rowKey={c => c.id} empty="No claims match." columns={[
            { key: 'reward', label: 'Reward', render: c => <div><Text variant="bodyStrong">{c.reward ?? '—'}</Text><Text variant="caption" tone="subtle" className="font-mono">{c.code} · L{c.level}</Text></div> },
            { key: 'gym', label: 'Gym', render: c => <button type="button" className="text-left hover:underline" onClick={() => navigate(`/admin/gyms/${c.gym_id}?tab=clubs`)}>{c.gym}</button> },
            { key: 'member', label: 'Member', render: c => <button type="button" className="text-left hover:underline" onClick={() => navigate(`/admin/users/${c.user_id}`)}>{c.phone ?? 'Member'}</button> },
            { key: 'cost', label: 'Cost', render: c => <div>{inr(c.est_cost_inr)}{c.coins_spent ? <Text variant="caption" tone="subtle">{c.coins_spent} coins</Text> : null}</div> },
            { key: 'when', label: 'Claimed', render: c => <div>{when(c.created_at, false)}{c.status === 'issued' && c.expires_at ? <Text variant="caption" tone="subtle">expires {when(c.expires_at, false)}</Text> : null}</div> },
            { key: 'status', label: 'Status', render: c => (
              <Badge tone={c.status === 'redeemed' ? 'success' : c.status === 'issued' ? 'warning' : c.status === 'expired' ? 'danger' : 'neutral'}
                label={c.status === 'redeemed' ? `Honoured${c.redeemed_by ? ` · ${c.redeemed_by.split(':')[0]}` : ''}` : c.status === 'issued' ? 'Open' : c.status} />
            ) },
            { key: 'act', label: '', render: c => c.status === 'issued' || c.status === 'expired' ? (
              <div className="flex gap-1">
                {c.status === 'issued' ? <Button size="sm" onClick={() => setAct({ c, action: 'redeem' })}>Honour</Button> : null}
                <Button size="sm" variant="secondary" onClick={() => setAct({ c, action: 'cancel' })}>Cancel</Button>
              </div>
            ) : null },
          ]} />
          {data.data.has_more ? <Text variant="caption" tone="subtle" className="mt-2">Showing the latest 100: search to narrow.</Text> : null}
        </>
      )}
      <PromptDialog
        open={!!act}
        tone={act?.action === 'cancel' ? 'danger' : 'default'}
        title={act?.action === 'redeem' ? `Mark ${act.c.code} honoured?` : `Cancel ${act?.c.code ?? ''}?`}
        message={act?.action === 'cancel' ? (act.c.coins_spent ? `${act.c.coins_spent} Gym Coins go back to the member.` : 'The reward slot is released.') : 'Use when the gym gave the reward but did not mark it.'}
        label="Reason (for the audit log)"
        confirmLabel={act?.action === 'redeem' ? 'Mark honoured' : 'Cancel claim'}
        onCancel={() => setAct(null)}
        onConfirm={async reason => {
          if (act && (await run('claim', () => adminPost(`/clubs/redemptions/${act.c.id}`, { action: act.action, reason }), act.action === 'redeem' ? 'Claim honoured' : 'Claim cancelled', ['clubs-claims', 'clubs-gyms']))) setAct(null);
        }}
      />
    </>
  );
}
