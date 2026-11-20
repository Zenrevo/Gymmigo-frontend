import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, ErrorState, Skeleton, StatTile, Text } from '../../components/kit';
import { adminGet } from '../api';
import { inr, when } from '../format';
import { DataTable, PageTitle, Select, Toolbar } from '../ui';

type Data = {
  days: number; gym_total: number; trainer_total: number;
  top_gyms: { gym: string; amount: number; count: number }[];
  gym_receipts: { id: string; gym: string; invoice_number: string; amount: number; method: string | null; paid_at: string }[];
  trainer_payments: { id: string; amount: number; paid_at: string; note: string | null }[];
};

export default function Payments() {
  const [days, setDays] = useState('30');
  const q = useQuery({ queryKey: ['admin', 'payments', days], queryFn: () => adminGet<Data>('/payments', { days }) });
  const d = q.data;
  return (
    <>
      <PageTitle title="Cash payments" subtitle="Online payments are off: everything is cash, recorded by the gym or trainer when they receive it." />
      <Toolbar>
        <Select label="Period" value={days} onChange={setDays} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: '365', label: 'Last year' }]} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !d ? <ErrorState onRetry={() => q.refetch()} /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Total collected" value={inr(d.gym_total + d.trainer_total)} caption="gyms + trainers" emphasis />
            <StatTile label="At gym desks" value={inr(d.gym_total)} caption={`${d.gym_receipts.length} receipts shown`} />
            <StatTile label="By trainers" value={inr(d.trainer_total)} caption={`${d.trainer_payments.length} payments shown`} />
          </div>
          {d.top_gyms.length ? (
            <Card>
              <Text variant="subtitle" className="mb-2">Top gyms by cash collected</Text>
              {d.top_gyms.map(g => (
                <div key={g.gym} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
                  <span>{g.gym} <span className="text-ink-subtle">· {g.count} receipts</span></span>
                  <span className="font-semibold">{inr(g.amount)}</span>
                </div>
              ))}
            </Card>
          ) : null}
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Gym receipts (latest 50)</Text>
            <DataTable rows={d.gym_receipts} rowKey={r => r.id} empty="No gym cash recorded in this period." columns={[
              { key: 'g', label: 'Gym', render: r => r.gym },
              { key: 'n', label: 'Receipt', render: r => r.invoice_number },
              { key: 'a', label: 'Amount', render: r => inr(r.amount) },
              { key: 'm', label: 'Method', render: r => r.method || 'cash' },
              { key: 'd', label: 'Received', render: r => when(r.paid_at) },
            ]} />
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Trainer payments (latest 50)</Text>
            <DataTable rows={d.trainer_payments} rowKey={r => r.id} empty="No trainer cash recorded in this period." columns={[
              { key: 'a', label: 'Amount', render: r => inr(r.amount) },
              { key: 'n', label: 'Note', render: r => r.note || '—' },
              { key: 'd', label: 'Received', render: r => when(r.paid_at) },
            ]} />
          </section>
        </div>
      )}
    </>
  );
}
