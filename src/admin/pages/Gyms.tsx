import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, Skeleton } from '../../components/kit';
import { adminGet, adminPatch, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { when } from '../format';
import { DataTable, PageTitle, Pager, PromptDialog, SearchBox, Select, StatusPill, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';
import { useDebounced } from '../useDebounced';

type Gym = { id: string; name: string; city: string | null; state: string | null; owner_business: string | null; contact_phone: string | null; is_verified: boolean; is_active: boolean; active_members: number; rating_avg: number | null; rating_count: number; created_at: string };

export default function Gyms() {
  const { can } = useAdmin();
  const { busy, run } = useAdminAction();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [verified, setVerified] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState<Gym | null>(null);
  const list = useQuery({
    queryKey: ['admin', 'gyms', q, verified, active, page],
    queryFn: () => adminGet<Paged<Gym>>('/gyms', { q, verified: verified || undefined, active: active || undefined, page, page_size: 25 }),
  });
  const patch = (g: Gym, body: Record<string, unknown>, msg: string) => run(`${g.id}-${Object.keys(body)[0]}`, () => adminPatch(`/gyms/${g.id}`, body), msg, ['gyms', 'overview']);

  return (
    <>
      <PageTitle title="Gyms" subtitle="Verify gyms and take them off the app if needed." />
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Gym, city, phone or business" />
        <Select label="Verified" value={verified} onChange={v => (setVerified(v), setPage(1))} options={[{ value: '', label: 'Verified or not' }, { value: 'true', label: 'Verified' }, { value: 'false', label: 'Not verified' }]} />
        <Select label="Active" value={active} onChange={v => (setActive(v), setPage(1))} options={[{ value: '', label: 'Live or hidden' }, { value: 'true', label: 'Live' }, { value: 'false', label: 'Hidden' }]} />
      </Toolbar>
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <>
          <DataTable rows={list.data.items} rowKey={g => g.id} empty="No gyms match." columns={[
            { key: 'n', label: 'Gym', render: g => <><div className="font-semibold">{g.name}</div><div className="text-xs text-ink-subtle">{[g.city, g.state].filter(Boolean).join(', ') || '—'} · {g.owner_business || 'owner'}</div></> },
            { key: 'v', label: 'Verified', render: g => <StatusPill status={g.is_verified ? 'verified' : 'pending'} label={g.is_verified ? 'verified' : 'not verified'} /> },
            { key: 'a', label: 'On the app', render: g => <StatusPill status={g.is_active ? 'active' : 'deactivated'} label={g.is_active ? 'live' : 'hidden'} /> },
            { key: 'm', label: 'Active members', render: g => g.active_members },
            { key: 'r', label: 'Rating', render: g => (g.rating_avg != null ? `${g.rating_avg.toFixed(1)} ★ (${g.rating_count})` : '—') },
            { key: 'c', label: 'Added', render: g => when(g.created_at, false) },
            ...(can('gyms.manage') ? [{
              key: 'x', label: 'Actions', render: (g: Gym) => (
                <div className="flex flex-wrap justify-end gap-1 md:justify-start">
                  <Button size="sm" variant={g.is_verified ? 'outline' : 'primary'} label={g.is_verified ? 'Unverify' : 'Verify'} loading={busy === `${g.id}-is_verified`} onClick={() => patch(g, { is_verified: !g.is_verified }, g.is_verified ? 'Verification removed' : 'Gym verified')} />
                  {g.is_active
                    ? <Button size="sm" variant="danger" label="Hide" onClick={() => setDeactivating(g)} />
                    : <Button size="sm" variant="secondary" label="Make live" loading={busy === `${g.id}-is_active`} onClick={() => patch(g, { is_active: true }, 'Gym is live again')} />}
                </div>
              ),
            }] : []),
          ]} />
          <Pager page={page} pageSize={25} total={list.data.total} onPage={setPage} />
        </>
      )}
      <PromptDialog
        open={!!deactivating}
        tone="danger"
        title={`Hide ${deactivating?.name ?? 'this gym'}?`}
        message="It disappears from search and can’t take new members. Existing data stays."
        label="Reason (saved in the audit log)"
        confirmLabel="Hide gym"
        onCancel={() => setDeactivating(null)}
        onConfirm={async reason => {
          if (deactivating && (await run(`${deactivating.id}-is_active`, () => adminPatch(`/gyms/${deactivating.id}`, { is_active: false, reason }), 'Gym hidden', ['gyms', 'overview']))) setDeactivating(null);
        }}
      />
    </>
  );
}
