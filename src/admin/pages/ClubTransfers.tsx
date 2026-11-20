import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, EmptyState, ErrorState, Skeleton, Text } from '../../components/kit';
import { adminGet, adminPost, type Paged } from '../api';
import { when } from '../format';
import { PageTitle, Pager, PromptDialog, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';

type Transfer = { id: string; phone: string; full_name: string | null; from_gym: string; to_gym: string; member_note: string | null; admin_status: string; owner_status: string; status: string; admin_note: string | null; created_at: string };

export default function ClubTransfers() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<{ t: Transfer; to: 'approved' | 'rejected' } | null>(null);
  const { run } = useAdminAction();
  const q = useQuery({ queryKey: ['admin', 'transfers', status, page], queryFn: () => adminGet<Paged<Transfer>>('/club-transfers', { status, page, page_size: 20 }) });

  return (
    <>
      <PageTitle title="Club transfers" subtitle="Members moving their Club progress from one gym to another. Gymmigo approves first, then the new gym." />
      <Toolbar>
        <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[{ value: 'pending', label: 'Waiting for Gymmigo' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'all', label: 'All' }]} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : !q.data.items.length ? <EmptyState title="No transfer requests" /> : (
        <div className="flex flex-col gap-3">
          {q.data.items.map(t => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Text variant="subtitle">{t.full_name || t.phone}</Text>
                  <Text variant="caption" tone="subtle">{t.from_gym} → {t.to_gym} · {when(t.created_at)}</Text>
                </div>
                <div className="flex gap-1"><StatusPill status={t.admin_status} label={`Gymmigo: ${t.admin_status}`} /><StatusPill status={t.owner_status} label={`Gym: ${t.owner_status}`} /></div>
              </div>
              {t.member_note ? <Text className="mt-2">“{t.member_note}”</Text> : null}
              {t.admin_note ? <Text variant="footnote" tone="muted" className="mt-1">Note: {t.admin_note}</Text> : null}
              {t.admin_status === 'pending' ? (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" label="Approve" onClick={() => setDecision({ t, to: 'approved' })} />
                  <Button size="sm" variant="danger" label="Reject" onClick={() => setDecision({ t, to: 'rejected' })} />
                </div>
              ) : null}
            </Card>
          ))}
          <Pager page={page} pageSize={20} total={q.data.total} onPage={setPage} />
        </div>
      )}
      <PromptDialog
        open={!!decision}
        tone={decision?.to === 'rejected' ? 'danger' : 'default'}
        title={decision?.to === 'approved' ? 'Approve this transfer?' : 'Reject this transfer?'}
        label="Note for the member"
        required={decision?.to === 'rejected'}
        confirmLabel={decision?.to === 'approved' ? 'Approve' : 'Reject'}
        onCancel={() => setDecision(null)}
        onConfirm={async note => {
          if (decision && (await run('t', () => adminPost(`/club-transfers/${decision.t.id}`, { admin_status: decision.to, admin_note: note || undefined }), 'Transfer reviewed', ['transfers', 'overview']))) setDecision(null);
        }}
      />
    </>
  );
}
