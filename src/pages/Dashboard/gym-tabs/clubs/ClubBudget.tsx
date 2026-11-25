import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { Badge, Button, Card, Chip, Sheet, Text, TextField, useToast } from '../../../../components/kit';
import { inr, ownerSuite, type RewardPlan } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';
import { Row } from '../suite/Row';

const LEVELS = ['Starter', 'Consistent', 'Committed', 'Athlete', 'Elite', 'Champion', 'Legend', 'Immortal'];

/** Monthly reward budget: club tasks are the same at every gym; the owner's budget sizes the rewards. */
export default function ClubBudget({ gymId, usedPct, onChanged }: { gymId: string; usedPct?: number | null; onChanged: () => void }) {
  const qc = useQueryClient();
  const key = ['owner', gymId, 'club-program'];
  const prog = useQuery({ queryKey: key, queryFn: () => ownerSuite.program(gymId) });
  const [open, setOpen] = useState(false);
  const p = prog.data;
  if (!p) return null;
  return (
    <Card>
      <div className="flex items-center gap-2"><Target size={18} /><Text variant="subtitle">Monthly reward budget</Text></div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Text variant="title">{p.monthly_reward_budget_inr ? inr(p.monthly_reward_budget_inr) : 'Not set'}</Text>
        {usedPct != null ? <Badge tone={usedPct >= 100 ? 'danger' : usedPct >= 75 ? 'warning' : 'success'} label={`${usedPct}% used`} /> : null}
      </div>
      <Text variant="caption" tone="subtle">
        {p.owner_locked ? 'Gymmigo has locked these settings for your gym.' : `Alerts at ${p.budget_alerts.join(', ')}%. When it's used up, new claims pause until next month.`}
      </Text>
      {!p.owner_locked ? <Button className="mt-3" onClick={() => setOpen(true)}>{p.monthly_reward_budget_inr ? 'Change budget & plan rewards' : 'Set a budget & plan rewards'}</Button> : null}
      {open ? <PlanSheet gymId={gymId} initial={p.monthly_reward_budget_inr ?? 0} alerts={p.budget_alerts} onClose={() => setOpen(false)}
        onApplied={() => { qc.invalidateQueries({ queryKey: key }); onChanged(); }} /> : null}
    </Card>
  );
}

function PlanSheet({ gymId, initial, alerts, onClose, onApplied }: { gymId: string; initial: number; alerts: number[]; onClose: () => void; onApplied: () => void }) {
  const toast = useToast();
  const [budget, setBudget] = useState(initial ? String(initial) : '5000');
  const [alertSet, setAlertSet] = useState(alerts);
  const [plan, setPlan] = useState<RewardPlan | null>(null);
  const [skip, setSkip] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const preview = async () => {
    setBusy(true);
    try { setPlan(await ownerSuite.planRewards(gymId, { budget_inr: Number(budget) || 0 })); } catch (e) { toast({ tone: 'danger', title: 'Could not plan', message: getApiErrorMessage(e) }); } finally { setBusy(false); }
  };
  const apply = async () => {
    setBusy(true);
    try {
      await ownerSuite.saveProgram(gymId, { budget_alerts: alertSet });
      const r = await ownerSuite.planRewards(gymId, { budget_inr: Number(budget) || 0, apply: true, overrides: skip.map(l => ({ min_level: l, skip: true })) });
      toast({ tone: 'success', title: 'Rewards set from your budget', message: `${r.created ?? 0} new` });
      onApplied();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not apply', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Club rewards" title="Plan rewards from a budget" size="lg"
      footer={plan ? <Button fullWidth loading={busy} onClick={apply}>Apply {plan.rewards.length - skip.length} rewards</Button> : <Button fullWidth loading={busy} onClick={preview}>Preview plan</Button>}>
      <div className="space-y-4">
        <TextField label="Monthly reward budget" prefix="₹" inputMode="numeric" value={budget} onChange={e => { setBudget(e.target.value.replace(/\D/g, '')); setPlan(null); }}
          helper="What you're happy to spend on member rewards each month." />
        <div>
          <Text variant="label" tone="subtle">Alert me at</Text>
          <div className="mt-2 flex gap-2">{[50, 75, 90, 100].map(a => <Chip key={a} label={`${a}%`} selected={alertSet.includes(a)} onClick={() => setAlertSet(s => (s.includes(a) ? s.filter(x => x !== a) : [...s, a].sort((x, y) => x - y)))} />)}</div>
        </div>
        {plan ? (
          <>
            <Card variant="sunken" padding="md">
              <Row label={`Expected if ${plan.uptake_assumed_pct}% of eligible members claim`} value={inr(plan.expected_cost_inr)} />
              <Row label="Planned within budget" value={inr(plan.planned_cost_inr)} strong />
              <Text variant="caption" tone={plan.fits ? 'success' : 'warning'}>{plan.fits ? 'Fits your budget.' : `Scaled to ${plan.scaled_to_pct}%: rewards get a monthly limit.`}</Text>
            </Card>
            <div className="grid gap-2 sm:grid-cols-2">
              {plan.rewards.map(r => {
                const off = skip.includes(r.min_level);
                return (
                  <Card key={r.min_level} padding="md" variant={off ? 'sunken' : 'surface'} onClick={() => setSkip(s => (off ? s.filter(x => x !== r.min_level) : [...s, r.min_level]))} className="cursor-pointer">
                    <div className="flex items-center justify-between"><Badge tone={off ? 'neutral' : 'accent'} label={`L${r.min_level} ${LEVELS[r.min_level - 1]}`} /><Text variant="caption" tone="subtle">{off ? 'Skipped' : r.quantity_per_month != null ? `${r.quantity_per_month}/month` : 'no limit'}</Text></div>
                    <Text variant="bodyStrong" className="mt-1">{r.name}</Text>
                    <Text variant="caption" tone="subtle">{r.eligible_members} eligible · ~{r.expected_claims} claims · {inr(r.est_cost_inr)} each</Text>
                  </Card>
                );
              })}
            </div>
            <Text variant="caption" tone="subtle">Click a reward to skip it. You can rename or fine-tune rewards afterwards.</Text>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}
