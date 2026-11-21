import { useState } from 'react';
import { Badge, Button, Card, Sheet, Text, TextField, Toggle } from '../kit';

export type RewardRow = {
  id: string; name: string; description: string | null; category: string; sponsor_name: string | null; reward_type: string; min_level: number;
  discount_pct: number | null; discount_inr: number | null; max_discount_inr: number | null; min_spend_inr: number | null; coin_cost: number | null;
  quantity: number | null; left: number | null; per_member_limit: number; monthly_budget_inr: number | null; est_cost_inr: number;
  member_value_inr: number | null; starts_on: string | null; ends_on: string | null; restrictions: string | null; approval: string; is_active: boolean;
  redeemed_count: number;
};

const LEVEL_NAMES = ['Starter', 'Consistent', 'Committed', 'Athlete', 'Elite', 'Champion', 'Legend', 'Immortal'];
const TYPES = [['service', 'Free service'], ['percent', '% discount'], ['fixed', '₹ discount'], ['experience', 'Experience / guest pass'], ['pt', 'Personal training'], ['product', 'Product / merch']];
const NUM = ['discount_pct', 'discount_inr', 'max_discount_inr', 'min_spend_inr', 'coin_cost', 'quantity', 'per_member_limit', 'monthly_budget_inr', 'est_cost_inr', 'member_value_inr'] as const;

type Form = Record<string, string | boolean>;

const toForm = (r?: RewardRow): Form => ({
  name: r?.name ?? '', description: r?.description ?? '', category: r?.category ?? 'gym', sponsor_name: r?.sponsor_name ?? '', reward_type: r?.reward_type ?? 'service',
  min_level: String(r?.min_level ?? 1), starts_on: r?.starts_on ?? '', ends_on: r?.ends_on ?? '', restrictions: r?.restrictions ?? '', approval: r?.approval ?? 'staff',
  is_active: r?.is_active ?? true, ...Object.fromEntries(NUM.map(k => [k, r?.[k] != null ? String(r[k]) : k === 'per_member_limit' ? '1' : k === 'est_cost_inr' ? '0' : ''])),
});

const toBody = (f: Form) => {
  const out: Record<string, unknown> = {
    name: f.name, description: f.description || null, category: f.category, sponsor_name: f.sponsor_name || null, reward_type: f.reward_type,
    min_level: Number(f.min_level), starts_on: f.starts_on || null, ends_on: f.ends_on || null, restrictions: f.restrictions || null, approval: f.approval, is_active: f.is_active,
  };
  for (const k of NUM) out[k] = f[k] === '' ? (k === 'per_member_limit' ? 1 : k === 'est_cost_inr' ? 0 : null) : Number(f[k]);
  return out;
};

/** A gym's club reward catalogue: list + add/edit sheet. Same component for gym owners and Gymmigo admins. */
export function RewardEditor({ rewards, onSave, onRemove, canEdit = true }: {
  rewards: RewardRow[];
  onSave: (body: Record<string, unknown>, id?: string) => Promise<unknown>;
  onRemove?: (id: string) => Promise<unknown>;
  canEdit?: boolean;
}) {
  const [editing, setEditing] = useState<RewardRow | 'new' | null>(null);
  const [f, setF] = useState<Form>(toForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = (r: RewardRow | 'new') => { setEditing(r); setF(toForm(r === 'new' ? undefined : r)); setError(''); };
  const set = (k: string) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await onSave(toBody(f), editing && editing !== 'new' ? editing.id : undefined);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const sel = 'mt-1 h-10 w-full rounded-gm-lg border border-border bg-surface px-3 text-sm';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Text variant="subtitle">Club rewards ({rewards.length})</Text>
        {canEdit ? <Button size="sm" label="+ Add reward" onClick={() => open('new')} /> : null}
      </div>
      {rewards.length === 0 ? <Text tone="muted">No rewards yet. Members still earn levels; add rewards to give each level something to look forward to.</Text> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {rewards.map(r => (
          <Card key={r.id} variant={r.is_active ? 'raised' : 'sunken'}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <Badge label={`L${r.min_level}+ ${LEVEL_NAMES[r.min_level - 1]}`} tone="accent" />
                  <Badge label={r.category} />{r.is_active ? null : <Badge label="off" tone="neutral" />}
                </div>
                <Text variant="subtitle" className="mt-2">{r.name}</Text>
                <Text variant="caption" tone="subtle">
                  {[r.discount_pct ? `${r.discount_pct}%` : null, r.discount_inr ? `₹${r.discount_inr}` : null, r.coin_cost ? `${r.coin_cost} coins` : null,
                    r.quantity != null ? `${r.left} of ${r.quantity} left` : 'unlimited', `cost ₹${r.est_cost_inr}`, `${r.redeemed_count} claimed`].filter(Boolean).join(' · ')}
                </Text>
              </div>
              {canEdit ? (
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" label="Edit" onClick={() => open(r)} />
                  {onRemove ? <Button size="sm" variant="ghost" label="Remove" onClick={() => confirm(`Remove "${r.name}"?`) && onRemove(r.id)} /> : null}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      <Sheet open={!!editing} onClose={() => setEditing(null)} eyebrow="Club reward" title={editing === 'new' ? 'Add a reward' : 'Edit reward'} size="lg"
        footer={<Button fullWidth label="Save reward" loading={busy} disabled={String(f.name).trim().length < 2} onClick={save} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><TextField label="Name" value={String(f.name)} onChange={set('name')} /></div>
          <div className="sm:col-span-2"><TextField label="Description" optional value={String(f.description)} onChange={set('description')} /></div>
          <label className="text-sm">Unlocks at level
            <select className={sel} value={String(f.min_level)} onChange={set('min_level')}>{LEVEL_NAMES.map((n, i) => <option key={n} value={i + 1}>{i + 1} · {n}</option>)}</select>
          </label>
          <label className="text-sm">Type
            <select className={sel} value={String(f.reward_type)} onChange={set('reward_type')}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label className="text-sm">Funded by
            <select className={sel} value={String(f.category)} onChange={set('category')}><option value="gym">Gym</option><option value="partner">Partner brand</option><option value="gymmigo">Gymmigo</option></select>
          </label>
          <TextField label="Sponsor name" optional value={String(f.sponsor_name)} onChange={set('sponsor_name')} />
          <TextField label="Discount %" optional type="number" value={String(f.discount_pct)} onChange={set('discount_pct')} />
          <TextField label="Discount ₹" optional type="number" value={String(f.discount_inr)} onChange={set('discount_inr')} />
          <TextField label="Max discount ₹" optional type="number" value={String(f.max_discount_inr)} onChange={set('max_discount_inr')} />
          <TextField label="Minimum spend ₹" optional type="number" value={String(f.min_spend_inr)} onChange={set('min_spend_inr')} />
          <TextField label="Costs coins" optional type="number" value={String(f.coin_cost)} onChange={set('coin_cost')} />
          <TextField label="Quantity" optional helper="Empty = unlimited" type="number" value={String(f.quantity)} onChange={set('quantity')} />
          <TextField label="Per member" type="number" value={String(f.per_member_limit)} onChange={set('per_member_limit')} />
          <TextField label="Monthly budget ₹" optional type="number" value={String(f.monthly_budget_inr)} onChange={set('monthly_budget_inr')} />
          <TextField label="Your cost per claim ₹" type="number" value={String(f.est_cost_inr)} onChange={set('est_cost_inr')} />
          <TextField label="Value to member ₹" optional type="number" value={String(f.member_value_inr)} onChange={set('member_value_inr')} />
          <TextField label="Starts" optional type="date" value={String(f.starts_on)} onChange={set('starts_on')} />
          <TextField label="Ends" optional type="date" value={String(f.ends_on)} onChange={set('ends_on')} />
          <div className="sm:col-span-2"><TextField label="Restrictions" optional value={String(f.restrictions)} onChange={set('restrictions')} /></div>
          <label className="text-sm">Redemption
            <select className={sel} value={String(f.approval)} onChange={set('approval')}><option value="staff">Staff verifies the code</option><option value="auto">Automatic</option></select>
          </label>
          <span className="flex items-center gap-2 text-sm"><Toggle label="Active" checked={Boolean(f.is_active)} onChange={v => setF(p => ({ ...p, is_active: v }))} />Active (members can claim it)</span>
          {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger sm:col-span-2">{error}</p> : null}
        </div>
      </Sheet>
    </div>
  );
}
