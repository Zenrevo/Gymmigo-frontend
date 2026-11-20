import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ErrorState, Skeleton } from '../../components/kit';
import { adminGet, adminPatch, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { inr, when } from '../format';
import { DataTable, PageTitle, Pager, PromptDialog, SearchBox, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';
import { useDebounced } from '../useDebounced';

type Row = { id: string; gym: string; phone: string; full_name: string | null; status: string; payment_status: string; payment_method: string | null; amount: number; paid_at: string | null; start_date: string; end_date: string };

const STATUSES = ['active', 'pending', 'suspended', 'expired', 'cancelled', 'rejected'];

export default function Memberships() {
  const { can } = useAdmin();
  const { run } = useAdminAction();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(1);
  const [change, setChange] = useState<{ row: Row; to: string } | null>(null);
  const list = useQuery({
    queryKey: ['admin', 'memberships', q, status, payment, page],
    queryFn: () => adminGet<Paged<Row>>('/memberships', { q, status, payment_status: payment, page, page_size: 25 }),
  });

  return (
    <>
      <PageTitle title="Memberships" subtitle="Gym plans across every gym. Paid in cash at the gym desk." />
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Member, phone or gym" />
        <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[{ value: '', label: 'Any status' }, ...STATUSES.map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
        <Select label="Payment" value={payment} onChange={v => (setPayment(v), setPage(1))} options={[{ value: '', label: 'Paid or not' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Cash due' }]} />
      </Toolbar>
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <>
          <DataTable rows={list.data.items} rowKey={r => r.id} empty="No memberships match." columns={[
            { key: 'm', label: 'Member', render: r => <><div className="font-semibold">{r.full_name || '—'}</div><div className="text-xs text-ink-subtle">{r.phone}</div></> },
            { key: 'g', label: 'Gym', render: r => r.gym },
            { key: 'p', label: 'Dates', render: r => `${when(r.start_date, false)} → ${when(r.end_date, false)}` },
            { key: 'a', label: 'Amount', render: r => inr(r.amount) },
            { key: 'ps', label: 'Payment', render: r => <StatusPill status={r.payment_status} label={r.payment_status === 'unpaid' ? 'cash due' : r.payment_status} /> },
            {
              key: 's', label: 'Status', render: r => can('memberships.manage') ? (
                <select
                  aria-label="Change status"
                  value={r.status}
                  onChange={e => setChange({ row: r, to: e.target.value })}
                  className="h-8 rounded-gm-md border border-border bg-surface px-2 text-xs"
                >
                  {[...new Set([r.status, 'active', 'suspended', 'cancelled', 'expired'])].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : <StatusPill status={r.status} />,
            },
          ]} />
          <Pager page={page} pageSize={25} total={list.data.total} onPage={setPage} />
        </>
      )}
      <PromptDialog
        open={!!change}
        tone={change?.to === 'active' ? 'default' : 'warning'}
        title={`Set membership to ${change?.to}?`}
        message={change ? `${change.row.full_name || change.row.phone} at ${change.row.gym}.` : undefined}
        label="Reason (saved in the audit log)"
        confirmLabel="Change status"
        onCancel={() => setChange(null)}
        onConfirm={async reason => {
          if (change && (await run('ms', () => adminPatch(`/memberships/${change.row.id}`, { status: change.to, reason }), 'Membership updated', ['memberships', 'overview']))) setChange(null);
        }}
      />
    </>
  );
}
