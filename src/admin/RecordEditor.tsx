import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Sheet, Skeleton, Text, TextArea, TextField, Toggle, useToast } from '../components/kit';
import { adminDelete, adminError, adminGet, adminHttp } from './api';
import { useAdmin } from './useAdmin';

type ColMeta = { name: string; kind: string; nullable: boolean; editable: boolean; secret: boolean; max_length: number | null; options: string[] | null; is_time: boolean; integer: boolean };
type Meta = { table: string; read_only: boolean; pk: string | null; columns: ColMeta[] };

function initial(c: ColMeta, v: unknown): string | boolean {
  if (c.kind === 'bool') return v === true;
  if (v == null) return '';
  if (c.kind === 'json') return JSON.stringify(v, null, 2);
  if (c.kind === 'array') return Array.isArray(v) ? v.join(', ') : String(v);
  if (c.kind === 'datetime') return String(v).slice(0, 16);
  if (c.kind === 'date') return String(v).slice(0, 10);
  return String(v);
}

function out(c: ColMeta, v: string | boolean): unknown {
  if (c.kind === 'bool') return v;
  const s = String(v);
  if (s.trim() === '' && c.kind !== 'text') return null;
  if (c.kind === 'datetime') return new Date(s).toISOString();
  if (c.kind === 'json') return JSON.parse(s);
  if (c.kind === 'array') return s.split(',').map(x => x.trim()).filter(Boolean);
  return s;
}

/** Edit / delete any record (Data explorer). Only changed fields are sent; the server checks types and conflicts. */
export function RecordEditor({ table, id, data, onClose }: { table: string; id: string; data: Record<string, unknown>; onClose: () => void }) {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const meta = useQuery({ queryKey: ['admin', 'data', 'meta', table], queryFn: () => adminGet<Meta>(`/data/tables/${table}/meta`) });
  const [vals, setVals] = useState<Record<string, string | boolean>>({});
  const [nulls, setNulls] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cols = (meta.data?.columns ?? []).filter(c => c.editable);

  const save = async () => {
    setError('');
    const changes: Record<string, unknown> = {};
    try {
      for (const c of cols) {
        if (nulls[c.name]) {
          if (data[c.name] != null) changes[c.name] = null;
          continue;
        }
        if (!(c.name in vals)) continue;
        if (vals[c.name] !== initial(c, data[c.name])) changes[c.name] = out(c, vals[c.name]);
      }
    } catch {
      setError('A JSON field is not valid JSON.');
      return;
    }
    if (!Object.keys(changes).length) {
      setError('Nothing changed.');
      return;
    }
    setBusy(true);
    try {
      const res = await adminHttp.patch(`/data/tables/${table}/rows/${id}`, {
        changes, expected_updated_at: typeof data.updated_at === 'string' ? data.updated_at : undefined, reason: reason || undefined,
      });
      toast({ tone: 'success', title: `Saved: ${(res.data.data.changed as string[]).join(', ')}` });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onClose();
    } catch (e) {
      setError(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} eyebrow={`Edit · ${table.replace(/_/g, ' ')}`} title={id.slice(0, 8) + '…'} size="lg"
      footer={meta.data && !meta.data.read_only ? <Button fullWidth label="Save changes" loading={busy} disabled={!can('data.edit')} onClick={save} /> : undefined}>
      {meta.isLoading ? <Skeleton className="h-60" /> : meta.data?.read_only ? (
        <Text tone="muted">This table is read-only here: it has its own page in the console (or must never change).</Text>
      ) : (
        <div className="flex flex-col gap-4">
          {!can('data.edit') ? <Text tone="warning">Your role can view but not edit records.</Text> : null}
          {cols.map(c => {
            const value = c.name in vals ? vals[c.name] : initial(c, data[c.name]);
            const set = (v: string | boolean) => setVals(prev => ({ ...prev, [c.name]: v }));
            const label = <span className="inline-flex items-center gap-2">{c.name}<Badge label={c.kind} /></span>;
            const nullToggle = c.nullable && c.kind !== 'bool' ? (
              <label className="flex items-center gap-1 text-xs text-ink-subtle"><input type="checkbox" checked={!!nulls[c.name]} onChange={e => setNulls(p => ({ ...p, [c.name]: e.target.checked }))} />empty (null)</label>
            ) : null;
            let input;
            if (c.kind === 'bool') input = <Toggle label={c.name} checked={Boolean(value)} onChange={set} />;
            else if (c.options) input = (
              <select aria-label={c.name} value={String(value)} disabled={nulls[c.name]} onChange={e => set(e.target.value)} className="h-12 rounded-gm-lg border border-border-strong bg-surface px-3 text-ink">
                {!c.options.includes(String(value)) ? <option value={String(value)}>{String(value) || '—'}</option> : null}
                {c.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            );
            else if (c.kind === 'json' || (c.kind === 'text' && !c.max_length)) input = <TextArea aria-label={c.name} rows={c.kind === 'json' ? 6 : 3} value={String(value)} disabled={nulls[c.name]} onChange={e => set(e.target.value)} />;
            else input = (
              <TextField aria-label={c.name} disabled={nulls[c.name]} value={String(value)} onChange={e => set(e.target.value)}
                type={c.kind === 'number' ? 'number' : c.kind === 'date' ? 'date' : c.kind === 'datetime' ? 'datetime-local' : c.is_time ? 'time' : 'text'}
                step={c.kind === 'number' && !c.integer ? 'any' : undefined} helper={c.kind === 'array' ? 'Comma-separated' : c.max_length ? `Max ${c.max_length} characters` : undefined} />
            );
            return (
              <div key={c.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between"><span className="t-label text-ink-muted">{label}</span>{nullToggle}</div>
                {input}
              </div>
            );
          })}
          <TextField label="Reason" optional value={reason} onChange={e => setReason(e.target.value)} helper="Saved in the audit log with the old and new values (you can undo from there)." />
          {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null}
          {can('data.delete') ? <Button variant="danger" size="sm" label="Delete this record…" onClick={() => setDeleting(true)} /> : null}
        </div>
      )}
      {deleting ? <DeleteSheet table={table} id={id} onClose={() => setDeleting(false)} onDeleted={onClose} /> : null}
    </Sheet>
  );
}

function DeleteSheet({ table, id, onClose, onDeleted }: { table: string; id: string; onClose: () => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const preview = useQuery({ queryKey: ['admin', 'data', 'delprev', table, id], queryFn: () => adminGet<{ related: { table: string; column: string; count: number; on_delete: string }[] }>(`/data/tables/${table}/rows/${id}/delete-preview`) });
  const [confirm, setConfirm] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const del = async () => {
    setBusy(true);
    setError('');
    try {
      await adminDelete(`/data/tables/${table}/rows/${id}`, { confirm, reason });
      toast({ tone: 'success', title: 'Deleted. You can undo it from the audit log.' });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      onDeleted();
    } catch (e) {
      setError(adminError(e).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} eyebrow="Delete" title={`Delete this ${table.replace(/_/g, ' ')} record?`}
      footer={<Button fullWidth variant="danger" label="Delete permanently" loading={busy} disabled={confirm !== id.slice(0, 8) || reason.trim().length < 3} onClick={del} />}>
      <div className="flex flex-col gap-4">
        {preview.isLoading ? <Skeleton className="h-20" /> : preview.data?.related.length ? (
          <div className="rounded-gm-md bg-warning-soft p-3 text-sm text-warning">
            <p className="mb-1 font-semibold">Other records point at this one:</p>
            {preview.data.related.map(r => <p key={`${r.table}.${r.column}`}>{r.count} × {r.table.replace(/_/g, ' ')} ({r.on_delete === 'CASCADE' ? 'will be deleted too, not restorable' : r.on_delete === 'SET NULL' ? 'link will be cleared' : 'may block the delete'})</p>)}
          </div>
        ) : <Text tone="muted">Nothing else points at this record.</Text>}
        <TextField label={`Type ${id.slice(0, 8)} to confirm`} value={confirm} onChange={e => setConfirm(e.target.value)} />
        <TextField label="Reason" value={reason} onChange={e => setReason(e.target.value)} />
        {error ? <p role="alert" className="t-footnote rounded-gm-md bg-danger-soft px-3 py-2 text-danger">{error}</p> : null}
      </div>
    </Sheet>
  );
}
