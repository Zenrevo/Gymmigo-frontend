import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, Skeleton, Text, TextField, Toggle } from '../../components/kit';
import { RewardEditor, type RewardRow } from '../../components/clubs/RewardEditor';
import { adminDelete, adminError, adminGet, adminPatch, adminPost, adminPut } from '../api';
import { when } from '../format';
import { DataTable, Field, StatusPill } from '../ui';
import { useAdmin } from '../useAdmin';

type Program = {
  enabled: boolean; gym_coins_enabled: boolean; coin_ceilings: Record<string, number | null>; cashback_pct: Record<string, number | null>;
  coin_expiry_days: number | null; coin_invoice_cap_pct: number | null; monthly_reward_budget_inr: number | null; budget_alerts: number[];
  no_cash_cost_only: boolean; owner_locked: boolean; notes: string | null; updated_by: string | null; updated_at: string | null;
  template_limits: { coin_ceilings: Record<string, number>; cashback_pct: Record<string, number>; coin_invoice_cap_pct: number; coin_expiry_days: number; gym_coins_platform_enabled: boolean };
};
type GymClubs = {
  program: Program; rewards: RewardRow[]; levels: { level: number; name: string; threshold: number }[];
  summary: { members_by_level: { level: number; name: string; members: number }[]; retention: Record<string, number>;
    coins: { issued: number; redeemed: number; expired: number; reversed: number; outstanding: number; expiring_30d: number };
    rewards_this_month: { claims: number; committed_cost_inr: number; redeemed_cost_inr: number; budget_inr: number | null; budget_used_pct: number | null; alerts_hit: number[] } };
  redemptions: { id: string; code: string; status: string; reward: string; user_id: string; created_at: string; est_cost_inr: number; coins_spent: number }[];
  members: { user_id: string; phone: string | null; level: number; active_cp: number; gcpi: number | null; multiplier: number; review: string; retention: string; shields: number; active: boolean }[];
};

/** Gym 360 → Clubs: this gym's program (within the template), rewards, redemptions, members by level. */
export function ClubsGymPanel({ gymId }: { gymId: string }) {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const key = ['admin', 'gym-clubs', gymId];
  const q = useQuery({ queryKey: key, queryFn: () => adminGet<GymClubs>(`/clubs/gyms/${gymId}`) });
  const [p, setP] = useState<Program | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (q.isLoading) return <Skeleton className="h-64" rounded="xl" />;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  const prog = p ?? d.program;
  const edit = can('clubs.manage');
  const lim = d.program.template_limits;
  const cell = 'w-full rounded-gm-md border border-border bg-surface px-2 py-1 text-sm';
  const setLevel = (f: 'coin_ceilings' | 'cashback_pct', lvl: string, v: string) => setP({ ...prog, [f]: { ...prog[f], [lvl]: v === '' ? null : Number(v) } });
  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await adminPut(`/clubs/gyms/${gymId}/program`, { enabled: prog.enabled, gym_coins_enabled: prog.gym_coins_enabled, coin_ceilings: prog.coin_ceilings, cashback_pct: prog.cashback_pct,
        coin_expiry_days: prog.coin_expiry_days, coin_invoice_cap_pct: prog.coin_invoice_cap_pct, monthly_reward_budget_inr: prog.monthly_reward_budget_inr,
        no_cash_cost_only: prog.no_cash_cost_only, owner_locked: prog.owner_locked, notes: prog.notes });
      setMsg({ ok: true, text: 'Program saved.' });
      setP(null);
      await qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      setMsg({ ok: false, text: adminError(e).message });
    } finally {
      setBusy(false);
    }
  };
  const saveReward = async (body: Record<string, unknown>, id?: string) => {
    try {
      await (id ? adminPatch(`/clubs/rewards/${id}`, body) : adminPost(`/clubs/gyms/${gymId}/rewards`, body));
      await qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      throw new Error(adminError(e).message);
    }
  };
  const s = d.summary;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <Text variant="label" tone="subtle">Members by level</Text>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-sm">{s.members_by_level.map(l => <div key={l.level} className="rounded-gm-md bg-surface-sunken p-1"><div className="font-semibold">{l.members}</div><div className="text-[11px] text-ink-subtle">{l.name}</div></div>)}</div>
          <Text variant="caption" tone="subtle" className="mt-2">Retention: {Object.entries(s.retention).map(([k, v]) => `${k.replace('_', ' ')} ${v}`).join(' · ')}</Text>
        </Card>
        <Card>
          <Text variant="label" tone="subtle">Gym Coins (liability)</Text>
          <Text variant="title">{s.coins.outstanding} outstanding = ₹{s.coins.outstanding}</Text>
          <Text variant="caption" tone="subtle">{s.coins.issued} issued · {s.coins.redeemed} redeemed · {s.coins.expired} expired · {s.coins.reversed} reversed · {s.coins.expiring_30d} expiring in 30 days</Text>
        </Card>
        <Card>
          <Text variant="label" tone="subtle">Rewards this month</Text>
          <Text variant="title">{s.rewards_this_month.claims} claims · ₹{s.rewards_this_month.committed_cost_inr + s.rewards_this_month.redeemed_cost_inr} exposure</Text>
          {s.rewards_this_month.budget_inr ? (
            <>
              <div className="mt-2 h-2 rounded-full bg-surface-sunken"><div className={`h-2 rounded-full ${(s.rewards_this_month.budget_used_pct ?? 0) >= 90 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${Math.min(100, s.rewards_this_month.budget_used_pct ?? 0)}%` }} /></div>
              <Text variant="caption" tone="subtle">{s.rewards_this_month.budget_used_pct}% of ₹{s.rewards_this_month.budget_inr}{s.rewards_this_month.alerts_hit.length ? ` · alert: ${s.rewards_this_month.alerts_hit.join('%, ')}%` : ''}</Text>
            </>
          ) : <Text variant="caption" tone="subtle">No monthly budget set</Text>}
        </Card>
      </div>
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Text variant="subtitle">Program for this gym</Text>
          <Text variant="caption" tone="subtle">Levels, points and equations come from the <Link to="/admin/club-template" className="underline">club template</Link>. Here you can lower coin limits, never raise them.</Text>
        </div>
        <div className="flex flex-wrap gap-6">
          {([
            ['Clubs on at this gym', prog.enabled, (v: boolean) => setP({ ...prog, enabled: v })],
            [`Gym Coins${lim.gym_coins_platform_enabled ? '' : ' (off platform-wide)'}`, prog.gym_coins_enabled, (v: boolean) => setP({ ...prog, gym_coins_enabled: v })],
            ['No-cost rewards only', prog.no_cash_cost_only, (v: boolean) => setP({ ...prog, no_cash_cost_only: v })],
            ['Lock owner changes', prog.owner_locked, (v: boolean) => setP({ ...prog, owner_locked: v })],
          ] as [string, boolean, (v: boolean) => void][]).map(([label, on, fn]) => (
            <span key={label} className="flex items-center gap-2 text-sm"><Toggle label={label} checked={on} disabled={!edit} onChange={fn} />{label}</span>
          ))}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead><tr className="text-left text-ink-subtle"><th className="py-1">Level</th><th>Coin ceiling / 28 days (template max)</th><th>Cashback % (template max)</th></tr></thead>
            <tbody>{d.levels.map(l => { const k = String(l.level); return (
              <tr key={k}><td className="py-1 pr-2">{l.level} {l.name}</td>
                <td className="pr-2"><input aria-label={`ceiling ${k}`} type="number" className={cell} placeholder={`${lim.coin_ceilings[k]}`} disabled={!edit} value={prog.coin_ceilings[k] ?? ''} onChange={e => setLevel('coin_ceilings', k, e.target.value)} /></td>
                <td><input aria-label={`cashback ${k}`} type="number" step="0.05" className={cell} placeholder={`${lim.cashback_pct[k]}`} disabled={!edit} value={prog.cashback_pct[k] ?? ''} onChange={e => setLevel('cashback_pct', k, e.target.value)} /></td>
              </tr>); })}</tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <TextField label={`Coins: max % of a bill (≤ ${lim.coin_invoice_cap_pct})`} type="number" value={prog.coin_invoice_cap_pct ?? ''} disabled={!edit} onChange={e => setP({ ...prog, coin_invoice_cap_pct: e.target.value === '' ? null : Number(e.target.value) })} />
          <TextField label={`Coin expiry days (default ${lim.coin_expiry_days})`} type="number" value={prog.coin_expiry_days ?? ''} disabled={!edit} onChange={e => setP({ ...prog, coin_expiry_days: e.target.value === '' ? null : Number(e.target.value) })} />
          <TextField label="Monthly reward budget ₹" type="number" value={prog.monthly_reward_budget_inr ?? ''} disabled={!edit} onChange={e => setP({ ...prog, monthly_reward_budget_inr: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        {edit ? <div className="mt-3 flex items-center gap-2"><Button label="Save program" loading={busy} disabled={!p} onClick={save} />{p ? <Button variant="ghost" label="Reset" onClick={() => setP(null)} /> : null}</div> : null}
        {msg ? <p role="status" className={`mt-2 rounded-gm-md px-3 py-2 text-sm ${msg.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{msg.text}</p> : null}
        {d.program.updated_by ? <Text variant="caption" tone="subtle" className="mt-2">Last changed by {d.program.updated_by} · {when(d.program.updated_at)}</Text> : null}
      </Card>
      <Card><RewardEditor rewards={d.rewards} canEdit={edit} onSave={saveReward} onRemove={async id => { await adminDelete(`/clubs/rewards/${id}`, { reason: 'Removed in admin' }); await qc.invalidateQueries({ queryKey: key }); }} /></Card>
      <section>
        <Text variant="label" tone="subtle" className="mb-2">Recent claims ({d.redemptions.length})</Text>
        <DataTable rows={d.redemptions} rowKey={r => r.id} empty="No claims yet." columns={[
          { key: 'r', label: 'Reward', render: r => r.reward }, { key: 'c', label: 'Code', render: r => <span className="font-mono">{r.code}</span> },
          { key: 's', label: 'Status', render: r => <StatusPill status={r.status} /> }, { key: 'm', label: 'Member', render: r => <Link className="text-accent-text underline" to={`/admin/users/${r.user_id}`}>open</Link> },
          { key: 'd', label: 'When', render: r => when(r.created_at) }, { key: 'v', label: 'Cost', render: r => `₹${r.est_cost_inr}${r.coins_spent ? ` + ${r.coins_spent} coins` : ''}` },
        ]} />
      </section>
      <section>
        <Text variant="label" tone="subtle" className="mb-2">Members ({d.members.length})</Text>
        <DataTable rows={d.members} rowKey={m => m.user_id} empty="No club members yet." columns={[
          { key: 'm', label: 'Member', render: m => <Link className="text-accent-text underline" to={`/admin/users/${m.user_id}`}>{m.phone ?? m.user_id.slice(0, 8)}</Link> },
          { key: 'l', label: 'Level', render: m => `${m.level} · ${d.levels[m.level - 1]?.name}` }, { key: 'cp', label: 'Active CP', render: m => m.active_cp.toLocaleString('en-IN') },
          { key: 'g', label: 'GCPI', render: m => (m.gcpi != null ? `${m.gcpi} → ${m.multiplier}×` : '—') }, { key: 'r', label: 'Review', render: m => <StatusPill status={m.review} /> },
          { key: 't', label: 'Retention', render: m => <Badge label={m.retention.replace('_', ' ')} tone={m.retention === 'healthy' ? 'success' : m.retention === 'watch' ? 'warning' : 'danger'} /> },
        ]} />
      </section>
    </div>
  );
}

type MemberClubs = {
  lifetime_cp: number; best_level: number;
  gyms: { gym: { id: string; name: string | null }; level: { level: number; name: string }; active_cp: number; multiplier: { value: number; label: string }; gcpi: { score: number | null };
    review: { status: string; message: string | null }; shield: { held: number }; streak_weeks: number; retention: string; fraud_flag: boolean;
    history: { evaluations: { start: string; gcpi: number; multiplier: number; penalty: number; review: string }[]; weeks: { week_start: string; available: number; completed: number; compliance: number | null; deficient: boolean; severity: number; protected: string | null }[] } }[];
  ledger: { id: string; at: string; kind: string; cp: number; base_cp: number; multiplier: number; reason: string | null; actor: string; cap: string | null }[];
  coins: { total: number; buckets: { gym: string | null; balance: number }[] };
  protections: { id: string; reason: string; starts_on: string; ends_on: string; status: string; note: string | null }[];
  appeals: { id: string; message: string; status: string; resolution: string | null; created_at: string }[];
};

/** Member 360 → Clubs: standing per gym, ledger, reviews, coins, corrections, protections and appeals. */
export function ClubsMemberPanel({ uid }: { uid: string }) {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const key = ['admin', 'member-clubs', uid];
  const q = useQuery({ queryKey: key, queryFn: () => adminGet<MemberClubs>(`/clubs/members/${uid}`) });
  const [adj, setAdj] = useState({ gym: '', cp: '', reason: '' });
  const [busy, setBusy] = useState('');
  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      alert(adminError(e).message);
    } finally {
      setBusy('');
    }
  };
  if (q.isLoading) return <Skeleton className="h-64" rounded="xl" />;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  const edit = can('clubs.manage');
  return (
    <div className="flex flex-col gap-4">
      <Card><Text variant="title">{d.lifetime_cp.toLocaleString('en-IN')} Lifetime CP · best level {d.best_level} · {d.coins.total} coins</Text></Card>
      {d.gyms.length === 0 ? <Text tone="muted">No club standing yet (it starts with an active gym membership).</Text> : d.gyms.map(g => (
        <Card key={g.gym.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text variant="subtitle">{g.gym.name}</Text>
            <div className="flex flex-wrap gap-1.5"><Badge label={`L${g.level.level} ${g.level.name}`} tone="accent" /><StatusPill status={g.review.status} /><Badge label={`${g.multiplier.value}× ${g.multiplier.label}`} />{g.fraud_flag ? <Badge label="fraud flag" tone="danger" /> : null}</div>
          </div>
          <Field label="Active CP">{g.active_cp.toLocaleString('en-IN')}</Field>
          <Field label="GCPI">{g.gcpi.score ?? '—'}</Field>
          <Field label="Streak">{g.streak_weeks} qualifying weeks · shield {g.shield.held}</Field>
          <Field label="Retention">{g.retention}</Field>
          {g.review.message ? <Text variant="caption" tone="subtle">{g.review.message}</Text> : null}
          {edit ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" label="Run automation now" loading={busy === `run${g.gym.id}`} onClick={() => act(`run${g.gym.id}`, () => adminPost(`/clubs/members/${uid}/run`, { gym_id: g.gym.id }))} />
              <Button size="sm" variant="ghost" label={g.fraud_flag ? 'Clear fraud flag' : 'Flag for review'} onClick={() => act(`flag${g.gym.id}`, () => adminPost(`/clubs/members/${uid}/flag`, { gym_id: g.gym.id, flag: !g.fraud_flag }))} />
            </div>
          ) : null}
          {g.history.weeks.length ? (
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-xs"><thead><tr className="text-left text-ink-subtle"><th>Week</th><th>Done</th><th>W</th><th>Severity</th><th /></tr></thead>
              <tbody>{g.history.weeks.slice(0, 8).map(w => <tr key={w.week_start}><td className="py-0.5">{w.week_start}</td><td>{w.completed}/{w.available}</td><td>{w.compliance ?? '—'}</td><td>{w.severity}</td><td>{w.protected ?? (w.deficient ? 'deficient' : 'qualifying')}</td></tr>)}</tbody></table></div>
          ) : null}
        </Card>
      ))}
      {edit && d.gyms.length ? (
        <Card>
          <Text variant="subtitle">Correct Club Points</Text>
          <Text variant="caption" tone="subtle">Never multiplied. A negative correction lowers Active CP only. Audited.</Text>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <select aria-label="Gym" className="h-10 rounded-gm-lg border border-border bg-surface px-3 text-sm" value={adj.gym} onChange={e => setAdj({ ...adj, gym: e.target.value })}>
              <option value="">Gym…</option>{d.gyms.map(g => <option key={g.gym.id} value={g.gym.id}>{g.gym.name}</option>)}
            </select>
            <TextField label="CP (+/−)" type="number" value={adj.cp} onChange={e => setAdj({ ...adj, cp: e.target.value })} />
            <div className="sm:col-span-2"><TextField label="Reason" value={adj.reason} onChange={e => setAdj({ ...adj, reason: e.target.value })} /></div>
          </div>
          <Button className="mt-2" size="sm" label="Apply correction" loading={busy === 'adj'} disabled={!adj.gym || !adj.cp || adj.reason.trim().length < 5}
            onClick={() => act('adj', async () => { await adminPost(`/clubs/members/${uid}/adjust`, { gym_id: adj.gym, cp: Number(adj.cp), reason: adj.reason }); setAdj({ gym: '', cp: '', reason: '' }); })} />
        </Card>
      ) : null}
      {d.protections.length ? (
        <section><Text variant="label" tone="subtle" className="mb-2">Protections</Text>
          <DataTable rows={d.protections} rowKey={p => p.id} columns={[
            { key: 'r', label: 'Reason', render: p => p.reason }, { key: 'd', label: 'Dates', render: p => `${p.starts_on} → ${p.ends_on}` }, { key: 's', label: 'Status', render: p => <StatusPill status={p.status} /> },
            { key: 'x', label: '', render: p => (p.status === 'pending' && edit ? <div className="flex gap-1"><Button size="sm" label="Approve" onClick={() => act(p.id, () => adminPost(`/clubs/protections/${p.id}`, { decision: 'approve' }))} /><Button size="sm" variant="ghost" label="Reject" onClick={() => act(p.id, () => adminPost(`/clubs/protections/${p.id}`, { decision: 'reject' }))} /></div> : null) },
          ]} /></section>
      ) : null}
      {d.appeals.length ? (
        <section><Text variant="label" tone="subtle" className="mb-2">Appeals</Text>
          <DataTable rows={d.appeals} rowKey={a => a.id} columns={[
            { key: 'm', label: 'Message', render: a => a.message }, { key: 's', label: 'Status', render: a => <StatusPill status={a.status} /> },
            { key: 'x', label: '', render: a => (a.status === 'open' && edit ? <div className="flex gap-1">
              <Button size="sm" label="Accept" onClick={() => { const cp = prompt('Give back how many CP? (0 for none)', '0'); act(a.id, () => adminPost(`/clubs/appeals/${a.id}`, { decision: 'accept', refund_cp: Number(cp) || 0, resolution: 'Accepted' })); }} />
              <Button size="sm" variant="ghost" label="Reject" onClick={() => act(a.id, () => adminPost(`/clubs/appeals/${a.id}`, { decision: 'reject', resolution: 'Rejected after review' }))} /></div> : a.resolution) },
          ]} /></section>
      ) : null}
      <section>
        <Text variant="label" tone="subtle" className="mb-2">Club Points ledger ({d.ledger.length})</Text>
        <DataTable rows={d.ledger} rowKey={t => t.id} empty="No points yet." columns={[
          { key: 'a', label: 'When', render: t => when(t.at) }, { key: 'k', label: 'Type', render: t => t.kind },
          { key: 'c', label: 'CP', render: t => <span className={t.cp < 0 ? 'text-danger' : ''}>{t.cp > 0 ? '+' : ''}{t.cp}{t.multiplier !== 1 ? ` (${t.base_cp}×${t.multiplier})` : ''}</span> },
          { key: 'r', label: 'Reason', render: t => <>{t.reason}{t.cap ? <div className="text-xs text-ink-subtle">limit: {t.cap}</div> : null}</> }, { key: 'b', label: 'By', render: t => t.actor },
        ]} />
      </section>
    </div>
  );
}
