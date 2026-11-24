import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Gift } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, Sheet, Skeleton, Text, TextField, confirmDialog, useToast } from '../../../../components/kit';
import { coinCap, inr, ownerSuite, type PosMember } from '../../../../api/ownerSuite';
import api, { getApiErrorMessage } from '../../../../utils/api';

type Claim = { id: string; code: string; status: string; reward: string | null; member: string | null; phone: string | null; level: number; coins_spent: number;
  est_cost_inr: number; created_at: string | null; expires_at: string | null; redeemed_at: string | null };
type Filter = 'issued' | 'redeemed' | 'cancelled' | 'all';

const FILTERS: [Filter, string][] = [['issued', 'Open'], ['redeemed', 'Honoured'], ['cancelled', 'Cancelled'], ['all', 'All']];
const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');
const digits = (v: string) => v.replace(/\D/g, '');

/** The front desk for clubs, as in the app: members' claimed rewards (honour / cancel) and Gym Coins on a bill. */
export default function ClubDesk({ gymId, onChanged }: { gymId: string; onChanged: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('issued');
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const claims = useQuery({
    queryKey: ['owner-clubs-v2', gymId, 'claims', filter],
    queryFn: () => api.get(`/clubs/v2/gyms/${gymId}/redemptions`, { params: filter === 'all' ? {} : { status: filter } }).then(r => r.data.data as Claim[]),
  });
  const act = async (c: Claim, action: 'redeem' | 'cancel') => {
    if (action === 'cancel' && !(await confirmDialog({ title: `Cancel ${c.reward ?? 'this reward'}?`, tone: 'danger', confirmLabel: 'Cancel claim',
      message: c.coins_spent ? `${c.coins_spent} Gym Coins go back to the member.` : 'The member can claim it again later.' }))) return;
    try {
      await api.post(`/clubs/v2/gyms/${gymId}/redemptions/verify`, { code: c.code, action });
      toast({ tone: 'success', title: action === 'redeem' ? 'Reward honoured' : 'Claim cancelled' });
      qc.invalidateQueries({ queryKey: ['owner-clubs-v2', gymId] });
      onChanged();
    } catch (e) {
      toast({ tone: 'danger', title: getApiErrorMessage(e) });
    }
  };
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text variant="subtitle">Claimed rewards</Text>
        <Button size="sm" variant="secondary" icon={Coins} onClick={() => setCoinsOpen(true)}>Use Gym Coins on a bill</Button>
      </div>
      <div className="flex flex-wrap gap-2">{FILTERS.map(([v, l]) => <Chip key={v} label={l} selected={filter === v} onClick={() => setFilter(v)} />)}</div>
      {claims.isLoading ? <Skeleton className="h-24" /> : !claims.data?.length ? (
        <EmptyState icon={Gift} title={filter === 'issued' ? 'No open claims' : 'Nothing here'} message="When members claim a reward, it shows here with their code." />
      ) : (
        <div className="divide-y divide-line">
          {claims.data.map(c => {
            const expired = c.status === 'issued' && !!c.expires_at && new Date(c.expires_at).getTime() < now;
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Text variant="bodyStrong">{c.reward ?? 'Reward'} <span className="font-mono text-sm text-ink-muted">· {c.code}</span></Text>
                  <Text variant="caption" tone="subtle">
                    {c.member ?? 'Member'}{c.phone ? ` · ${c.phone}` : ''} · claimed {day(c.created_at)}
                    {c.status === 'issued' && c.expires_at ? ` · ${expired ? 'expired' : 'expires'} ${day(c.expires_at)}` : ''}
                    {c.coins_spent ? ` · ${c.coins_spent} coins` : ''}
                  </Text>
                </div>
                {c.status === 'issued' ? (
                  <div className="flex gap-2">
                    {!expired ? <Button size="sm" onClick={() => act(c, 'redeem')}>Honour</Button> : null}
                    <Button size="sm" variant="secondary" onClick={() => act(c, 'cancel')}>Cancel</Button>
                  </div>
                ) : <Badge tone={c.status === 'redeemed' ? 'success' : 'neutral'} label={c.status === 'redeemed' ? `Honoured ${day(c.redeemed_at)}` : c.status} />}
              </div>
            );
          })}
        </div>
      )}
      {coinsOpen ? <DeskCoinsSheet gymId={gymId} onClose={() => setCoinsOpen(false)} onDone={onChanged} /> : null}
    </Card>
  );
}

/** Apply a member's Gym Coins to a bill at the desk (max % of the bill, never more than their balance). */
function DeskCoinsSheet({ gymId, onClose, onDone }: { gymId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [member, setMember] = useState<PosMember | null>(null);
  const [bill, setBill] = useState('');
  const [coins, setCoins] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const max = member && Number(bill) ? coinCap(Number(bill), member.coins, member.coin_cap_pct) : 0;
  const find = async () => {
    setBusy(true);
    try {
      setMember(await ownerSuite.posMember(gymId, phone));
    } catch (e) {
      setMember(null);
      toast({ tone: 'danger', title: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!member) return;
    setBusy(true);
    try {
      const r = await api.post(`/clubs/v2/gyms/${gymId}/coins/redeem`, { member_phone: member.phone, invoice_inr: Number(bill), coins: Number(coins), reference: ref.trim() })
        .then(x => x.data.data as { redeemed: number; discount_inr: number; balance: number });
      toast({ tone: 'success', title: `${r.redeemed} coins used · ${inr(r.discount_inr)} off`, message: `${r.balance} coins left` });
      onDone();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not apply coins', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Gym Coins" title="Use coins on a bill"
      footer={member ? <Button fullWidth loading={busy} disabled={!Number(coins) || Number(coins) > max || ref.trim().length < 2} onClick={apply}>Apply {coins || 0} coins</Button> : undefined}>
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <TextField label="Member's phone" inputMode="tel" value={phone} onChange={e => { setPhone(e.target.value); setMember(null); }} placeholder="98xxxxxxxx" />
          <Button variant="secondary" loading={busy && !member} disabled={digits(phone).length < 10} onClick={find}>Find</Button>
        </div>
        {member ? (
          <>
            <Card variant="sunken" padding="md">
              <Text variant="bodyStrong">{member.name ?? 'Member'}</Text>
              <Text variant="caption" tone="subtle">{member.coins} Gym Coins · up to {member.coin_cap_pct}% of a bill</Text>
            </Card>
            <TextField label="Bill amount" prefix="₹" inputMode="numeric" value={bill} onChange={e => setBill(digits(e.target.value))} />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <TextField label="Coins to use" inputMode="numeric" value={coins} onChange={e => setCoins(digits(e.target.value))}
                helper={Number(bill) ? `Up to ${max} on this bill` : 'Enter the bill first'} error={Number(coins) > max ? `Max ${max}` : undefined} />
              {max ? <Button size="sm" variant="secondary" className="mt-7" onClick={() => setCoins(String(max))}>Max</Button> : <span />}
            </div>
            <TextField label="Bill / receipt number" value={ref} onChange={e => setRef(e.target.value)} helper="Used once: the same bill can't take coins twice." />
          </>
        ) : null}
      </div>
    </Sheet>
  );
}
