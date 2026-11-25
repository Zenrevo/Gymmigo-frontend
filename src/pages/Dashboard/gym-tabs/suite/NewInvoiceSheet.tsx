import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { Button, Card, Chip, IconButton, Sheet, Skeleton, Text, TextArea, TextField, useToast } from '../../../../components/kit';
import { inr, ownerSuite, type Invoice, type PayMethod } from '../../../../api/ownerSuite';
import api, { getApiErrorMessage } from '../../../../utils/api';
import { Row } from './Row';
import { PAY } from './shared';

type Member = { user_id: string; user_name: string | null; user_phone: string | null };
type Line = { key: string; description: string; quantity: string; rate: string; gst_rate: number | null; hsn: string | null; product_id: string | null };

const digits = (v: string) => v.replace(/\D/g, '');
const newLine = (): Line => ({ key: Math.random().toString(36).slice(2), description: '', quantity: '1', rate: '', gst_rate: null, hsn: null, product_id: null });
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

/** Build an invoice like the app does: member, product lines (with their GST/HSN), discount, due date,
 *  live GST preview and an optional payment taken now (full or part). */
export function NewInvoiceSheet({ gymId, preset, onClose, onCreated }: {
  gymId: string; preset?: Member | null; onClose: () => void; onCreated: (inv: Invoice) => void;
}) {
  const toast = useToast();
  const products = useQuery({ queryKey: ['owner', gymId, 'products'], queryFn: () => ownerSuite.products(gymId) });
  const settings = useQuery({ queryKey: ['owner', gymId, 'billing-settings'], queryFn: () => ownerSuite.billingSettings(gymId) });
  const [member, setMember] = useState<Member | null>(preset ?? null);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<Member[]>([]);
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [discount, setDiscount] = useState('');
  const [due, setDue] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [busy, setBusy] = useState(false);

  const dueDate = due ?? plusDays(settings.data?.default_due_days ?? 0);

  useEffect(() => {
    if (member || search.trim().length < 2) return;
    const t = setTimeout(() => {
      api.get(`/gym-owner/gyms/${gymId}/members`, { params: { search: search.trim(), page_size: 6 } })
        .then(r => setFound((r.data?.data?.members ?? []) as Member[])).catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [gymId, member, search]);

  const items = lines.filter(l => l.description.trim() && Number(l.rate) > 0)
    .map(l => ({ description: l.description.trim(), quantity: Math.max(1, Number(l.quantity) || 1), rate: Number(l.rate), gst_rate: l.gst_rate, hsn: l.hsn, product_id: l.product_id }));
  const previewKey = JSON.stringify([items.map(i => [i.quantity, i.rate, i.gst_rate]), Number(discount) || 0]);
  const totals = useQuery({
    queryKey: ['owner', gymId, 'invoice-preview', previewKey],
    queryFn: () => ownerSuite.previewTotals(gymId, { items: items.map(({ description, quantity, rate, gst_rate }) => ({ description, quantity, rate, gst_rate })), discount: Number(discount) || 0 }),
    enabled: items.length > 0,
    placeholderData: prev => prev,
  });
  const t = items.length ? totals.data : undefined;

  const setLine = (key: string, patch: Partial<Line>) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l)));
  const pickProduct = (key: string, pid: string) => {
    const p = products.data?.find(x => x.id === pid);
    if (p) setLine(key, { description: p.name, rate: String(p.price), gst_rate: p.gst_rate, hsn: p.hsn, product_id: p.id });
  };

  const create = async () => {
    if (!member) return toast({ tone: 'danger', title: 'Pick a member first' });
    if (!items.length) return toast({ tone: 'danger', title: 'Add at least one line with a price' });
    if (t && Number(paid) > t.total) return toast({ tone: 'danger', title: `Paid can't be more than ${inr(t.total)}` });
    setBusy(true);
    try {
      const inv = await ownerSuite.createInvoice(gymId, {
        member_id: member.user_id, items, discount: Number(discount) || 0, due_date: dueDate, notes: notes.trim() || undefined,
        ...(Number(paid) > 0 ? { paid_amount: Number(paid), payment_method: method } : {}),
      });
      toast({ tone: 'success', title: `Invoice ${inv.invoice_number} created`, message: inv.balance_due ? `${inr(inv.balance_due)} due` : 'Paid in full' });
      onCreated(inv);
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not create invoice', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open size="md" onClose={onClose} eyebrow="Billing" title="New invoice"
      footer={<Button fullWidth loading={busy} disabled={!member || !items.length} onClick={create}>Create invoice{t ? ` · ${inr(t.total)}` : ''}</Button>}>
      <div className="space-y-5">
        {/* Member */}
        {member ? (
          <Card variant="sunken" padding="md" className="flex items-center gap-3">
            <div className="min-w-0 flex-1"><Text variant="bodyStrong">{member.user_name ?? 'Member'}</Text><Text variant="caption" tone="subtle">{member.user_phone}</Text></div>
            <IconButton icon={X} label="Change member" onClick={() => { setMember(null); setSearch(''); }} />
          </Card>
        ) : (
          <div className="space-y-2">
            <TextField label="Member" prefix={<Search size={14} />} placeholder="Search by name or phone" value={search} onChange={e => setSearch(e.target.value)} />
            {found.length ? (
              <Card padding="none" className="divide-y divide-line">
                {found.map(m => (
                  <button key={m.user_id} type="button" className="block w-full px-4 py-2 text-left hover:bg-surface-sunken" onClick={() => { setMember(m); setFound([]); }}>
                    <Text variant="bodyStrong">{m.user_name ?? 'Member'}</Text><Text variant="caption" tone="subtle">{m.user_phone}</Text>
                  </button>
                ))}
              </Card>
            ) : null}
          </div>
        )}

        {/* Lines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text variant="label" tone="subtle">Items</Text>
            <Button size="sm" variant="ghost" icon={Plus} onClick={() => setLines(ls => [...ls, newLine()])}>Add line</Button>
          </div>
          {lines.map(l => (
            <Card key={l.key} variant="sunken" padding="md" className="space-y-2">
              {products.data?.length ? (
                <select aria-label="Product" className="w-full rounded-gm-md border border-line bg-surface px-3 py-2 text-sm" value={l.product_id ?? ''}
                  onChange={e => (e.target.value ? pickProduct(l.key, e.target.value) : setLine(l.key, { product_id: null, gst_rate: null, hsn: null }))}>
                  <option value="">Custom item…</option>
                  {products.data.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.name} · {inr(p.price)}{p.gst_rate != null ? ` · GST ${p.gst_rate}%` : ''}</option>)}
                </select>
              ) : null}
              <TextField label="Description" value={l.description} onChange={e => setLine(l.key, { description: e.target.value })} placeholder="e.g. Monthly membership" />
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-end gap-2">
                <TextField label="Qty" inputMode="numeric" value={l.quantity} onChange={e => setLine(l.key, { quantity: digits(e.target.value).slice(0, 3) })} />
                <TextField label="Rate" prefix="₹" inputMode="numeric" value={l.rate} onChange={e => setLine(l.key, { rate: digits(e.target.value) })} />
                {lines.length > 1 ? <IconButton icon={X} label="Remove line" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))} /> : <span />}
              </div>
              {l.gst_rate != null || l.hsn ? <Text variant="caption" tone="subtle">{[l.gst_rate != null ? `GST ${l.gst_rate}%` : null, l.hsn ? `HSN ${l.hsn}` : null].filter(Boolean).join(' · ')}</Text> : null}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="Discount" optional prefix="₹" inputMode="numeric" value={discount} onChange={e => setDiscount(digits(e.target.value))} />
          <TextField label="Due date" type="date" value={dueDate} onChange={e => setDue(e.target.value)} />
        </div>

        {/* Totals */}
        {items.length ? (
          <Card variant="sunken" padding="md">
            {!t ? <Skeleton className="h-16" /> : (
              <>
                <Row label="Subtotal" value={inr(t.subtotal)} />
                {t.discount ? <Row label="Discount" value={`− ${inr(t.discount)}`} /> : null}
                {t.cgst || t.sgst ? <><Row label={`CGST ${(t.gst_rate ?? 0) / 2}%`} value={inr(t.cgst)} /><Row label={`SGST ${(t.gst_rate ?? 0) / 2}%`} value={inr(t.sgst)} /></> : null}
                {t.igst ? <Row label={`IGST ${t.gst_rate}%`} value={inr(t.igst)} /> : null}
                <Row label="Total" value={inr(t.total)} strong />
                {!settings.data?.gst_enabled ? <Text variant="caption" tone="subtle">No GST: add your GSTIN in Billing → settings to charge it.</Text>
                  : t.prices_include_gst ? <Text variant="caption" tone="subtle">Prices include GST.</Text> : null}
              </>
            )}
          </Card>
        ) : null}

        {/* Paid now */}
        <div className="space-y-2">
          <Text variant="label" tone="subtle">Paid now</Text>
          <div className="flex flex-wrap gap-2">{PAY.map(p => <Chip key={p.value} label={p.label} selected={method === p.value} onClick={() => setMethod(p.value)} />)}</div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <TextField label="Amount received" optional prefix="₹" inputMode="numeric" value={paid} onChange={e => setPaid(digits(e.target.value))}
              helper="Leave empty if nothing is paid yet. Less than the total is saved as a part payment." />
            {t ? <Button size="sm" variant="secondary" onClick={() => setPaid(String(t.total))}>Full</Button> : null}
          </div>
        </div>
        <TextArea label="Notes" optional value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
    </Sheet>
  );
}
