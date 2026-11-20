import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Sheet, Text, TextArea, TextField, Toggle, useToast, type ButtonVariant } from '../components/kit';
import { adminError, adminPost } from './api';
import { fieldsFor, pretty, useCatalog, type Entity, type FieldSpec } from './actionCatalog';

type Initial = Record<string, unknown>;

function toInput(f: FieldSpec, v: unknown): string | boolean {
  if (f.kind === 'bool') return Boolean(v);
  if (v == null) return '';
  if (f.kind === 'list') return Array.isArray(v) ? v.join(', ') : String(v);
  if (f.kind === 'json') return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  if (f.kind === 'date') return String(v).slice(0, 10);
  if (f.kind === 'time') return String(v).slice(0, 5);
  return String(v);
}

function fromInput(f: FieldSpec, v: string | boolean): unknown {
  if (f.kind === 'bool') return Boolean(v);
  const s = String(v).trim();
  if (s === '') return null;
  if (f.kind === 'int') return Number.parseInt(s, 10);
  if (f.kind === 'number') return Number(s);
  if (f.kind === 'list') return s.split(',').map(x => x.trim()).filter(Boolean);
  if (f.kind === 'json') return JSON.parse(s);
  return s;
}

/**
 * Generic form for any admin action. Fields come from the server's action catalog; for edits only the
 * fields you actually changed are sent (so nothing else is overwritten).
 */
export function ActionSheet({ entity, entityId, op, itemId, initial, title, onClose, onDone, mode = 'edit' }: {
  entity: Entity;
  entityId: string;
  op: string;
  itemId?: string | null;
  initial?: Initial | null;
  title?: string;
  onClose: () => void;
  onDone?: () => void;
  mode?: 'edit' | 'create';
}) {
  const cat = useCatalog();
  const qc = useQueryClient();
  const toast = useToast();
  const meta = cat.data?.[entity]?.find(o => o.op === op);
  const fields = useMemo(() => fieldsFor(entity, meta), [entity, meta]);
  const start = useMemo(() => Object.fromEntries(fields.map(f => [f.name, toInput(f, initial?.[f.name])])), [fields, initial]);
  const [values, setValues] = useState<Record<string, string | boolean> | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const v = values ?? start;

  const submit = async () => {
    setError('');
    const data: Record<string, unknown> = {};
    try {
      for (const f of fields) {
        const changed = v[f.name] !== start[f.name];
        if (mode === 'create' ? v[f.name] !== '' || f.kind === 'bool' : changed || CUSTOM_ALWAYS.has(`${entity}:${op}`)) {
          data[f.name] = fromInput(f, v[f.name]);
        }
        if (f.required && (v[f.name] === '' || v[f.name] == null)) throw new Error(`${f.label ?? pretty(f.name)} is required.`);
      }
    } catch (e) {
      setError(e instanceof SyntaxError ? 'One of the JSON fields is not valid JSON.' : (e as Error).message);
      return;
    }
    if (fields.length && !Object.keys(data).length) {
      setError('Nothing changed.');
      return;
    }
    setBusy(true);
    try {
      await adminPost(`/actions/${entity}/${entityId}/${op}`, { data, item_id: itemId ?? undefined, reason: reason || undefined });
      toast({ tone: 'success', title: `${meta?.label ?? 'Saved'} — done` });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onDone?.();
      onClose();
    } catch (e) {
      setError(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} eyebrow={meta?.dangerous ? 'Careful' : 'Edit'} title={title ?? meta?.label ?? op} size="lg"
      footer={<Button fullWidth label={meta?.label ?? 'Save'} variant={meta?.dangerous ? 'danger' : 'primary'} loading={busy} disabled={meta ? !meta.allowed : true} onClick={submit} />}>
      <div className="flex flex-col gap-4">
        {meta && !meta.allowed ? <Text tone="warning">Your role doesn't include {meta.permission}.</Text> : null}
        {fields.map(f => (
          <Field key={f.name} f={f} value={v[f.name]} onChange={val => setValues({ ...v, [f.name]: val })} />
        ))}
        {!fields.length && meta ? <Text tone="muted">No details needed.</Text> : null}
        <TextField label={meta?.dangerous ? 'Reason (required)' : 'Reason'} optional={!meta?.dangerous} value={reason} onChange={e => setReason(e.target.value)} helper="Saved in the audit log." />
        {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null}
      </div>
    </Sheet>
  );
}

// Toggles that must always be sent (their meaning depends on being explicit).
const CUSTOM_ALWAYS = new Set(['gym:member.payment', 'trainer:booking.payment', 'gym:member.accept', 'member:ai.control', 'member:wallet.adjust']);

function Field({ f, value, onChange }: { f: FieldSpec; value: string | boolean; onChange: (v: string | boolean) => void }) {
  const label = f.label ?? pretty(f.name);
  if (f.kind === 'bool') return <Toggle label={label} checked={Boolean(value)} onChange={onChange} />;
  if (f.kind === 'select') {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-ink-muted">{label}</span>
        <select value={String(value)} onChange={e => onChange(e.target.value)} className="h-12 rounded-gm-lg border border-border-strong bg-surface px-3 text-ink">
          <option value="">Choose…</option>
          {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (f.kind === 'longtext' || f.kind === 'json') {
    return <TextArea label={label} optional={!f.required} helper={f.kind === 'json' ? 'JSON' : f.help} rows={f.kind === 'json' ? 6 : 4} value={String(value)} onChange={e => onChange(e.target.value)} />;
  }
  const type = f.kind === 'int' || f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : f.kind === 'time' ? 'time' : 'text';
  return <TextField label={label} optional={!f.required} helper={f.kind === 'list' ? 'Comma-separated' : f.help} type={type} value={String(value)} onChange={e => onChange(e.target.value)} />;
}

/** A button that opens the action form. */
export function ActionButton(props: Omit<Parameters<typeof ActionSheet>[0], 'onClose'> & { label: string; variant?: ButtonVariant; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  const { label, variant = 'outline', size = 'sm', ...rest } = props;
  return (
    <>
      <Button size={size} variant={variant} label={label} onClick={() => setOpen(true)} />
      {open ? <ActionSheet {...rest} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
