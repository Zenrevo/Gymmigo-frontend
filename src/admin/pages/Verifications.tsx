import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, SegmentedControl, Skeleton, Text } from '../../components/kit';
import { adminGet, adminPost, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { when } from '../format';
import { PageTitle, Pager, PromptDialog, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';

type Kind = 'trainer' | 'gym_owner';
type Doc = { id: string; name?: string; type?: string; issued_by?: string; url: string | null; is_verified: boolean };
type Item = {
  id: string; user_id: string; phone: string; full_name: string | null; verification_status: string; rejection_reason: string | null; updated_at: string;
  experience_years?: number | null; experience_level?: string | null; location?: string | null; certifications?: Doc[]; documents?: Doc[];
  business_name?: string | null; gstin?: string | null; pan_number?: string | null; contact_phone?: string | null; gyms?: string[];
};

export default function Verifications() {
  const [params, setParams] = useSearchParams();
  const kind = (params.get('kind') === 'gym_owner' ? 'gym_owner' : 'trainer') as Kind;
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<Item | null>(null);
  const { busy, run } = useAdminAction();
  const { can } = useAdmin();
  const q = useQuery({
    queryKey: ['admin', 'verifications', kind, status, page],
    queryFn: () => adminGet<Paged<Item>>('/verifications', { kind, status, page, page_size: 20 }),
  });
  const decide = (it: Item, decision: string, reason?: string) =>
    run(`${it.id}-${decision}`, () => adminPost(`/verifications/${kind}/${it.id}`, { decision, reason }),
      decision === 'verified' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Marked under review', ['verifications', 'overview']);
  const toggleDoc = (path: string, d: Doc) =>
    run(`doc-${d.id}`, () => adminPost(`/trainers/${path}/${d.id}/verify`, { value: !d.is_verified }), d.is_verified ? 'Marked unverified' : 'Marked verified', ['verifications']);

  return (
    <>
      <PageTitle title="Verifications" subtitle="Approve trainers and gym owners before they get the verified badge." />
      <Toolbar>
        <SegmentedControl
          aria-label="Type"
          size="sm"
          value={kind}
          onChange={v => (setParams({ kind: v }), setPage(1))}
          options={[{ value: 'trainer', label: 'Trainers' }, { value: 'gym_owner', label: 'Gym owners' }]}
        />
        <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[
          { value: 'open', label: 'Waiting for review' }, { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' },
        ]} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : !q.data.items.length ? (
        <EmptyState title={status === 'open' ? 'All caught up' : 'Nothing here'} message={status === 'open' ? 'No one is waiting for review.' : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {q.data.items.map(it => (
            <Card key={it.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Text variant="subtitle">{kind === 'trainer' ? it.full_name || 'Trainer' : it.business_name || it.full_name || 'Gym owner'}</Text>
                  <Text variant="caption" tone="subtle">{it.phone} · updated {when(it.updated_at)}</Text>
                </div>
                <StatusPill status={it.verification_status} />
              </div>
              <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {kind === 'trainer' ? (
                  <>
                    <span className="text-ink-muted">Experience: <span className="text-ink">{it.experience_years != null ? `${it.experience_years} yrs` : '—'}{it.experience_level ? ` (${it.experience_level})` : ''}</span></span>
                    <span className="text-ink-muted">Location: <span className="text-ink">{it.location || '—'}</span></span>
                  </>
                ) : (
                  <>
                    <span className="text-ink-muted">GSTIN: <span className="text-ink">{it.gstin || '—'}</span></span>
                    <span className="text-ink-muted">PAN: <span className="text-ink">{it.pan_number || '—'}</span></span>
                    <span className="text-ink-muted">Contact: <span className="text-ink">{it.contact_phone || '—'}</span></span>
                    <span className="text-ink-muted">Gyms: <span className="text-ink">{it.gyms?.join(', ') || '—'}</span></span>
                  </>
                )}
              </div>
              {kind === 'trainer' && (it.certifications?.length || it.documents?.length) ? (
                <div className="mt-3 flex flex-col gap-2">
                  {[...(it.certifications ?? []).map(d => ({ d, path: 'certifications', title: `${d.name} · ${d.issued_by}` })),
                    ...(it.documents ?? []).map(d => ({ d, path: 'documents', title: d.name || d.type || 'Document' }))].map(({ d, path, title }) => (
                    <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-gm-md bg-surface-sunken px-3 py-2">
                      <span className="min-w-0 text-sm">
                        {title} {d.is_verified ? <Badge label="checked" tone="success" /> : null}
                      </span>
                      <span className="flex gap-2">
                        {d.url ? <Button size="sm" variant="ghost" icon={ExternalLink} label="Open" href={d.url} target="_blank" /> : null}
                        {can('trainers.manage') ? <Button size="sm" variant="outline" label={d.is_verified ? 'Uncheck' : 'Mark checked'} loading={busy === `doc-${d.id}`} onClick={() => toggleDoc(path, d)} /> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {it.rejection_reason ? <Text variant="footnote" tone="danger" className="mt-2">Rejected: {it.rejection_reason}</Text> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {it.verification_status !== 'verified' ? <Button size="sm" label="Approve" loading={busy === `${it.id}-verified`} onClick={() => decide(it, 'verified')} /> : null}
                {it.verification_status !== 'rejected' ? <Button size="sm" variant="danger" label="Reject" onClick={() => setRejecting(it)} /> : null}
                {it.verification_status === 'pending' ? <Button size="sm" variant="outline" label="Mark under review" loading={busy === `${it.id}-under_review`} onClick={() => decide(it, 'under_review')} /> : null}
              </div>
            </Card>
          ))}
          <Pager page={page} pageSize={20} total={q.data.total} onPage={setPage} />
        </div>
      )}
      <PromptDialog
        open={!!rejecting}
        tone="danger"
        title="Reject this application?"
        message="They’ll see the reason and can fix and resubmit."
        label="What needs fixing"
        confirmLabel="Reject"
        onCancel={() => setRejecting(null)}
        onConfirm={async reason => {
          if (rejecting && (await decide(rejecting, 'rejected', reason))) setRejecting(null);
        }}
      />
    </>
  );
}
