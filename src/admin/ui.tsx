import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Badge, Button, Dialog, Text, TextArea, TextField, cn, type Tone } from '../components/kit';

const STATUS_TONE: Record<string, Tone> = {
  active: 'success', verified: 'success', confirmed: 'success', paid: 'success', approved: 'success', completed: 'info',
  pending: 'warning', under_review: 'info', unpaid: 'warning', suspended: 'warning',
  rejected: 'danger', cancelled: 'danger', banned: 'danger', deactivated: 'neutral', expired: 'neutral', refunded: 'neutral',
};

export function StatusPill({ status, label }: { status?: string | null; label?: string }) {
  if (!status) return <Text variant="caption" tone="subtle">—</Text>;
  return <Badge label={label ?? status.replace(/_/g, ' ')} tone={STATUS_TONE[status] ?? 'neutral'} />;
}

/* ─── layout ─── */

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Text variant="h1" as="h1">{title}</Text>
        {subtitle ? <Text tone="muted" className="mt-1">{subtitle}</Text> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 basis-56 items-center gap-2 rounded-gm-lg border border-border bg-surface px-3 focus-within:border-accent">
      <Search size={16} className="shrink-0 text-ink-subtle" aria-hidden />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
        aria-label={placeholder ?? 'Search'}
      />
    </label>
  );
}

export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="h-10 rounded-gm-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export type Column<T> = { key: string; label: string; render: (row: T) => ReactNode; className?: string };

/** A table on wide screens; on phones each row becomes a card with label/value pairs. */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (!rows.length) {
    return <div className="rounded-gm-xl border border-dashed border-border p-10 text-center text-sm text-ink-subtle">{empty ?? 'Nothing here.'}</div>;
  }
  return (
    <>
      <div className="hidden overflow-x-auto rounded-gm-xl border border-border bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-sunken text-[11px] uppercase tracking-wider text-ink-subtle">
            <tr>
              {columns.map(c => (
                <th key={c.key} scope="col" className={cn('px-4 py-3 font-semibold', c.className)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-b border-border last:border-0', onRowClick && 'cursor-pointer hover:bg-surface-sunken')}
              >
                {columns.map(c => (
                  <td key={c.key} className={cn('px-4 py-3 align-top text-ink', c.className)}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map(r => (
          <div
            key={rowKey(r)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            onKeyDown={onRowClick ? e => e.key === 'Enter' && onRowClick(r) : undefined}
            className="rounded-gm-xl border border-border bg-surface p-4 shadow-card"
          >
            {columns.map(c => (
              <div key={c.key} className="flex items-start justify-between gap-3 py-1">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{c.label}</span>
                <span className="min-w-0 text-right text-sm text-ink">{c.render(r)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <Text variant="caption" tone="subtle">
        {total.toLocaleString('en-IN')} total · page {page} of {pages}
      </Text>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" icon={ChevronLeft} label="Prev" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        <Button size="sm" variant="outline" iconRight={ChevronRight} label="Next" disabled={page >= pages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
      <Text variant="caption" tone="subtle" className="shrink-0">{label}</Text>
      <div className="min-w-0 text-right text-sm text-ink">{children ?? '—'}</div>
    </div>
  );
}

/* ─── actions ─── */

/** A confirm dialog that collects a reason (or any short text). */
export function PromptDialog({ open, title, message, label, placeholder, confirmLabel, tone = 'default', required = true, multiline = true, onCancel, onConfirm }: {
  open: boolean;
  title: string;
  message?: ReactNode;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  tone?: 'default' | 'warning' | 'danger';
  required?: boolean;
  multiline?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState('');
  const close = () => {
    setValue('');
    onCancel();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      message={message}
      tone={tone}
      actions={[
        {
          label: confirmLabel,
          variant: tone === 'danger' ? 'danger' : 'primary',
          onClick: async () => {
            if (required && value.trim().length < 3) return;
            await onConfirm(value.trim());
            setValue('');
          },
        },
        { label: 'Cancel', variant: 'ghost', onClick: close },
      ]}
    >
      <div className="mt-4">
      {multiline ? (
        <TextArea label={label} value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} rows={3} maxLength={500} />
      ) : (
        <TextField label={label} value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} maxLength={120} />
      )}
      {required && value.trim().length > 0 && value.trim().length < 3 ? (
        <Text variant="caption" tone="danger" className="mt-1">At least 3 characters.</Text>
      ) : null}
      </div>
    </Dialog>
  );
}

export function NoAccess() {
  return (
    <div className="rounded-gm-xl border border-dashed border-border p-10 text-center">
      <Text variant="title">No access</Text>
      <Text tone="muted" className="mt-1">Your admin role doesn’t include this section. Ask a super admin.</Text>
    </div>
  );
}
