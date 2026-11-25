import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Package, Plus, ShoppingCart, X } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, IconButton, PageHeader, SegmentedControl, Sheet, Skeleton, StatTile, Text, TextField, useToast } from '../../../../components/kit';
import { useGym } from '../../../../context/GymContext';
import { coinCap, inr, ownerSuite, type Invoice, type PayMethod, type PosMember, type Product, type Totals } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';
import { Row } from './Row';
import { PAY } from './shared';
import { ProductSheet } from './ProductSheet';

const digits = (v: string) => v.replace(/\D/g, '');

/** Desk POS: sell (GST, coins, payment method), products with stock, today's sales. */
export default function PosTab() {
  const { gymId } = useGym();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'sell' | 'stock' | 'today'>('sell');
  const products = useQuery({ queryKey: ['owner', gymId, 'products'], queryFn: () => ownerSuite.products(gymId!), enabled: !!gymId });
  if (!gymId) return null;
  const refresh = () => qc.invalidateQueries({ queryKey: ['owner', gymId] });
  const list = (products.data ?? []).filter(p => p.is_active !== false);
  return (
    <div className="space-y-6">
      <PageHeader title="Point of sale" subtitle="Sell supplements, merch and services at the desk, with GST and stock." />
      <SegmentedControl options={[{ value: 'sell', label: 'Sell' }, { value: 'stock', label: 'Products & stock' }, { value: 'today', label: 'Today' }]} value={tab} onChange={setTab} />
      {products.isLoading ? <Skeleton className="h-64" /> : tab === 'sell' ? (
        list.length ? <Sell gymId={gymId} products={list} onSold={refresh} /> : <EmptyState icon={Package} title="No products yet" message="Add products in the Products & stock tab." />
      ) : tab === 'stock' ? <Stock gymId={gymId} products={list} onChanged={refresh} /> : <Today gymId={gymId} />}
    </div>
  );
}

function Sell({ gymId, products, onSold }: { gymId: string; products: Product[]; onSold: () => void }) {
  const toast = useToast();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [phone, setPhone] = useState('');
  const [member, setMember] = useState<PosMember | null>(null);
  const [walkIn, setWalkIn] = useState('');
  const [discount, setDiscount] = useState('');
  const [coins, setCoins] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [totals, setTotals] = useState<Totals | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Invoice | null>(null);
  const lines = useMemo(() => Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ p: products.find(x => x.id === id)!, n })).filter(l => l.p), [cart, products]);
  const add = (p: Product, d: number) => {
    const next = Math.max(0, (cart[p.id] ?? 0) + d);
    if (d > 0 && p.track_stock && next > p.stock_qty) return toast({ tone: 'info', title: `Only ${p.stock_qty} ${p.name} left` });
    setCart(c => ({ ...c, [p.id]: next }));
  };
  useEffect(() => {
    if (!lines.length) { setTotals(null); return; }
    const t = setTimeout(() => {
      ownerSuite.previewTotals(gymId, { items: lines.map(l => ({ description: l.p.name, quantity: l.n, rate: l.p.price, ...(l.p.gst_rate != null ? { gst_rate: l.p.gst_rate } : {}) })), discount: Number(discount) || 0 })
        .then(setTotals).catch(() => setTotals(null));
    }, 300);
    return () => clearTimeout(t);
  }, [lines, discount, gymId]);
  const total = totals?.total ?? lines.reduce((n, l) => n + l.n * l.p.price, 0) - (Number(discount) || 0);
  const maxCoins = member ? coinCap(total, member.coins, member.coin_cap_pct) : 0;
  const coinAmt = Math.min(Number(coins) || 0, maxCoins);
  const toPay = Math.max(0, total - coinAmt);
  const find = async () => {
    try { setMember(await ownerSuite.posMember(gymId, digits(phone))); } catch (e) { toast({ tone: 'danger', title: 'Member not found', message: getApiErrorMessage(e) }); }
  };
  const charge = async () => {
    setBusy(true);
    try {
      const inv = await ownerSuite.sale(gymId, { lines: lines.map(l => ({ product_id: l.p.id, quantity: l.n })), member_id: member?.user_id, customer_name: member ? undefined : walkIn.trim() || undefined,
        discount: Number(discount) || undefined, coins: coinAmt || undefined, payments: toPay ? [{ method, amount: toPay }] : [] });
      setReceipt(inv); setCart({}); setDiscount(''); setCoins(''); setMember(null); setPhone(''); setWalkIn('');
      onSold();
    } catch (e) {
      toast({ tone: 'danger', title: 'Sale not recorded', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.filter(p => p.price > 0).map(p => {
          const out = p.track_stock && p.stock_qty <= 0;
          const n = cart[p.id] ?? 0;
          return (
            <Card key={p.id} padding="md" onClick={out ? undefined : () => add(p, 1)} variant={n ? 'accent' : 'surface'} className={out ? 'opacity-50' : 'cursor-pointer'}>
              <Text variant="callout">{p.name}</Text>
              <div className="mt-1 flex items-center justify-between">
                <Text variant="bodyStrong">{inr(p.price)}</Text>
                {n ? <Badge tone="accent" label={`× ${n}`} /> : p.track_stock ? <Text variant="caption" tone={p.low_stock ? 'danger' : 'subtle'}>{out ? 'Out' : `${p.stock_qty} left`}</Text> : null}
              </div>
            </Card>
          );
        })}
      </div>
      <Card padding="lg" className="h-fit space-y-4">
        <Text variant="title">Bill</Text>
        {!lines.length ? <Text variant="caption" tone="subtle">Click products to add them.</Text> : lines.map(l => (
          <div key={l.p.id} className="flex items-center gap-2">
            <Text variant="body" className="flex-1" truncate>{l.p.name}</Text>
            <IconButton icon={Minus} label={`One less ${l.p.name}`} onClick={() => add(l.p, -1)} />
            <Text variant="bodyStrong" className="w-6 text-center">{l.n}</Text>
            <IconButton icon={Plus} label={`One more ${l.p.name}`} onClick={() => add(l.p, 1)} />
          </div>
        ))}
        {member ? (
          <Card variant="sunken" padding="md">
            <div className="flex items-start justify-between gap-2">
              <div><Text variant="bodyStrong">{member.name ?? member.phone}</Text><Text variant="caption" tone="subtle">{member.coins} Gym Coins · up to {maxCoins} on this bill</Text></div>
              <IconButton icon={X} label="Remove member" onClick={() => setMember(null)} />
            </div>
            {member.coins ? <TextField label="Use coins" inputMode="numeric" value={coins} onChange={e => setCoins(digits(e.target.value))} error={Number(coins) > maxCoins ? `Up to ${maxCoins} coins on this bill` : undefined} /> : null}
          </Card>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1"><TextField label="Member phone" optional inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <Button variant="secondary" onClick={find} disabled={digits(phone).length < 10}>Find</Button>
          </div>
        )}
        {!member ? <TextField label="Walk-in name" optional value={walkIn} onChange={e => setWalkIn(e.target.value)} /> : null}
        <TextField label="Discount" optional prefix="₹" inputMode="numeric" value={discount} onChange={e => setDiscount(digits(e.target.value))} />
        <div>
          {totals?.tax ? <Row label="GST" value={inr(totals.tax)} /> : null}
          <Row label="Total" value={inr(total)} strong />
          {coinAmt ? <Row label="Gym Coins" value={`− ${inr(coinAmt)}`} tone="success" /> : null}
          <Row label="To pay" value={inr(toPay)} strong />
        </div>
        <div className="flex flex-wrap gap-2">{PAY.map(p => <Chip key={p.value} label={p.label} selected={method === p.value} onClick={() => setMethod(p.value)} />)}</div>
        <Button fullWidth icon={ShoppingCart} loading={busy} disabled={!lines.length || Number(coins) > maxCoins} onClick={charge}>Charge {inr(toPay)}</Button>
      </Card>
      {receipt ? (
        <Sheet open onClose={() => setReceipt(null)} eyebrow="Sale recorded" title={receipt.invoice_number}
          footer={receipt.share_url ? <Button fullWidth href={receipt.share_url} target="_blank">Open receipt</Button> : undefined}>
          {receipt.items.map((it, i) => <Row key={i} label={`${it.description} × ${it.quantity}`} value={inr(it.amount)} />)}
          {receipt.tax_amount ? <Row label="GST" value={inr(receipt.tax_amount)} /> : null}
          {receipt.coins_applied ? <Row label="Gym Coins" value={`− ${inr(receipt.coins_applied)}`} /> : null}
          <Row label="Total" value={inr(receipt.total_amount)} strong />
        </Sheet>
      ) : null}
    </div>
  );
}

function Stock({ gymId, products, onChanged }: { gymId: string; products: Product[]; onChanged: () => void }) {
  const [edit, setEdit] = useState<Product | 'new' | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" icon={Plus} onClick={() => setEdit('new')}>Add product</Button></div>
      <Card padding="none" className="divide-y divide-line">
        {products.map(p => (
          <button key={p.id} type="button" onClick={() => setEdit(p)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-sunken">
            <div className="min-w-0 flex-1"><Text variant="bodyStrong">{p.name}</Text><Text variant="caption" tone="subtle">{inr(p.price)}{p.gst_rate != null ? ` · GST ${p.gst_rate}%` : ''}{p.hsn ? ` · HSN ${p.hsn}` : ''}</Text></div>
            {p.track_stock ? <Badge tone={p.low_stock ? 'danger' : 'neutral'} label={`${p.stock_qty} in stock`} /> : <Text variant="caption" tone="subtle">Not tracked</Text>}
          </button>
        ))}
      </Card>
      {edit ? <ProductSheet gymId={gymId} product={edit} onClose={() => setEdit(null)} onSaved={onChanged} /> : null}
    </div>
  );
}

function Today({ gymId }: { gymId: string }) {
  const q = useQuery({ queryKey: ['owner', gymId, 'pos-today'], queryFn: () => ownerSuite.sales(gymId) });
  if (!q.data) return <Skeleton className="h-48" />;
  const r = q.data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Sales today" value={inr(r.total)} caption={`${r.sales} bills`} emphasis />
        <StatTile label="GST" value={inr(r.gst)} caption="collected" />
        <Card padding="md">{Object.entries(r.by_method).map(([m, v]) => <Row key={m} label={m.toUpperCase()} value={inr(v)} />)}{!Object.keys(r.by_method).length ? <Text variant="caption" tone="subtle">No sales yet today.</Text> : null}</Card>
      </div>
      <Card padding="lg">
        {r.invoices.length ? r.invoices.map(i => <Row key={i.id} label={`${i.at ? new Date(i.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''} · ${i.invoice_number}${i.customer ? ` · ${i.customer}` : ''}`} value={i.status === 'canceled' ? 'cancelled' : inr(i.total)} />)
          : <Text variant="caption" tone="subtle">No bills yet.</Text>}
      </Card>
    </div>
  );
}
