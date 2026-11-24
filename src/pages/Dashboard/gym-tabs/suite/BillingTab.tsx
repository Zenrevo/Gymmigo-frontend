import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, FileText, Settings, Share2, Wallet } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, PageHeader, Sheet, Skeleton, StatTile, Text, TextArea, TextField, Toggle, useToast } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { inr, ownerSuite, type BillingSettings, type DueItem, type PayMethod } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';
import { Row } from './Row';
import { PAY } from './shared';

const digits = (v: string) => v.replace(/\D/g, '');
const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');

/** Billing & dues: what's owed, (part) payments, reminders, invoice links, GST settings. */
export default function BillingTab() {
  const { gymId } = useGym();
  const qc = useQueryClient();
  const toast = useToast();
  const dues = useQuery({ queryKey: ['owner', gymId, 'dues'], queryFn: () => ownerSuite.dues(gymId!), enabled: !!gymId });
  const settings = useQuery({ queryKey: ['owner', gymId, 'billing-settings'], queryFn: () => ownerSuite.billingSettings(gymId!), enabled: !!gymId });
  const [open, setOpen] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['owner', gymId] });
  const remind = async (d: DueItem) => {
    if (!d.member_id) return;
    try {
      await ownerSuite.remind(gymId!, d.member_id, { kind: 'dues' });
      toast({ tone: 'success', title: 'Reminder sent', message: `${d.name ?? 'Member'} · ${inr(d.balance)}` });
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not send', message: getApiErrorMessage(e) });
    }
  };
  if (!gymId) return null;
  const d = dues.data;
  const s = settings.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Billing & dues" subtitle={s?.gst_enabled ? `GST ${s.gst_rate}% · ${s.gstin} · next ${s.next_number_preview}` : 'Plain bills: add your GSTIN in settings to charge GST.'}
        actions={<Button variant="secondary" size="sm" icon={Settings} onClick={() => setSettingsOpen(true)}>Invoice & GST settings</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Due" value={inr(d?.total_due)} caption={`${d?.count ?? 0} open`} emphasis />
        <StatTile label="Overdue" value={inr(d?.overdue)} caption="past due date" captionTone={d?.overdue ? 'danger' : 'subtle'} />
        <Card padding="md" className="flex flex-col justify-center gap-2">
          <Text variant="footnote" tone="muted">Every invoice, expense and product</Text>
          <Button variant="secondary" size="sm" to={`/app/gym-owner/gyms/${gymId}/finance`}>Open Finance</Button>
        </Card>
      </div>
      {dues.isLoading ? <Skeleton className="h-48" /> : dues.isError ? <ErrorState onRetry={() => dues.refetch()} /> : !d?.items.length ? (
        <EmptyState icon={Wallet} title="Nothing due" message="Every invoice is paid. New dues appear here with one-click reminders." />
      ) : (
        <Card padding="none" className="divide-y divide-line">
          {d.items.map(item => (
            <div key={item.invoice_id ?? item.membership_id ?? item.name ?? ''} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Text variant="bodyStrong">
                  {item.member_id ? <Link className="hover:underline" to={`/app/gym-owner/gyms/${gymId}/members/${item.member_id}`}>{item.name ?? 'Member'}</Link> : item.name ?? 'Walk-in'}
                </Text>
                <Text variant="caption" tone="subtle">{item.invoice_number ?? 'Membership not invoiced'} · due {day(item.due_date)}</Text>
              </div>
              <div className="text-right">
                <Text variant="bodyStrong">{inr(item.balance)}</Text>
                {item.days_overdue > 0 ? <Badge tone="danger" label={`${item.days_overdue}d late`} /> : item.paid > 0 ? <Badge tone="warning" label="Part paid" /> : null}
              </div>
              <div className="flex gap-2">
                {item.invoice_id ? <Button size="sm" onClick={() => setOpen(item.invoice_id)}>Record payment</Button> : null}
                <Button size="sm" variant="secondary" icon={Bell} onClick={() => remind(item)}>Remind</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      {open ? <InvoiceSheet gymId={gymId} invoiceId={open} onClose={() => setOpen(null)} onChanged={refresh} /> : null}
      {s && settingsOpen ? <SettingsSheet gymId={gymId} current={s} onClose={() => setSettingsOpen(false)} onSaved={refresh} /> : null}
    </div>
  );
}

/** One invoice: GST breakdown, payments, take a (part) payment, share link, PDF. */
export function InvoiceSheet({ gymId, invoiceId, onClose, onChanged }: { gymId: string; invoiceId: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['owner', gymId, 'invoice', invoiceId], queryFn: () => ownerSuite.invoice(gymId, invoiceId) });
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const inv = q.data;
  const open = inv && ['pending', 'partial', 'overdue'].includes(inv.status);
  const pay = async () => {
    if (!inv) return;
    setBusy(true);
    try {
      const r = await ownerSuite.addPayment(gymId, invoiceId, { amount: Number(amount) || inv.balance_due, method, reference: ref.trim() || undefined });
      qc.setQueryData(['owner', gymId, 'invoice', invoiceId], r);
      toast({ tone: 'success', title: r.status === 'paid' ? 'Paid in full' : 'Part payment recorded', message: r.balance_due ? `${inr(r.balance_due)} still due` : undefined });
      setAmount('');
      setRef('');
      onChanged();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not record payment', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!inv?.share_url) return;
    await navigator.clipboard?.writeText(inv.share_url).catch(() => undefined);
    toast({ tone: 'success', title: 'Invoice link copied' });
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Invoice" title={inv?.invoice_number ?? 'Invoice'}
      footer={open ? <Button fullWidth loading={busy} onClick={pay}>Record {amount ? inr(Number(amount)) : inr(inv?.balance_due)}</Button> : undefined}>
      {!inv ? <Skeleton className="h-48" /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text variant="title">{inv.member_name ?? inv.customer_name ?? 'Member'}</Text>
            <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : inv.status === 'partial' ? 'warning' : 'neutral'} label={inv.status} />
          </div>
          <Card variant="sunken" padding="md">
            {inv.items.map((it, i) => <Row key={i} label={`${it.description} × ${it.quantity}`} value={inr(it.amount)} />)}
            {inv.discount_amount ? <Row label="Discount" value={`− ${inr(inv.discount_amount)}`} /> : null}
            {inv.cgst || inv.sgst ? <><Row label={`CGST ${(inv.gst_rate ?? 0) / 2}%`} value={inr(inv.cgst)} /><Row label={`SGST ${(inv.gst_rate ?? 0) / 2}%`} value={inr(inv.sgst)} /></> : null}
            {inv.igst ? <Row label={`IGST ${inv.gst_rate}%`} value={inr(inv.igst)} /> : null}
            <Row label="Total" value={inr(inv.total_amount)} strong />
            {inv.amount_paid ? <Row label="Paid" value={inr(inv.amount_paid)} tone="success" /> : null}
            {inv.balance_due ? <Row label="Balance due" value={inr(inv.balance_due)} strong tone="danger" /> : null}
          </Card>
          {inv.payments?.length ? (
            <div>
              <Text variant="label" tone="subtle">Payments</Text>
              {inv.payments.map(p => <Row key={p.id} label={`${day(p.paid_at)} · ${p.method.toUpperCase()}${p.reference ? ` · ${p.reference}` : ''}`} value={inr(p.amount)} />)}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {inv.share_url ? <Button size="sm" variant="secondary" icon={Share2} onClick={copy}>Copy link</Button> : null}
            {inv.share_url ? <Button size="sm" variant="secondary" icon={FileText} href={inv.share_url} target="_blank">PDF</Button> : null}
          </div>
          {open ? (
            <div className="space-y-3">
              <Text variant="label" tone="subtle">Take a payment</Text>
              <div className="flex flex-wrap gap-2">{PAY.map(p => <Chip key={p.value} label={p.label} selected={method === p.value} onClick={() => setMethod(p.value)} />)}</div>
              <TextField label="Amount" prefix="₹" inputMode="numeric" placeholder={String(inv.balance_due)} value={amount} onChange={e => setAmount(digits(e.target.value))}
                helper="Leave empty for the full balance. Less is saved as a part payment." />
              {method !== 'cash' ? <TextField label="Reference" optional value={ref} onChange={e => setRef(e.target.value)} placeholder="UTR / last 4 digits" /> : null}
            </div>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

function SettingsSheet({ gymId, current, onClose, onSaved }: { gymId: string; current: BillingSettings; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    legal_name: current.legal_name ?? '', gstin: current.gstin ?? '', gst_rate: current.gst_rate ? String(current.gst_rate) : '18',
    prices_include_gst: current.prices_include_gst, invoice_prefix: current.invoice_prefix ?? '', upi_id: current.upi_id ?? '',
    default_due_days: String(current.default_due_days ?? 0), terms: current.terms ?? '',
  });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await ownerSuite.saveBillingSettings(gymId, {
        legal_name: f.legal_name.trim() || null, gstin: f.gstin.trim().toUpperCase() || null, gst_rate: f.gstin.trim() ? Number(f.gst_rate) || null : null,
        prices_include_gst: f.prices_include_gst, invoice_prefix: f.invoice_prefix.trim().toUpperCase() || null, upi_id: f.upi_id.trim() || null,
        default_due_days: Number(f.default_due_days) || 0, terms: f.terms.trim() || null,
      });
      toast({ tone: 'success', title: 'Billing settings saved', message: `Next invoice: ${r.next_number_preview}` });
      onSaved();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Billing" title="Invoices & GST" footer={<Button fullWidth loading={busy} onClick={save}>Save</Button>}>
      <div className="space-y-4">
        <TextField label="Business name on invoices" optional value={f.legal_name} onChange={e => setF({ ...f, legal_name: e.target.value })} />
        <TextField label="GSTIN" optional maxLength={15} value={f.gstin} onChange={e => setF({ ...f, gstin: e.target.value.toUpperCase() })} placeholder="29ABCDE1234F1Z5"
          helper="Leave empty if you're not GST-registered: invoices go out as plain bills." />
        {f.gstin.trim() ? (
          <>
            <div className="flex gap-2">{['5', '12', '18'].map(r => <Chip key={r} label={`${r}%`} selected={f.gst_rate === r} onClick={() => setF({ ...f, gst_rate: r })} />)}</div>
            <Toggle checked={f.prices_include_gst} onChange={v => setF({ ...f, prices_include_gst: v })} label="My prices already include GST" />
          </>
        ) : null}
        <TextField label="Invoice prefix" optional maxLength={12} value={f.invoice_prefix} onChange={e => setF({ ...f, invoice_prefix: e.target.value.toUpperCase() })}
          helper={`Numbers run per financial year, e.g. ${current.next_number_preview}`} />
        <TextField label="UPI ID on bills" optional value={f.upi_id} onChange={e => setF({ ...f, upi_id: e.target.value })} />
        <TextField label="Payment due after (days)" inputMode="numeric" value={f.default_due_days} onChange={e => setF({ ...f, default_due_days: digits(e.target.value) })} />
        <TextArea label="Terms (one per line)" optional value={f.terms} onChange={e => setF({ ...f, terms: e.target.value })} />
      </div>
    </Sheet>
  );
}
