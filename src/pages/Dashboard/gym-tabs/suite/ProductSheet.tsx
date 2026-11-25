import { useState } from 'react';
import { Button, Card, Chip, Sheet, Text, TextField, Toggle, useToast } from '../../../../components/kit';
import { ownerSuite, type Product } from '../../../../api/ownerSuite';
import { getApiErrorMessage } from '../../../../utils/api';

const digits = (v: string) => v.replace(/\D/g, '');
const CATEGORIES: [string, string][] = [['retail', 'Retail'], ['service', 'Service'], ['supplement', 'Supplement'], ['merch', 'Merch']];

/** Add or edit a product: price, GST rate and HSN for invoices, stock tracking with a low-stock alert. */
export function ProductSheet({ gymId, product, onClose, onSaved }: { gymId: string; product: Product | 'new'; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const isNew = product === 'new';
  const [f, setF] = useState(() => isNew
    ? { name: '', price: '', category: 'retail', gst_rate: '', hsn: '', track_stock: true, stock_qty: '', low_stock_at: '' }
    : { name: product.name, price: String(product.price), category: product.category, gst_rate: product.gst_rate != null ? String(product.gst_rate) : '', hsn: product.hsn ?? '',
        track_stock: product.track_stock, stock_qty: '', low_stock_at: String(product.low_stock_at || '') });
  const [move, setMove] = useState({ qty: '', reason: 'purchase' as 'purchase' | 'adjust' | 'return', minus: false });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { name: f.name.trim(), price: Number(f.price), category: f.category, gst_rate: f.gst_rate === '' ? null : Number(f.gst_rate), hsn: f.hsn.trim() || null,
        track_stock: f.track_stock, low_stock_at: Number(f.low_stock_at) || 0 };
      if (isNew) body.stock_qty = f.track_stock ? Number(f.stock_qty) || 0 : 0;
      await ownerSuite.saveProduct(gymId, body, isNew ? undefined : product.id);
      if (!isNew && Number(move.qty)) await ownerSuite.stock(gymId, product.id, { delta: move.minus ? -Number(move.qty) : Number(move.qty), reason: move.reason });
      toast({ tone: 'success', title: isNew ? 'Product added' : 'Saved' });
      onSaved();
      onClose();
    } catch (e) {
      toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Product" title={isNew ? 'New product' : product.name}
      footer={<Button fullWidth loading={busy} disabled={!f.name.trim() || !Number(f.price)} onClick={save}>Save</Button>}>
      <div className="space-y-4">
        <TextField label="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Whey 1kg, PT session" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Price" prefix="₹" inputMode="numeric" value={f.price} onChange={e => setF({ ...f, price: digits(e.target.value) })} />
          <TextField label="GST % (if different)" optional inputMode="numeric" value={f.gst_rate} onChange={e => setF({ ...f, gst_rate: digits(e.target.value).slice(0, 2) })} />
          <TextField label="HSN / SAC" optional value={f.hsn} onChange={e => setF({ ...f, hsn: e.target.value })} />
          <TextField label="Low-stock alert at" optional inputMode="numeric" value={f.low_stock_at} onChange={e => setF({ ...f, low_stock_at: digits(e.target.value) })} />
        </div>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map(([c, l]) => <Chip key={c} label={l} selected={f.category === c} onClick={() => setF({ ...f, category: c })} />)}</div>
        <Toggle checked={f.track_stock} onChange={v => setF({ ...f, track_stock: v })} label="Track stock" />
        {f.track_stock && isNew ? <TextField label="Opening stock" inputMode="numeric" value={f.stock_qty} onChange={e => setF({ ...f, stock_qty: digits(e.target.value) })} /> : null}
        {f.track_stock && !isNew ? (
          <Card variant="sunken" padding="md" className="space-y-3">
            <Text variant="footnote" tone="muted">{product.stock_qty} in stock now</Text>
            <div className="flex flex-wrap gap-2">
              {([['purchase', 'Received'], ['adjust', 'Correction'], ['return', 'Returned']] as const).map(([v, l]) => <Chip key={v} label={l} selected={move.reason === v} onClick={() => setMove({ ...move, reason: v, minus: false })} />)}
              {move.reason === 'adjust' ? <Chip label={move.minus ? 'Remove' : 'Add'} selected onClick={() => setMove({ ...move, minus: !move.minus })} /> : null}
            </div>
            <TextField label="Quantity" optional inputMode="numeric" value={move.qty} onChange={e => setMove({ ...move, qty: digits(e.target.value) })} />
          </Card>
        ) : null}
      </div>
    </Sheet>
  );
}
