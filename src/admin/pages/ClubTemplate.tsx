import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ErrorState, Skeleton, Text, TextField } from '../../components/kit';
import { adminError, adminGet, adminPost, adminPut } from '../api';
import { when } from '../format';
import { DataTable, PageTitle } from '../ui';
import { useAdmin } from '../useAdmin';

type Band = { min: number; max: number; value: number; label: string };
type Rules = Record<string, unknown> & {
  levels: { level: number; name: string; threshold: number; blurb: string }[];
  gcpi_weights: Record<string, number>; consistency_weights: Record<string, number>; streak_score: Band[]; multipliers: Band[];
  difficulty_cp: Record<string, { min_cp: number; max_cp: number }>; category_daily_caps: Record<string, number>; severity: number[];
  level_loss_caps_pct: Record<string, number>; shield_days_by_level: Record<string, number | null>; coin_ceiling_by_level: Record<string, number>;
  cashback_pct_by_level: Record<string, number>; coin_buckets_enabled: Record<string, boolean>;
};
type Sim = { profile: string; gcpi: number; multiplier: number; base_cp_per_week: number; cp_per_week: number; weeks_to_level: Record<string, number | null>; top_level_in_years: number | null };
type Template = { version: number; rules: Rules; simulation: Sim[]; history: { version: number; note: string; by: string; at: string }[]; level_reward_examples: Record<string, string> };

const SCALARS: [string, string][] = [
  ['promotion_min_qualifying_weeks', 'Qualifying weeks (of last 4) needed for promotion'], ['evaluation_days', 'Review period (days)'],
  ['mult_3x_min_dimension', '3×+: every dimension ≥'], ['mult_4x_min_gcpi', '4×: GCPI ≥'], ['mult_4x_min_dimension', '4×: every dimension ≥'],
  ['mult_4x_consecutive_periods', '4×: qualifying periods in a row'], ['daily_base_cap', 'Daily base CP cap'], ['weekly_base_cap', 'Weekly base CP cap'],
  ['core_missions_per_day', 'Core missions per day'], ['optional_missions_per_day', 'Bonus missions per day'], ['compliance_threshold', 'Qualifying week: compliance ≥ %'],
  ['penalty_coefficient', 'Penalty coefficient (0.20)'], ['downgrade_failing_reviews', 'Failing reviews before downgrade'],
  ['failing_review_min_deficient_weeks', 'Failing review: deficient weeks ≥'], ['failing_review_max_gcpi', 'Failing review: GCPI <'], ['restore_min_gcpi', 'Restore level: GCPI ≥'],
  ['shield_max_held', 'Max shields held'], ['coin_value_inr', 'Coin value (₹)'], ['coin_invoice_cap_pct', 'Coins: max % of an invoice'], ['coin_expiry_days', 'Coin expiry (days)'],
  ['coupons_per_transaction', 'Coupons per bill'], ['passport_level_drop', 'Passport: levels dropped'], ['passport_requalify_days', 'Passport: requalify days'],
  ['passport_streak_grace_days', 'Passport: streak grace days'], ['passport_cooldown_days', 'Passport: days between transfers'],
];

const n = (v: string) => (v === '' ? 0 : Number(v));

/** One club rules template for every gym. Saving creates a new version that applies from now on. */
export default function ClubTemplate() {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'club-template'], queryFn: () => adminGet<Template>('/clubs/template') });
  const [r, setR] = useState<Rules | null>(null);
  const [note, setNote] = useState('');
  const [sim, setSim] = useState<Sim[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  useEffect(() => { if (q.data) setR(structuredClone(q.data.rules)); }, [q.data]);
  if (q.isLoading || !r) return q.isError ? <ErrorState onRetry={() => q.refetch()} /> : <Skeleton className="h-96" rounded="xl" />;
  const edit = can('clubs.manage');
  const upd = (fn: (x: Rules) => void) => setR(prev => { const x = structuredClone(prev!) as Rules; fn(x); return x; });
  const num = (v: unknown) => String(v ?? '');
  const cell = 'w-full min-w-[4.5rem] rounded-gm-md border border-border bg-surface px-2 py-1 text-sm';
  const weightsSum = Object.values(r.gcpi_weights).reduce((a, b) => a + Number(b), 0);
  const run = async (kind: 'sim' | 'save') => {
    setBusy(kind);
    setMsg(null);
    try {
      if (kind === 'sim') setSim(await adminPost<Sim[]>('/clubs/template/simulate', { rules: r }));
      else {
        const res = await adminPut<{ version: number; changed: string[] }>('/clubs/template', { rules: r, note });
        setMsg({ ok: true, text: `Saved as version ${res.version}. Changed: ${res.changed.join(', ') || 'nothing'}.` });
        setNote('');
        await qc.invalidateQueries({ queryKey: ['admin', 'club-template'] });
      }
    } catch (e) {
      setMsg({ ok: false, text: adminError(e).message });
    } finally {
      setBusy('');
    }
  };
  const simRows = sim ?? q.data!.simulation;
  return (
    <>
      <PageTitle title="Club template" subtitle={`One set of club rules for every gym (version ${q.data!.version}). Gyms set their own rewards and coin limits within it, on each gym's Clubs tab.`} />
      <div className="flex flex-col gap-5">
        <Card>
          <Text variant="subtitle" className="mb-3">Levels</Text>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {r.levels.map((l, i) => (
              <div key={l.level} className="rounded-gm-md border border-border p-2">
                <Text variant="caption" tone="subtle">Level {l.level}</Text>
                <input aria-label={`Level ${l.level} name`} className={cell} value={l.name} disabled={!edit} onChange={e => upd(x => { x.levels[i].name = e.target.value; })} />
                <input aria-label={`Level ${l.level} threshold`} type="number" className={`${cell} mt-1`} value={l.threshold} disabled={!edit || i === 0} onChange={e => upd(x => { x.levels[i].threshold = n(e.target.value); })} />
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <Text variant="subtitle">GCPI weights <span className={Math.abs(weightsSum - 1) > 0.001 ? 'text-danger' : 'text-ink-subtle'}>(sum {weightsSum.toFixed(2)})</span></Text>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Object.keys(r.gcpi_weights).map(k => <label key={k} className="text-xs">{k}<input type="number" step="0.01" className={cell} disabled={!edit} value={num(r.gcpi_weights[k])} onChange={e => upd(x => { x.gcpi_weights[k] = n(e.target.value); })} /></label>)}
            </div>
            <Text variant="subtitle" className="mt-4">Consistency C = A·w + S·w</Text>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.keys(r.consistency_weights).map(k => <label key={k} className="text-xs">{k}<input type="number" step="0.01" className={cell} disabled={!edit} value={num(r.consistency_weights[k])} onChange={e => upd(x => { x.consistency_weights[k] = n(e.target.value); })} /></label>)}
            </div>
            <Text variant="subtitle" className="mt-4">Streak score (qualifying weeks → S)</Text>
            {r.streak_score.map((b, i) => (
              <div key={i} className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <input aria-label="from" type="number" className={cell} disabled={!edit} value={b.min} onChange={e => upd(x => { x.streak_score[i].min = n(e.target.value); if (i) x.streak_score[i - 1].max = n(e.target.value); })} />
                <input aria-label="to" type="number" className={cell} disabled value={b.max} />
                <input aria-label="score" type="number" className={cell} disabled={!edit} value={b.value} onChange={e => upd(x => { x.streak_score[i].value = n(e.target.value); })} />
              </div>
            ))}
          </Card>
          <Card>
            <Text variant="subtitle">Multipliers (GCPI from → ×)</Text>
            {r.multipliers.map((b, i) => (
              <div key={i} className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <input aria-label="GCPI from" type="number" className={cell} disabled={!edit || i === 0} value={b.min} onChange={e => upd(x => { x.multipliers[i].min = n(e.target.value); x.multipliers[i - 1].max = n(e.target.value); })} />
                <input aria-label="multiplier" type="number" step="0.05" className={cell} disabled={!edit} value={b.value} onChange={e => upd(x => { x.multipliers[i].value = n(e.target.value); })} />
                <input aria-label="label" className={cell} disabled={!edit} value={b.label} onChange={e => upd(x => { x.multipliers[i].label = e.target.value; })} />
              </div>
            ))}
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <Text variant="subtitle">Mission CP bands</Text>
            {Object.entries(r.difficulty_cp).map(([k, d]) => (
              <div key={k} className="mt-1 grid grid-cols-3 items-center gap-2 text-sm"><span>{k}</span>
                <input aria-label={`${k} min`} type="number" className={cell} disabled={!edit} value={d.min_cp} onChange={e => upd(x => { x.difficulty_cp[k].min_cp = n(e.target.value); })} />
                <input aria-label={`${k} max`} type="number" className={cell} disabled={!edit} value={d.max_cp} onChange={e => upd(x => { x.difficulty_cp[k].max_cp = n(e.target.value); })} />
              </div>
            ))}
            <Text variant="subtitle" className="mt-4">Category daily caps</Text>
            <div className="mt-1 grid grid-cols-3 gap-2">{Object.entries(r.category_daily_caps).map(([k, v]) => <label key={k} className="text-xs">{k}<input type="number" className={cell} disabled={!edit} value={v} onChange={e => upd(x => { x.category_daily_caps[k] = n(e.target.value); })} /></label>)}</div>
            <Text variant="subtitle" className="mt-4">Severity by consecutive deficient week</Text>
            <div className="mt-1 grid grid-cols-5 gap-2">{r.severity.map((v, i) => <input key={i} aria-label={`week ${i + 1}`} type="number" step="0.1" className={cell} disabled={!edit} value={v} onChange={e => upd(x => { x.severity[i] = n(e.target.value); })} />)}</div>
          </Card>
          <Card>
            <Text variant="subtitle">By level</Text>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead><tr className="text-left text-ink-subtle"><th>Level</th><th>Max loss %</th><th>Penalty factor cap</th><th>Shield after days</th><th>Coin ceiling / 28d</th><th>Cashback %</th></tr></thead>
                <tbody>
                  {r.levels.map(l => { const k = String(l.level); return (
                    <tr key={k}><td className="py-1 pr-2">{l.level} {l.name}</td>
                      {(['level_loss_caps_pct', 'level_penalty_factor_cap', 'shield_days_by_level', 'coin_ceiling_by_level', 'cashback_pct_by_level'] as const).map(f => (
                        <td key={f} className="py-1 pr-1"><input aria-label={`${f} ${k}`} type="number" step="0.05" className={cell} disabled={!edit} value={num((r[f] as Record<string, unknown>)[k])}
                          onChange={e => upd(x => { (x[f] as Record<string, unknown>)[k] = e.target.value === '' && f === 'shield_days_by_level' ? null : n(e.target.value); })} /></td>
                      ))}
                    </tr>); })}
                </tbody>
              </table>
            </div>
            <Text variant="subtitle" className="mt-4">Coin types switched on (platform)</Text>
            <div className="mt-1 flex flex-wrap gap-4 text-sm">{Object.entries(r.coin_buckets_enabled).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" disabled={!edit} checked={v} onChange={e => upd(x => { x.coin_buckets_enabled[k] = e.target.checked; })} />{k}</label>
            ))}</div>
            <Text variant="caption" tone="subtle">Universal and Partner coins stay off until the legal, tax and accounting review is done.</Text>
          </Card>
        </div>
        <Card>
          <Text variant="subtitle" className="mb-2">Other rules</Text>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SCALARS.map(([k, label]) => <label key={k} className="text-xs">{label}<input type="number" step="0.01" className={cell} disabled={!edit} value={num(r[k])} onChange={e => upd(x => { x[k] = n(e.target.value); })} /></label>)}
          </div>
        </Card>
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Text variant="subtitle">Simulation: weeks to reach each level</Text><Button size="sm" variant="secondary" label="Simulate these edits" loading={busy === 'sim'} onClick={() => run('sim')} /></div>
          <DataTable rows={simRows} rowKey={s => s.profile} columns={[
            { key: 'p', label: 'Profile', render: s => <><div className="font-semibold">{s.profile}</div><div className="text-xs text-ink-subtle">GCPI {s.gcpi} → {s.multiplier}× · {s.cp_per_week} CP/week</div></> },
            ...r.levels.slice(1).map(l => ({ key: String(l.level), label: l.name, render: (s: Sim) => (s.weeks_to_level[String(l.level)] != null ? `${s.weeks_to_level[String(l.level)]} wk` : '—') })),
          ]} />
        </Card>
        {edit ? (
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[16rem] flex-1"><TextField label="What changed and why" value={note} onChange={e => setNote(e.target.value)} /></div>
              <Button label="Save new version" loading={busy === 'save'} disabled={note.trim().length < 3} onClick={() => run('save')} />
              <Button variant="ghost" label="Reset" onClick={() => setR(structuredClone(q.data!.rules))} />
            </div>
            <Text variant="caption" tone="subtle" className="mt-2">Applies from now on for every gym. Past points keep the version they were calculated with.</Text>
            {msg ? <p role="status" className={`mt-2 rounded-gm-md px-3 py-2 text-sm ${msg.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{msg.text}</p> : null}
          </Card>
        ) : null}
        <Card>
          <Text variant="subtitle" className="mb-2">Versions</Text>
          <DataTable rows={q.data!.history} rowKey={h => String(h.version)} columns={[
            { key: 'v', label: 'Version', render: h => `v${h.version}` }, { key: 'n', label: 'Note', render: h => h.note }, { key: 'b', label: 'By', render: h => h.by }, { key: 'a', label: 'When', render: h => when(h.at) },
          ]} />
        </Card>
      </div>
    </>
  );
}
