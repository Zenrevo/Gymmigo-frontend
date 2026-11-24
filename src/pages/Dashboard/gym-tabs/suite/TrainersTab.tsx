import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Dumbbell, UserPlus, Users } from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, EmptyState, PageHeader, SegmentedControl, Sheet, Skeleton, StatTile, Text, TextField, confirmDialog, useToast } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { inr, ownerSuite, type GymTrainer, type PayMethod, type PtAllocation } from '../../../../api/ownerSuite';
import api, { getApiErrorMessage } from '../../../../utils/api';
import { Row } from './Row';
import { PAY } from './shared';

const digits = (v: string) => v.replace(/\D/g, '');
type Tab = 'trainers' | 'pt' | 'payouts';

/** Trainers at the gym, PT allocation (billed by the gym) and monthly payouts. */
export default function TrainersTab() {
  const { gymId } = useGym();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get('tab') as Tab) || 'trainers');
  const enabled = !!gymId;
  const trainers = useQuery({ queryKey: ['owner', gymId, 'trainers'], queryFn: () => ownerSuite.trainers(gymId!), enabled });
  const pt = useQuery({ queryKey: ['owner', gymId, 'pt'], queryFn: () => ownerSuite.pt(gymId!), enabled });
  const pending = useQuery({ queryKey: ['owner', gymId, 'pt-pending'], queryFn: () => ownerSuite.pendingPt(gymId!), enabled });
  const payouts = useQuery({ queryKey: ['owner', gymId, 'payouts'], queryFn: () => ownerSuite.payouts(gymId!), enabled: enabled && tab === 'payouts' });
  const [invite, setInvite] = useState(false);
  const [editing, setEditing] = useState<GymTrainer | null>(null);
  const [assign, setAssign] = useState<{ memberId?: string; memberName?: string; sessions?: number } | null>(sp.get('assign') ? { memberId: sp.get('assign')!, memberName: sp.get('name') ?? undefined } : null);
  if (!gymId) return null;
  const refresh = () => qc.invalidateQueries({ queryKey: ['owner', gymId] });
  const active = (trainers.data ?? []).filter(t => t.status === 'accepted');
  return (
    <div className="space-y-6">
      <PageHeader title="Trainers & PT" subtitle="Who trains here, who they train, and what they earn."
        actions={<Button size="sm" icon={UserPlus} onClick={() => (tab === 'pt' ? setAssign({}) : setInvite(true))}>{tab === 'pt' ? 'Allocate PT' : 'Invite trainer'}</Button>} />
      <SegmentedControl options={[{ value: 'trainers', label: 'Trainers' }, { value: 'pt', label: 'PT' }, { value: 'payouts', label: 'Payouts' }]} value={tab} onChange={setTab} />
      {tab === 'trainers' ? (
        trainers.isLoading ? <Skeleton className="h-40" /> : !trainers.data?.length ? (
          <EmptyState icon={Dumbbell} title="No trainers yet" message="Invite trainers by their Gymmigo phone number. They accept in their app." actionLabel="Invite a trainer" onAction={() => setInvite(true)} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {trainers.data.map(t => (
              <Card key={t.affiliation_id} padding="lg" onClick={t.status === 'accepted' ? () => setEditing(t) : undefined} className={t.status === 'accepted' ? 'cursor-pointer' : ''}>
                <div className="flex items-center gap-3">
                  <Avatar name={t.name ?? ''} src={t.avatar_url ?? undefined} size={44} />
                  <div className="min-w-0 flex-1">
                    <Text variant="bodyStrong">{t.name ?? t.phone}</Text>
                    <Text variant="caption" tone="subtle">{t.status === 'pending' ? 'Invitation sent' : `${t.active_clients} clients · ${t.sessions_this_month} sessions this month`}</Text>
                  </div>
                  {t.status === 'pending' ? <Badge tone="warning" label="Pending" /> : t.rating ? <Badge label={`★ ${t.rating.toFixed(1)}`} /> : null}
                </div>
                {t.status === 'accepted' ? <div className="mt-3"><Row label="PT collected this month" value={inr(t.pt_revenue_this_month)} /><Row label={`Their share (${t.commission_pct ?? 0}%${t.monthly_fee ? ` + ${inr(t.monthly_fee)}` : ''})`} value={inr(t.commission_this_month)} /></div> : null}
              </Card>
            ))}
          </div>
        )
      ) : tab === 'pt' ? (
        <div className="space-y-4">
          {pending.data?.length ? (
            <Card padding="lg">
              <Text variant="label" tone="subtle">Plan includes PT: allocate a trainer</Text>
              {pending.data.map(p => (
                <div key={p.membership_id} className="mt-2 flex items-center justify-between gap-3">
                  <div><Text variant="callout">{p.member}</Text><Text variant="caption" tone="subtle">{p.plan} · {p.sessions_included} sessions included</Text></div>
                  <Button size="sm" onClick={() => setAssign({ memberId: p.member_id, memberName: p.member ?? undefined, sessions: p.sessions_included || undefined })}>Allocate</Button>
                </div>
              ))}
            </Card>
          ) : null}
          {pt.isLoading ? <Skeleton className="h-40" /> : !pt.data?.length ? (
            <EmptyState icon={Users} title="No PT allocated" message="Pair a member with a trainer and set sessions and price; the gym bills it." actionLabel="Allocate PT" onAction={() => setAssign({})} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">{pt.data.map(p => <PtCard key={p.id} gymId={gymId} p={p} trainers={active} onChanged={refresh} />)}</div>
          )}
        </div>
      ) : payouts.data ? (
        <div className="space-y-3">
          <StatTile label={`Payouts · ${payouts.data.month}`} value={inr(payouts.data.total_payout)} caption="commission + fixed fees" emphasis />
          <Card padding="lg">
            {payouts.data.trainers.map(r => <Row key={r.trainer_id} label={`${r.name} · ${r.sessions} sessions · ${inr(r.pt_collected)} PT at ${r.commission_pct}%${r.monthly_fee ? ` + ${inr(r.monthly_fee)}` : ''}`} value={inr(r.payout)} strong />)}
            {!payouts.data.trainers.length ? <Text variant="caption" tone="subtle">No trainers yet.</Text> : null}
          </Card>
        </div>
      ) : <Skeleton className="h-40" />}
      {invite ? <InviteSheet gymId={gymId} onClose={() => setInvite(false)} onDone={refresh} /> : null}
      {editing ? <TrainerSheet gymId={gymId} t={editing} onClose={() => setEditing(null)} onDone={refresh} /> : null}
      {assign ? <AssignSheet gymId={gymId} preset={assign} trainers={active} onClose={() => setAssign(null)} onDone={() => { refresh(); setTab('pt'); }} /> : null}
    </div>
  );
}

function PtCard({ gymId, p, trainers, onChanged }: { gymId: string; p: PtAllocation; trainers: GymTrainer[]; onChanged: () => void }) {
  const toast = useToast();
  const run = async (body: Record<string, unknown>, ok: string) => {
    try { await ownerSuite.updatePt(gymId, p.id, body); toast({ tone: 'success', title: ok }); onChanged(); } catch (e) { toast({ tone: 'danger', title: 'Could not update', message: getApiErrorMessage(e) }); }
  };
  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-2">
        <div><Text variant="bodyStrong"><Link className="hover:underline" to={`/app/gym-owner/gyms/${gymId}/members/${p.member_id}`}>{p.member}</Link></Text><Text variant="caption" tone="subtle">with {p.trainer} · until {p.end_date}</Text></div>
        <Badge tone={p.status === 'confirmed' ? 'success' : 'neutral'} label={p.status === 'confirmed' ? `${p.sessions_left} left` : p.status} />
      </div>
      <div className="mt-2"><Row label={`${p.sessions_used}/${p.sessions_total} sessions used`} value={inr(p.price)} />{p.balance_due ? <Row label={`Due on ${p.invoice_number}`} value={inr(p.balance_due)} tone="danger" /> : null}</div>
      {p.status === 'confirmed' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip label="+4 sessions" onClick={() => run({ add_sessions: 4 }, '4 sessions added')} />
          {trainers.filter(t => t.trainer_id !== p.trainer_id).slice(0, 3).map(t => <Chip key={t.trainer_id} label={`Move to ${t.name?.split(' ')[0]}`} onClick={() => run({ trainer_id: t.trainer_id }, `Now with ${t.name}`)} />)}
          <Chip label="End" onClick={async () => { if (await confirmDialog({ title: 'End this PT?', message: 'Remaining sessions are cancelled. Money already paid is not refunded automatically.', confirmLabel: 'End PT', tone: 'danger' })) run({ status: 'cancelled' }, 'PT ended'); }} />
        </div>
      ) : null}
    </Card>
  );
}

function InviteSheet({ gymId, onClose, onDone }: { gymId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ phone: '', pct: '40', fee: '', msg: '' });
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await ownerSuite.inviteTrainer(gymId, { phone: digits(f.phone), commission_pct: f.pct ? Number(f.pct) : undefined, monthly_fee: f.fee ? Number(f.fee) : undefined, message: f.msg.trim() || undefined });
      toast({ tone: 'success', title: 'Invitation sent', message: 'They accept it in their Gymmigo app.' });
      onDone();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not invite', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Trainers" title="Invite a trainer" footer={<Button fullWidth loading={busy} disabled={digits(f.phone).length < 10} onClick={send}>Send invitation</Button>}>
      <div className="space-y-4">
        <TextField label="Trainer's phone" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} helper="They need a Gymmigo trainer profile." />
        <TextField label="Their share of PT they sell" suffix="%" inputMode="numeric" value={f.pct} onChange={e => setF({ ...f, pct: digits(e.target.value).slice(0, 3) })} />
        <TextField label="Fixed monthly fee" optional prefix="₹" inputMode="numeric" value={f.fee} onChange={e => setF({ ...f, fee: digits(e.target.value) })} />
        <TextField label="Message" optional value={f.msg} onChange={e => setF({ ...f, msg: e.target.value })} />
      </div>
    </Sheet>
  );
}

function TrainerSheet({ gymId, t, onClose, onDone }: { gymId: string; t: GymTrainer; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [pct, setPct] = useState(String(t.commission_pct ?? ''));
  const [fee, setFee] = useState(String(t.monthly_fee ?? ''));
  const save = async (end = false) => {
    try {
      await ownerSuite.updateTrainer(gymId, t.affiliation_id, end ? { end: true } : { commission_pct: Number(pct) || 0, monthly_fee: Number(fee) || 0 });
      toast({ tone: 'success', title: end ? `${t.name} no longer works here` : 'Saved' });
      onDone();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) });
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Trainer" title={t.name ?? 'Trainer'} footer={<Button fullWidth onClick={() => save()}>Save</Button>}>
      <div className="space-y-4">
        <Row label="Rate" value={t.session_rate ? `${inr(t.session_rate)} / session` : '—'} />
        <Row label="Experience" value={t.experience_years ? `${t.experience_years} years` : '—'} />
        <TextField label="Share of PT" suffix="%" inputMode="numeric" value={pct} onChange={e => setPct(digits(e.target.value).slice(0, 3))} />
        <TextField label="Fixed monthly fee" prefix="₹" inputMode="numeric" value={fee} onChange={e => setFee(digits(e.target.value))} />
        <Button variant="ghost" onClick={async () => { if (await confirmDialog({ title: `Remove ${t.name}?`, message: 'Their current PT stays until it ends.', confirmLabel: 'Remove', tone: 'danger' })) save(true); }}>Remove from this gym</Button>
      </div>
    </Sheet>
  );
}

function AssignSheet({ gymId, preset, trainers, onClose, onDone }: { gymId: string; preset: { memberId?: string; memberName?: string; sessions?: number }; trainers: GymTrainer[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [member, setMember] = useState<{ id: string; name: string } | null>(preset.memberId ? { id: preset.memberId, name: preset.memberName ?? 'Member' } : null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [trainer, setTrainer] = useState(trainers[0]?.trainer_id ?? '');
  const [sessions, setSessions] = useState(String(preset.sessions ?? 8));
  const [price, setPrice] = useState('');
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (member || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/gym-owner/gyms/${gymId}/members`, { params: { search: q.trim(), page_size: 6 } })
        .then(r => setResults((r.data.data?.members ?? []).map((m: { user_id: string; user_name?: string; user_phone?: string }) => ({ id: m.user_id, name: m.user_name ?? 'Member', phone: m.user_phone }))))
        .catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(t);
  }, [q, member, gymId]);
  const save = async () => {
    if (!member || !trainer) return;
    setBusy(true);
    try {
      const r = await ownerSuite.assignPt(gymId, { member_id: member.id, trainer_id: trainer, sessions: Number(sessions) || 1, price: Number(price) || 0, paid_amount: Number(paid) || 0, payment_method: method });
      toast({ tone: 'success', title: 'PT allocated', message: `${member.name} × ${r.trainer} · ${r.sessions_total} sessions` });
      onDone();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not allocate', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Personal training" title="Allocate PT" footer={<Button fullWidth loading={busy} disabled={!member || !trainer} onClick={save}>Allocate</Button>}>
      <div className="space-y-4">
        {member ? (
          <Card variant="sunken" padding="md" className="flex items-center justify-between"><Text variant="bodyStrong">{member.name}</Text>{!preset.memberId ? <Button size="sm" variant="ghost" onClick={() => setMember(null)}>Change</Button> : null}</Card>
        ) : (
          <div className="space-y-2">
            <TextField label="Member" placeholder="Search name or phone" value={q} onChange={e => setQ(e.target.value)} />
            {results.map(m => <button key={m.id} type="button" className="block w-full rounded-gm-md bg-surface-sunken px-3 py-2 text-left" onClick={() => setMember(m)}><Text variant="callout">{m.name}</Text><Text variant="caption" tone="subtle">{m.phone}</Text></button>)}
          </div>
        )}
        {trainers.length ? <div className="flex flex-wrap gap-2">{trainers.map(t => <Chip key={t.trainer_id} label={t.name ?? 'Trainer'} selected={trainer === t.trainer_id} onClick={() => setTrainer(t.trainer_id)} />)}</div>
          : <Text variant="caption" tone="danger">Invite a trainer first. They need to accept before you can allocate PT.</Text>}
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Sessions" inputMode="numeric" value={sessions} onChange={e => setSessions(digits(e.target.value))} />
          <TextField label="Price" prefix="₹" inputMode="numeric" value={price} onChange={e => setPrice(digits(e.target.value))} />
        </div>
        <TextField label="Paid now" optional prefix="₹" inputMode="numeric" value={paid} onChange={e => setPaid(digits(e.target.value))} helper="The rest shows in Billing as due." />
        {Number(paid) ? <div className="flex flex-wrap gap-2">{PAY.map(p => <Chip key={p.value} label={p.label} selected={method === p.value} onClick={() => setMethod(p.value)} />)}</div> : null}
      </div>
    </Sheet>
  );
}
