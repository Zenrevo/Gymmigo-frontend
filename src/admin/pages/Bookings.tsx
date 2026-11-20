import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button, ErrorState, Skeleton } from '../../components/kit';
import { adminGet, adminPost, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { inr, when } from '../format';
import { DataTable, PageTitle, Pager, PromptDialog, SearchBox, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';
import { useDebounced } from '../useDebounced';

type Row = { id: string; member_phone: string; member_name: string | null; trainer_name: string | null; status: string; payment_status: string; total_amount: number; amount_paid: number; paid_at: string | null; sessions_completed: number; total_sessions: number; start_date: string; created_at: string };

export default function Bookings() {
  const { can } = useAdmin();
  const { run } = useAdminAction();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<Row | null>(null);
  const list = useQuery({
    queryKey: ['admin', 'bookings', q, status, payment, page],
    queryFn: () => adminGet<Paged<Row>>('/bookings', { q, status, payment_status: payment, page, page_size: 25 }),
  });

  return (
    <>
      <PageTitle title="Trainer bookings" subtitle="Package requests and plans between members and trainers. Paid in cash to the trainer." />
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Member, phone or trainer" />
        <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[
          { value: '', label: 'Any status' }, { value: 'pending', label: 'Requested' }, { value: 'confirmed', label: 'Active' },
          { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'rejected', label: 'Declined' },
        ]} />
        <Select label="Payment" value={payment} onChange={v => (setPayment(v), setPage(1))} options={[{ value: '', label: 'Paid or not' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Cash due' }, { value: 'refunded', label: 'Refunded' }]} />
      </Toolbar>
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <>
          <DataTable rows={list.data.items} rowKey={r => r.id} empty="No bookings match." columns={[
            { key: 'm', label: 'Member', render: r => <><div className="font-semibold">{r.member_name || '—'}</div><div className="text-xs text-ink-subtle">{r.member_phone}</div></> },
            { key: 't', label: 'Trainer', render: r => r.trainer_name || '—' },
            { key: 'p', label: 'Progress', render: r => `${r.sessions_completed}/${r.total_sessions} sessions` },
            { key: 'a', label: 'Amount', render: r => inr(r.total_amount) },
            { key: 'ps', label: 'Payment', render: r => <StatusPill status={r.payment_status} label={r.payment_status === 'unpaid' ? 'cash due' : r.payment_status} /> },
            { key: 's', label: 'Status', render: r => <StatusPill status={r.status} label={r.status === 'pending' ? 'requested' : r.status} /> },
            { key: 'd', label: 'Requested', render: r => when(r.created_at, false) },
            ...(can('bookings.manage') ? [{
              key: 'x', label: '', render: (r: Row) => (['pending', 'confirmed'].includes(r.status) ? <Button size="sm" variant="danger" label="Cancel" onClick={() => setCancelling(r)} /> : null),
            }] : []),
          ]} />
          <Pager page={page} pageSize={25} total={list.data.total} onPage={setPage} />
        </>
      )}
      <PromptDialog
        open={!!cancelling}
        tone="danger"
        title="Cancel this trainer plan?"
        message={cancelling?.payment_status === 'paid' ? 'The member already paid: it will be flagged for a cash refund. Upcoming sessions are cancelled.' : 'Upcoming sessions are cancelled too.'}
        label="Reason (saved in the audit log)"
        confirmLabel="Cancel plan"
        onCancel={() => setCancelling(null)}
        onConfirm={async reason => {
          if (cancelling && (await run('cancel', () => adminPost(`/bookings/${cancelling.id}/cancel`, { reason }), 'Plan cancelled', ['bookings', 'overview']))) setCancelling(null);
        }}
      />
    </>
  );
}
