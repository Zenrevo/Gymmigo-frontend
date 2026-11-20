import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, Skeleton } from '../../components/kit';
import { adminGet, type Paged } from '../api';
import { DataTable, PageTitle, Pager, SearchBox, Select, StatusPill, Toolbar } from '../ui';
import { useDebounced } from '../useDebounced';
import { useAdmin } from '../useAdmin';
import { CreatePersonSheet } from '../CreatePeople';

type Row = { id: string; user_id: string; phone: string; full_name: string | null; verification_status: string; experience_years: number | null; is_available: boolean; location: string | null; rating_avg: number | null; rating_count: number };

export default function Trainers() {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { can } = useAdmin();
  const [adding, setAdding] = useState(false);
  const list = useQuery({ queryKey: ['admin', 'trainers', q, status, page], queryFn: () => adminGet<Paged<Row>>('/trainers', { q, status, page, page_size: 25 }) });
  return (
    <>
      <PageTitle title="Trainers" subtitle="Every trainer profile. Approve or reject them under Verifications."
        actions={can('trainers.edit') ? <Button size="sm" label="+ Add trainer" onClick={() => setAdding(true)} /> : undefined} />
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Name, phone or area" />
        <Select label="Verification" value={status} onChange={v => (setStatus(v), setPage(1))} options={[
          { value: '', label: 'Any status' }, { value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' },
          { value: 'under_review', label: 'Under review' }, { value: 'rejected', label: 'Rejected' },
        ]} />
      </Toolbar>
      {list.isLoading ? <Skeleton className="h-64" rounded="xl" /> : list.isError || !list.data ? <ErrorState onRetry={() => list.refetch()} /> : (
        <>
          <DataTable rows={list.data.items} rowKey={r => r.id} empty="No trainers match." columns={[
            { key: 'n', label: 'Trainer', render: r => <><div className="font-semibold">{r.full_name || '—'}</div><div className="text-xs text-ink-subtle">{r.phone}</div></> },
            { key: 'v', label: 'Verification', render: r => <StatusPill status={r.verification_status} /> },
            { key: 'e', label: 'Experience', render: r => (r.experience_years != null ? `${r.experience_years} yrs` : '—') },
            { key: 'r', label: 'Rating', render: r => (r.rating_avg != null ? `${r.rating_avg.toFixed(1)} ★ (${r.rating_count})` : '—') },
            { key: 'a', label: 'Taking clients', render: r => (r.is_available ? 'Yes' : 'No') },
            { key: 'l', label: 'Area', render: r => r.location || '—' },
          ]} />
          <Pager page={page} pageSize={25} total={list.data.total} onPage={setPage} />
        </>
      )}
      {adding ? <CreatePersonSheet defaultRole="trainer" onClose={() => setAdding(false)} /> : null}
    </>
  );
}
