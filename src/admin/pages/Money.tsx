import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge, Card, ErrorState, Skeleton, Text } from '../../components/kit';
import { adminGet, type Paged } from '../api';
import { ActionButton } from '../ActionSheet';
import { inr, when } from '../format';
import { useAdmin } from '../useAdmin';
import { DataTable, PageTitle, Pager, Select, StatusPill, Toolbar } from '../ui';

type Item = { kind: string; id: string; user_id: string | null; member: string | null; phone: string | null; gym_id: string | null; gym: string | null; amount: number; status: string; method: string | null; at: string | null; note: string | null };
type Ledger = Paged<Item> & { summary: { kind: string; status: string; amount: number; count: number }[] };
const KIND: Record<string, string> = { membership: 'Gym membership', invoice: 'Gym receipt', trainer: 'Trainer package', wallet: 'Wallet' };

/** Every rupee: membership payments, gym receipts, trainer payments and wallet movements, with fixes. */
export default function Money() {
  const { can } = useAdmin();
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [days, setDays] = useState('30');
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['admin', 'ledger', kind, status, days, page],
    queryFn: () => adminGet<Ledger>('/actions/money/ledger', { kind, status, days, page, page_size: 50 }),
  });
  const d = q.data;
  const paid = (k: string) => d?.summary.filter(s => s.kind === k && ['paid', 'credit'].includes(s.status)).reduce((a, s) => a + s.amount, 0) ?? 0;
  const due = (k: string) => d?.summary.filter(s => s.kind === k && s.status === 'unpaid').reduce((a, s) => a + s.amount, 0) ?? 0;

  return (
    <>
      <PageTitle title="Money" subtitle="Every payment and wallet movement. Payments are cash at the gym or trainer; fix mistakes here and they are audited." />
      <Toolbar>
        <Select label="Type" value={kind} onChange={v => (setKind(v), setPage(1))} options={[{ value: '', label: 'Everything' }, ...Object.entries(KIND).map(([value, label]) => ({ value, label }))]} />
        <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[
          { value: '', label: 'Any status' }, { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid / cash due' }, { value: 'pending', label: 'Pending' },
          { value: 'cancelled', label: 'Cancelled' }, { value: 'refunded', label: 'Refunded' }, { value: 'credit', label: 'Wallet credit' }, { value: 'debit', label: 'Wallet debit' },
        ]} />
        <Select label="Period" value={days} onChange={v => (setDays(v), setPage(1))} options={[['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['365', '1 year'], ['3650', 'All time']].map(([value, label]) => ({ value, label }))} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-96" rounded="xl" /> : q.isError || !d ? <ErrorState onRetry={() => q.refetch()} /> : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(['membership', 'invoice', 'trainer', 'wallet'] as const).map(k => (
              <Card key={k}>
                <Text variant="label" tone="subtle">{KIND[k]}</Text>
                <Text variant="h2" className="mt-1">{inr(paid(k))}</Text>
                <Text variant="caption" tone={due(k) ? 'warning' : 'subtle'}>{k === 'wallet' ? 'credited in period' : due(k) ? `${inr(due(k))} due` : 'collected'}</Text>
              </Card>
            ))}
          </div>
          <DataTable rows={d.items} rowKey={r => `${r.kind}-${r.id}`} empty="Nothing in this period." columns={[
            { key: 'w', label: 'When', render: r => when(r.at) },
            { key: 'k', label: 'Type', render: r => <Badge label={KIND[r.kind] ?? r.kind} /> },
            { key: 'm', label: 'Member', render: r => (r.user_id ? <Link className="text-accent-text underline" to={`/admin/users/${r.user_id}`}>{r.member || r.phone || 'member'}</Link> : '—') },
            { key: 'g', label: 'Gym', render: r => (r.gym_id ? <Link className="text-accent-text underline" to={`/admin/gyms/${r.gym_id}`}>{r.gym}</Link> : '—') },
            { key: 'a', label: 'Amount', render: r => <span className="font-semibold tabular-nums">{r.kind === 'wallet' && r.status === 'debit' ? '−' : ''}{inr(r.amount)}</span> },
            { key: 's', label: 'Status', render: r => <StatusPill status={r.status} label={r.status === 'unpaid' ? 'cash due' : r.status} /> },
            { key: 'n', label: 'Note', render: r => <span className="text-xs text-ink-muted">{r.method ? `${r.method} · ` : ''}{r.note ?? ''}</span> },
            { key: 'x', label: '', render: r => (
              <div className="flex justify-end gap-1">
                {r.kind === 'membership' && r.gym_id && can('money.edit') ? (
                  <ActionButton entity="gym" entityId={r.gym_id} op="member.payment" itemId={r.id} label={r.status === 'paid' ? 'Mark unpaid' : 'Mark paid'} initial={{ received: r.status !== 'paid', amount: r.amount }} />
                ) : null}
                {r.kind === 'invoice' && can('data.edit') ? <Link className="text-xs text-accent-text underline" to={`/admin/data/gym_invoices/${r.id}`}>Edit receipt</Link> : null}
                {r.kind === 'trainer' && can('data.edit') ? <Link className="text-xs text-accent-text underline" to={`/admin/data/trainer_bookings/${r.id}`}>Open</Link> : null}
              </div>
            ) },
          ]} />
          <Pager page={page} pageSize={50} total={d.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
