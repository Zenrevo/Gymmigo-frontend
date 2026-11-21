import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, Card, Text, TextField, useToast } from '../../../../components/kit';
import { RewardEditor, type RewardRow } from '../../../../components/clubs/RewardEditor';
import api, { getApiErrorMessage } from '../../../../utils/api';

type Summary = {
  members_by_level: { level: number; name: string; members: number }[];
  retention: Record<string, number>;
  coins: { issued: number; redeemed: number; outstanding: number; expiring_30d: number };
  rewards_this_month: { claims: number; committed_cost_inr: number; redeemed_cost_inr: number; budget_inr: number | null; budget_used_pct: number | null; alerts_hit: number[] };
};

const get = <T,>(url: string) => api.get(url).then(r => r.data.data as T);

/** Owner: club levels at this gym, reward catalogue, desk code check. Levels and points follow Gymmigo's template. */
export default function OwnerClubsV2({ gymId }: { gymId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const base = `/clubs/v2/gyms/${gymId}`;
  const sum = useQuery({ queryKey: ['owner-clubs-v2', gymId, 'summary'], queryFn: () => get<Summary>(`${base}/summary`) });
  const rewards = useQuery({ queryKey: ['owner-clubs-v2', gymId, 'rewards'], queryFn: () => get<RewardRow[]>(`${base}/rewards`) });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['owner-clubs-v2', gymId] });
  const save = async (body: Record<string, unknown>, id?: string) => {
    try {
      await (id ? api.patch(`${base}/rewards/${id}`, body) : api.post(`${base}/rewards`, body));
      toast({ tone: 'success', title: 'Reward saved' });
      await refresh();
    } catch (e) {
      throw new Error(getApiErrorMessage(e));
    }
  };
  const verify = async () => {
    setBusy(true);
    try {
      await api.post(`${base}/redemptions/verify`, { code });
      toast({ tone: 'success', title: 'Reward honoured' });
      setCode('');
      await refresh();
    } catch (e) {
      toast({ tone: 'danger', title: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  const s = sum.data;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Text variant="h2">Club levels &amp; rewards</Text>
          <Text tone="muted">Members earn Club Points from verified missions and climb 8 levels. You choose what each level unlocks at your gym. <Link to="/clubs" className="underline">How it works</Link></Text>
        </div>
      </div>
      {s ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <Text variant="label" tone="subtle">Members by level</Text>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-sm">
              {s.members_by_level.map(l => <div key={l.level} className="rounded-gm-md bg-surface-sunken p-1"><div className="font-semibold">{l.members}</div><div className="text-[11px] text-ink-subtle">{l.name}</div></div>)}
            </div>
          </Card>
          <Card>
            <Text variant="label" tone="subtle">Gym Coins</Text>
            <Text variant="title">{s.coins.outstanding} outstanding</Text>
            <Text variant="caption" tone="subtle">{s.coins.issued} issued · {s.coins.redeemed} redeemed · {s.coins.expiring_30d} expiring in 30 days</Text>
          </Card>
          <Card>
            <Text variant="label" tone="subtle">Rewards this month</Text>
            <Text variant="title">{s.rewards_this_month.claims} claims · ₹{s.rewards_this_month.committed_cost_inr + s.rewards_this_month.redeemed_cost_inr}</Text>
            <Text variant="caption" tone="subtle">{s.rewards_this_month.budget_inr ? `${s.rewards_this_month.budget_used_pct}% of ₹${s.rewards_this_month.budget_inr} budget` : 'No monthly budget set'}</Text>
            <Text variant="caption" tone="subtle">Needs attention: {s.retention.at_risk + s.retention.high_risk} members</Text>
          </Card>
        </div>
      ) : null}
      <Card>
        <Text variant="subtitle">Honour a claimed reward</Text>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-48"><TextField label="Member's code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
          <Button label="Mark redeemed" loading={busy} disabled={code.trim().length < 4} onClick={verify} />
        </div>
      </Card>
      <RewardEditor rewards={rewards.data ?? []} onSave={save} />
    </section>
  );
}
