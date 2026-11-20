import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, EmptyState, ErrorState, SegmentedControl, Skeleton, Text } from '../../components/kit';
import { adminDelete, adminGet, type Paged } from '../api';
import { when } from '../format';
import { PageTitle, Pager, PromptDialog, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';

type Review = { id: string; subject: string | null; rating: number; title: string; review: string; reported_count: number; user_id: string; created_at: string };

export default function Reviews() {
  const [kind, setKind] = useState<'gym' | 'trainer'>('gym');
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState<Review | null>(null);
  const { run } = useAdminAction();
  const q = useQuery({ queryKey: ['admin', 'reviews', kind, page], queryFn: () => adminGet<Paged<Review>>('/reviews', { kind, page, page_size: 20 }) });

  return (
    <>
      <PageTitle title="Reviews" subtitle="Most-reported first. Removing a review recalculates the rating." />
      <Toolbar>
        <SegmentedControl aria-label="Review type" size="sm" value={kind} onChange={v => (setKind(v), setPage(1))} options={[{ value: 'gym', label: 'Gym reviews' }, { value: 'trainer', label: 'Trainer reviews' }]} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : !q.data.items.length ? <EmptyState title="No reviews yet" /> : (
        <div className="flex flex-col gap-3">
          {q.data.items.map(r => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Text variant="subtitle">{'★'.repeat(r.rating)}{'☆'.repeat(Math.max(0, 5 - r.rating))} {r.title}</Text>
                  <Text variant="caption" tone="subtle">{r.subject || '—'} · {when(r.created_at)}</Text>
                </div>
                {r.reported_count ? <Badge label={`Reported ${r.reported_count}×`} tone="danger" /> : null}
              </div>
              <Text className="mt-2 whitespace-pre-line">{r.review}</Text>
              <div className="mt-3">
                <Button size="sm" variant="danger" label="Remove review" onClick={() => setRemoving(r)} />
              </div>
            </Card>
          ))}
          <Pager page={page} pageSize={20} total={q.data.total} onPage={setPage} />
        </div>
      )}
      <PromptDialog
        open={!!removing}
        tone="danger"
        title="Remove this review?"
        message="It’s deleted for everyone. A copy is kept in the audit log."
        label="Reason"
        confirmLabel="Remove"
        multiline={false}
        onCancel={() => setRemoving(null)}
        onConfirm={async reason => {
          if (removing && (await run('rm', () => adminDelete(`/reviews/${kind}/${removing.id}`, { reason }), 'Review removed', ['reviews']))) setRemoving(null);
        }}
      />
    </>
  );
}
