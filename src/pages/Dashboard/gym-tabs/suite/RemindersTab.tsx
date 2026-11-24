import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Megaphone } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, PageHeader, Sheet, Skeleton, Text, TextArea, TextField, Toggle, useToast } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { ownerSuite, type ReminderSettings } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';

const KIND: Record<string, string> = {
  expiry: 'Membership ending', due: 'Payment due', overdue: 'Overdue', manual: 'Sent by you', broadcast: 'Broadcast', digest: 'Your daily summary',
  budget_alert: 'Reward budget', low_stock: 'Low stock', pt_assigned: 'PT set up', trainer_invite: 'Trainer invite',
};
const AUD = [['active', 'Active'], ['expiring', 'Ending this week'], ['expired', 'Lapsed'], ['dues', 'With dues'], ['all', 'Everyone']] as const;

/** Automated fee & renewal reminders, the log, and broadcasts. */
export default function RemindersTab() {
  const { gymId } = useGym();
  const toast = useToast();
  const qc = useQueryClient();
  const key = ['owner', gymId, 'reminders'];
  const s = useQuery({ queryKey: [...key, 's'], queryFn: () => ownerSuite.reminderSettings(gymId!), enabled: !!gymId });
  const log = useQuery({ queryKey: [...key, 'log'], queryFn: () => ownerSuite.reminderLog(gymId!), enabled: !!gymId });
  const [bc, setBc] = useState(false);
  const d = s.data ?? null;
  const patch = async (p: Partial<ReminderSettings>) => {
    if (!d || !gymId) return;
    qc.setQueryData([...key, 's'], { ...d, ...p });  // optimistic
    try {
      qc.setQueryData([...key, 's'], await ownerSuite.saveReminderSettings(gymId, p));
    } catch (e) {
      qc.setQueryData([...key, 's'], d);
      toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) });
    }
  };
  if (!gymId) return null;
  const toggles: [keyof ReminderSettings, string, string][] = [
    ['enabled', 'Automatic reminders', 'Expiry, due and overdue nudges every morning (each sent once)'],
    ['push', 'App notification', 'Free and instant'],
    ['whatsapp', 'WhatsApp', d?.whatsapp_configured ? 'Through Gymmigo’s WhatsApp' : 'Not set up yet: push only for now'],
    ['auto_renew_invoice', 'Auto-renew', 'Members on auto-renew get the next period and an invoice'],
    ['owner_digest', 'Morning summary to me', 'What’s due and ending this week'],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Reminders" subtitle="Fee and renewal reminders go out automatically. You can also message members any time."
        actions={<Button size="sm" icon={Megaphone} onClick={() => setBc(true)}>Broadcast</Button>} />
      {!d ? <Skeleton className="h-64" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg" className="space-y-4">
            {toggles.map(([k, label, sub]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <div><Text variant="bodyStrong">{label}</Text><Text variant="caption" tone="subtle">{sub}</Text></div>
                <Toggle checked={!!d[k]} onChange={v => patch({ [k]: v } as Partial<ReminderSettings>)} label={label} disabled={k !== 'enabled' && !d.enabled} />
              </div>
            ))}
          </Card>
          <Card padding="lg" className="space-y-4">
            <div>
              <Text variant="label" tone="subtle">Remind before a membership ends</Text>
              <div className="mt-2 flex flex-wrap gap-2">
                {[14, 7, 5, 3, 2, 1].map(n => (
                  <Chip key={n} label={`${n} day${n > 1 ? 's' : ''}`} selected={d.expiry_days.includes(n)}
                    onClick={() => patch({ expiry_days: d.expiry_days.includes(n) ? d.expiry_days.filter(x => x !== n) : [...d.expiry_days, n].sort((a, b) => b - a).slice(0, 5) })} />
                ))}
              </div>
              <Text variant="caption" tone="subtle">Plus on the last day.</Text>
            </div>
            <div>
              <Text variant="label" tone="subtle">Overdue payments</Text>
              <div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 5, 7].map(n => <Chip key={n} label={`Every ${n} day${n > 1 ? 's' : ''}`} selected={d.overdue_every_days === n} onClick={() => patch({ overdue_every_days: n })} />)}</div>
              <div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 5].map(n => <Chip key={n} label={`At most ${n}×`} selected={d.overdue_max === n} onClick={() => patch({ overdue_max: n })} />)}</div>
            </div>
          </Card>
        </div>
      )}
      <div>
        <Text variant="label" tone="subtle">Sent</Text>
        {!log.data?.length ? <EmptyState compact icon={Bell} title="Nothing sent yet" message="Reminders appear here after the morning run." /> : (
          <Card padding="none" className="mt-2 divide-y divide-line">
            {log.data.slice(0, 100).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1"><Text variant="callout" truncate>{r.member ?? 'You'} · {KIND[r.kind] ?? r.kind}</Text><Text variant="caption" tone="subtle" truncate>{r.title}</Text></div>
                <Badge tone={r.status === 'sent' ? 'success' : 'neutral'} label={r.channels.length ? r.channels.join(' + ') : 'no device'} />
                <Text variant="caption" tone="subtle">{r.at ? new Date(r.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}</Text>
              </div>
            ))}
          </Card>
        )}
      </div>
      {bc ? <BroadcastSheet gymId={gymId} onClose={() => setBc(false)} onSent={() => qc.invalidateQueries({ queryKey: key })} /> : null}
    </div>
  );
}

function BroadcastSheet({ gymId, onClose, onSent }: { gymId: string; onClose: () => void; onSent: () => void }) {
  const toast = useToast();
  const [aud, setAud] = useState<string>('active');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const r = await ownerSuite.broadcast(gymId, { audience: aud, title: title.trim(), body: body.trim() });
      toast({ tone: 'success', title: 'Sent', message: `${r.members} members, ${r.delivered} reached on their phone` });
      onSent();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not send', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Broadcast" title="Message your members" footer={<Button fullWidth loading={busy} disabled={title.trim().length < 2 || body.trim().length < 2} onClick={send}>Send</Button>}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{AUD.map(([v, l]) => <Chip key={v} label={l} selected={aud === v} onClick={() => setAud(v)} />)}</div>
        <TextField label="Title" maxLength={80} value={title} onChange={e => setTitle(e.target.value)} placeholder="Diwali hours" />
        <TextArea label="Message" maxLength={300} value={body} onChange={e => setBody(e.target.value)} placeholder="We're open 6am–10pm tomorrow." />
      </div>
    </Sheet>
  );
}
