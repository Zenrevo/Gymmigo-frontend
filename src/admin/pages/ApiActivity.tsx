import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, ErrorState, Sheet, Skeleton, Text } from '../../components/kit';
import { adminGet } from '../api';
import { when } from '../format';
import { DataTable, Field, PageTitle, Pager, SearchBox, Select, Toolbar } from '../ui';
import { useDebounced } from '../useDebounced';

type Item = { id: number; at: string; actor_type: string; actor_id: string | null; actor: string | null; method: string; path: string; route: string | null; query: string | null; status: number; ms: number; ip: string | null; client: string | null; request_id: string | null };
type Activity = {
  items: Item[]; total: number; page: number; page_size: number; by_actor_type: Record<string, number>;
  top_routes: { method: string; route: string; count: number; avg_ms: number; errors: number }[];
  top_actors: { actor_type: string; actor_id: string; actor: string | null; count: number; last_at: string | null }[];
};

const HOURS = [{ value: '1', label: 'Last hour' }, { value: '24', label: 'Last 24 hours' }, { value: '168', label: 'Last 7 days' }, { value: '720', label: 'Last 30 days' }, { value: '2160', label: 'Last 90 days' }];
const statusTone = (s: number) => (s >= 500 ? 'text-danger' : s >= 400 ? 'text-warning' : 'text-success');
const ActorLink = ({ type, id, label }: { type: string; id: string | null; label: string | null }) =>
  type === 'user' && id ? <Link className="text-accent-text underline" to={`/admin/users/${id}`} onClick={e => e.stopPropagation()}>{label || id.slice(0, 8)}</Link>
    : <span>{type === 'anonymous' ? 'Not signed in' : `${type === 'admin' ? 'Admin ' : ''}${label ?? ''}`}</span>;

/** Every API request (who, what, when, result). Used as a page and inside a member's or admin's page with actorId set. */
export function ActivityList({ actorId, actorType, compact }: { actorId?: string; actorType?: string; compact?: boolean }) {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [type, setType] = useState(actorType ?? '');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [hours, setHours] = useState(compact ? '168' : '24');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Item | null>(null);
  const reset = <T,>(f: (v: T) => void) => (v: T) => (f(v), setPage(1));
  const res = useQuery({
    queryKey: ['admin', 'activity', actorId, type, q, status, method, hours, page],
    queryFn: () => adminGet<Activity>('/monitor/activity', { actor_id: actorId, actor_type: type || undefined, q: q || undefined, status: status || undefined, method: method || undefined, hours, page, page_size: 50 }),
    refetchInterval: 30_000,
  });
  const d = res.data;

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <SearchBox value={search} onChange={reset(setSearch)} placeholder={actorId ? 'Path' : 'Path, phone or username'} />
        {!actorId ? <Select label="Who" value={type} onChange={reset(setType)} options={[{ value: '', label: 'Everyone' }, { value: 'user', label: 'App users' }, { value: 'admin', label: 'Admins' }, { value: 'anonymous', label: 'Not signed in' }]} /> : null}
        <Select label="Result" value={status} onChange={reset(setStatus)} options={[{ value: '', label: 'Any result' }, { value: '2xx', label: 'Success (2xx)' }, { value: 'errors', label: 'Errors (4xx/5xx)' }, { value: '4xx', label: 'Client errors (4xx)' }, { value: '5xx', label: 'Server errors (5xx)' }]} />
        <Select label="Method" value={method} onChange={reset(setMethod)} options={[{ value: '', label: 'Any method' }, ...['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ value: m, label: m }))]} />
        <Select label="Period" value={hours} onChange={reset(setHours)} options={HOURS} />
      </Toolbar>
      {res.isLoading ? <Skeleton className="h-64" rounded="xl" /> : res.isError || !d ? <ErrorState onRetry={() => res.refetch()} /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <Text variant="subtitle" className="mb-2">Most called ({d.total.toLocaleString('en-IN')} requests)</Text>
              {!actorId ? <Text variant="caption" tone="subtle" className="mb-2">{Object.entries(d.by_actor_type).map(([k, n]) => `${k}: ${n.toLocaleString('en-IN')}`).join(' · ') || 'No requests'}</Text> : null}
              {d.top_routes.slice(0, compact ? 6 : 15).map(r => (
                <div key={r.method + r.route} className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm last:border-0">
                  <span className="min-w-0 truncate font-mono text-xs">{r.method} {r.route}</span>
                  <span className="shrink-0 text-xs text-ink-subtle">{r.count} · {r.avg_ms} ms{r.errors ? <span className="text-danger"> · {r.errors} 5xx</span> : null}</span>
                </div>
              ))}
            </Card>
            {!actorId ? (
              <Card>
                <Text variant="subtitle" className="mb-2">Most active logins</Text>
                {d.top_actors.map(a => (
                  <div key={a.actor_id} className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm last:border-0">
                    <span className="min-w-0 truncate"><ActorLink type={a.actor_type} id={a.actor_id} label={a.actor} /></span>
                    <span className="shrink-0 text-xs text-ink-subtle">{a.count} · {when(a.last_at)}</span>
                  </div>
                ))}
              </Card>
            ) : null}
          </div>
          <DataTable rows={d.items} rowKey={i => String(i.id)} onRowClick={setOpen} empty="No requests in this period." columns={[
            { key: 't', label: 'When', render: i => when(i.at) },
            ...(actorId ? [] : [{ key: 'a', label: 'Who', render: (i: Item) => <ActorLink type={i.actor_type} id={i.actor_id} label={i.actor} /> }]),
            { key: 'r', label: 'Request', render: i => <span className="break-all font-mono text-xs">{i.method} {i.path}</span> },
            { key: 's', label: 'Result', render: i => <span className={`font-semibold ${statusTone(i.status)}`}>{i.status}</span> },
            { key: 'd', label: 'Time', render: i => `${i.ms} ms` },
            { key: 'c', label: 'Device', render: i => <span className="text-xs">{i.client || '—'}</span> },
          ]} />
          <Pager page={page} pageSize={50} total={d.total} onPage={setPage} />
        </>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} eyebrow="API request" title={open ? `${open.method} ${open.route ?? open.path}` : ''}>
        {open ? (
          <div>
            <Field label="When">{when(open.at)}</Field>
            <Field label="Who"><ActorLink type={open.actor_type} id={open.actor_id} label={open.actor} /></Field>
            <Field label="Path"><span className="break-all font-mono text-xs">{open.path}{open.query ? `?${open.query}` : ''}</span></Field>
            <Field label="Result"><span className={statusTone(open.status)}>{open.status}</span></Field>
            <Field label="Duration">{open.ms} ms</Field>
            <Field label="IP">{open.ip}</Field>
            <Field label="Device / app">{open.client}</Field>
            <Field label="Request id"><span className="font-mono text-xs">{open.request_id}</span></Field>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

export default function ApiActivity() {
  return (
    <>
      <PageTitle title="API activity" subtitle="Every API request by every login (app users and admins): who called what, when, from where and the result. Kept for the period set in monitor.request_log_days." />
      <ActivityList />
    </>
  );
}
