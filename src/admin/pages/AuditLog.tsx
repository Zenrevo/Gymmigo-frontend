import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button, Card, ErrorState, Sheet, Skeleton, Text } from '../../components/kit';
import { adminGet, type Paged } from '../api';
import { when } from '../format';
import { DataTable, Field, PageTitle, Pager, SearchBox, Select, Toolbar } from '../ui';
import { useAdminAction } from '../useAdminAction';
import { useDebounced } from '../useDebounced';

type Entry = { id: number; created_at: string; actor: string | null; action: string; target_type: string | null; target_id: string | null; summary: string | null; details: Record<string, unknown> | null; ip_address: string | null; entry_hash: string };
type Chain = { valid: boolean; checked: number; broken_at_id: number | null; head?: string };

const ACTIONS = ['', 'auth', 'user', 'verification', 'gym', 'trainer', 'membership', 'booking', 'review', 'club', 'setting', 'admin'];

export default function AuditLog() {
  const [actorInput, setActorInput] = useState('');
  const actor = useDebounced(actorInput);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Entry | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const { busy, run } = useAdminAction();
  const q = useQuery({ queryKey: ['admin', 'audit', actor, action, page], queryFn: () => adminGet<Paged<Entry>>('/audit', { actor, action, page, page_size: 50 }) });

  return (
    <>
      <PageTitle
        title="Audit log"
        subtitle="Every admin action, append-only. Entries can’t be edited or deleted, and each one is chained to the previous by hash."
        actions={<Button size="sm" variant="secondary" icon={ShieldCheck} label="Verify integrity" loading={busy === 'verify'} onClick={() => run('verify', async () => setChain(await adminGet<Chain>('/audit/verify')), 'Check finished')} />}
      />
      {chain ? (
        <Card variant={chain.valid ? 'accent' : 'outline'} className="mb-4">
          <div className="flex items-center gap-3">
            {chain.valid ? <ShieldCheck className="text-success" aria-hidden /> : <ShieldAlert className="text-danger" aria-hidden />}
            <Text>{chain.valid ? `Intact: all ${chain.checked.toLocaleString('en-IN')} entries match their hashes.` : `Broken at entry #${chain.broken_at_id}: the log was altered outside the console.`}</Text>
          </div>
        </Card>
      ) : null}
      <Toolbar>
        <SearchBox value={actorInput} onChange={v => (setActorInput(v), setPage(1))} placeholder="Admin username" />
        <Select label="Area" value={action} onChange={v => (setAction(v), setPage(1))} options={ACTIONS.map(a => ({ value: a, label: a ? a[0].toUpperCase() + a.slice(1) : 'All areas' }))} />
      </Toolbar>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : (
        <>
          <DataTable rows={q.data.items} rowKey={e => String(e.id)} onRowClick={setOpen} empty="No entries." columns={[
            { key: 'w', label: 'When', render: e => when(e.created_at) },
            { key: 'a', label: 'Admin', render: e => e.actor || 'system' },
            { key: 'x', label: 'Action', render: e => <code className="text-xs">{e.action}</code> },
            { key: 's', label: 'What happened', render: e => e.summary || '—' },
          ]} />
          <Pager page={page} pageSize={50} total={q.data.total} onPage={setPage} />
        </>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} eyebrow={`Entry #${open?.id}`} title={open?.summary || open?.action}>
        {open ? (
          <div>
            <Field label="When">{when(open.created_at)}</Field>
            <Field label="Admin">{open.actor || 'system'}</Field>
            <Field label="Action"><code>{open.action}</code></Field>
            <Field label="Target">{open.target_type ? `${open.target_type} ${open.target_id ?? ''}` : '—'}</Field>
            <Field label="IP address">{open.ip_address}</Field>
            <Field label="Hash"><code className="break-all text-xs">{open.entry_hash}</code></Field>
            {open.details ? <pre className="mt-3 max-h-80 overflow-auto rounded-gm-md bg-surface-sunken p-3 text-xs">{JSON.stringify(open.details, null, 2)}</pre> : null}
          </div>
        ) : <span />}
      </Sheet>
    </>
  );
}
