import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, BarChart3, Database, Download, ExternalLink, Filter, Plus, X } from 'lucide-react';
import { Badge, BarChart, Button, Card, ErrorState, Sheet, Skeleton, Text } from '../../components/kit';
import { adminError, adminGet, adminHttp } from '../api';
import { LineChart, JsonView } from '../charts';
import { fillSeries, when } from '../format';
import { PageTitle, Pager, SearchBox, Select, Toolbar } from '../ui';
import { useDebounced } from '../useDebounced';

type Col = { name: string; kind: string; secret: boolean };
type TableInfo = { name: string; group: string; rows: number | null; columns: Col[]; links_to: string[] };
type RowsRes = { items: Record<string, unknown>[]; total: number; page: number; page_size: number; pk: string | null; links: Record<string, string> };
type RecordRes = {
  table: string; pk: string; label: string; data: Record<string, unknown>;
  references: { column: string; table: string; id: string; label: string | null }[];
  related: { table: string; column: string; count: number; group: string; sample: { id: string | null; label: string }[] }[];
};
type Analysis = {
  column: string; kind: string; total: number; nulls: number; distinct?: number;
  series?: { bucket: string; count: number }[]; by_weekday?: { weekday: number; count: number }[]; by_hour_ist?: { hour: number; count: number }[];
  min?: unknown; max?: unknown; avg?: number; sum?: number; p50?: number; p90?: number;
  histogram?: { from: number; to: number; count: number }[]; top?: { value: unknown; count: number }[]; note?: string;
};
type FilterRow = { col: string; op: string; value: string };

const OPS: { value: string; label: string }[] = [
  { value: 'eq', label: '=' }, { value: 'ne', label: '≠' }, { value: 'contains', label: 'contains' }, { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' }, { value: 'lt', label: '<' }, { value: 'lte', label: '≤' }, { value: 'in', label: 'in (a,b,c)' },
  { value: 'isnull', label: 'is empty' }, { value: 'notnull', label: 'is not empty' },
];
const pretty = (s: string) => s.replace(/_/g, ' ');

const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function cell(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return when(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** /admin/data[/:table[/:id]] — every table, every record, with analysis and export. */
export default function DataExplorer() {
  const { table, id } = useParams();
  const tables = useQuery({ queryKey: ['admin', 'data', 'tables'], queryFn: () => adminGet<TableInfo[]>('/data/tables'), staleTime: 60_000 });
  const [find, setFind] = useState('');
  const navigate = useNavigate();
  const info = tables.data?.find(t => t.name === table);

  const groups = useMemo(() => {
    const list = (tables.data ?? []).filter(t => !find || t.name.includes(find.toLowerCase().replace(/ /g, '_')));
    return [...new Set(list.map(t => t.group))].map(g => ({ g, items: list.filter(t => t.group === g) }));
  }, [tables.data, find]);

  return (
    <>
      <PageTitle title="Data explorer" subtitle="Every table in the Gymmigo database. Search, filter, analyse and export; passwords, OTPs and tokens are never shown. Opening people's records and exports are audited." />
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <SearchBox value={find} onChange={setFind} placeholder="Find a table" />
          <div className="lg:hidden">
            <Select label="Table" value={table ?? ''} onChange={v => navigate(v ? `/admin/data/${v}` : '/admin/data')}
              options={[{ value: '', label: 'Choose a table…' }, ...(tables.data ?? []).map(t => ({ value: t.name, label: `${pretty(t.name)} (${t.rows ?? '?'})` }))]} />
          </div>
          <nav aria-label="Tables" className="hidden max-h-[70vh] overflow-y-auto rounded-gm-xl border border-border bg-surface p-2 lg:block">
            {tables.isLoading ? <Skeleton className="h-60" /> : groups.map(({ g, items }) => (
              <div key={g} className="mb-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{g}</p>
                {items.map(t => (
                  <Link key={t.name} to={`/admin/data/${t.name}`}
                    className={`flex items-center justify-between gap-2 rounded-gm-md px-2 py-1.5 text-sm ${t.name === table ? 'bg-accent-soft text-accent-text' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'}`}>
                    <span className="truncate">{pretty(t.name)}</span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-subtle">{t.rows?.toLocaleString('en-IN') ?? '?'}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">
          {!table ? (
            <Card className="flex flex-col items-center gap-2 py-12 text-center">
              <Database className="text-ink-subtle" aria-hidden />
              <Text variant="subtitle">Pick a table</Text>
              <Text tone="muted">{tables.data ? `${tables.data.length} tables · ${tables.data.reduce((a, t) => a + (t.rows ?? 0), 0).toLocaleString('en-IN')} rows` : ''}</Text>
            </Card>
          ) : info ? (
            <TableView key={table} info={info} />
          ) : tables.isLoading ? <Skeleton className="h-64" /> : <ErrorState title="Unknown table" />}
        </section>
      </div>
      {table && id ? <RecordSheet table={table} id={id} onClose={() => navigate(`/admin/data/${table}`)} /> : null}
    </>
  );
}

function TableView({ info }: { info: TableInfo }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initial: FilterRow[] = (() => {
    try {
      return JSON.parse(params.get('f') || '[]');
    } catch {
      return [];
    }
  })();
  const [filters, setFilters] = useState<FilterRow[]>(initial);
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [sort, setSort] = useState<{ col: string; desc: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const [analyze, setAnalyze] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const active = filters.filter(f => f.col && (f.value !== '' || f.op === 'isnull' || f.op === 'notnull'));
  const fParam = active.length ? JSON.stringify(active) : undefined;
  const rows = useQuery({
    queryKey: ['admin', 'data', 'rows', info.name, fParam, q, sort, page],
    queryFn: () => adminGet<RowsRes>(`/data/tables/${info.name}/rows`, { filters: fParam, q, sort: sort?.col, desc: sort?.desc ?? true, page, page_size: 50 }),
  });
  const cols = info.columns;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminHttp.get(`/data/tables/${info.name}/export`, { params: { filters: fParam, q: q || undefined }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymmigo-${info.name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(adminError(e).message);
    } finally {
      setExporting(false);
    }
  };
  const setF = (i: number, patch: Partial<FilterRow>) => {
    const next = filters.map((f, k) => (k === i ? { ...f, ...patch } : f));
    setFilters(next);
    setPage(1);
    setParams(next.length ? { f: JSON.stringify(next) } : {}, { replace: true });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Text variant="h2">{pretty(info.name)}</Text>
          <Text variant="caption" tone="subtle">{rows.data ? `${rows.data.total.toLocaleString('en-IN')} matching rows` : '…'} · {cols.length} columns{info.links_to.length ? ` · links to ${info.links_to.map(pretty).join(', ')}` : ''}</Text>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={BarChart3} label="Analyse" onClick={() => setAnalyze(cols.find(c => c.kind === 'datetime')?.name ?? cols[0].name)} />
          <Button size="sm" variant="secondary" icon={Download} label="CSV" loading={exporting} onClick={exportCsv} />
        </div>
      </div>
      <Toolbar>
        <SearchBox value={search} onChange={v => (setSearch(v), setPage(1))} placeholder="Search text columns or paste an id" />
        <Button size="sm" variant="outline" icon={Filter} label="Add filter" onClick={() => setFilters([...filters, { col: cols[0].name, op: 'eq', value: '' }])} />
      </Toolbar>
      {filters.map((f, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Select label="Column" value={f.col} onChange={v => setF(i, { col: v })} options={cols.filter(c => !c.secret).map(c => ({ value: c.name, label: `${c.name} (${c.kind})` }))} />
          <Select label="Operator" value={f.op} onChange={v => setF(i, { op: v })} options={OPS} />
          {f.op !== 'isnull' && f.op !== 'notnull' ? (
            <input aria-label="Value" value={f.value} onChange={e => setF(i, { value: e.target.value })} placeholder={cols.find(c => c.name === f.col)?.kind === 'datetime' ? '2026-11-01' : 'value'}
              className="h-10 min-w-0 flex-1 basis-40 rounded-gm-lg border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent" />
          ) : null}
          <button aria-label="Remove filter" onClick={() => { const next = filters.filter((_, k) => k !== i); setFilters(next); setParams(next.length ? { f: JSON.stringify(next) } : {}, { replace: true }); }}
            className="rounded-gm-md p-2 text-ink-subtle hover:bg-surface-sunken hover:text-danger"><X size={16} /></button>
        </div>
      ))}

      {rows.isLoading ? <Skeleton className="h-72" rounded="xl" /> : rows.isError || !rows.data ? <ErrorState message={adminError(rows.error).message} onRetry={() => rows.refetch()} /> : (
        <>
          <div className="overflow-x-auto rounded-gm-xl border border-border bg-surface shadow-card">
            <table className="w-max min-w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-border bg-surface-sunken text-[11px] uppercase tracking-wider text-ink-subtle">
                <tr>
                  {cols.map(c => (
                    <th key={c.name} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                      <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => (setSort(s => (s?.col === c.name ? { col: c.name, desc: !s.desc } : { col: c.name, desc: true })), setPage(1))}>
                        {c.name}
                        {sort?.col === c.name ? (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.data.items.map((r, i) => (
                  <tr key={String(r[rows.data.pk ?? ''] ?? i)} onClick={() => rows.data.pk && navigate(`/admin/data/${info.name}/${r[rows.data.pk]}${window.location.search}`)}
                    className={`border-b border-border last:border-0 ${rows.data.pk ? 'cursor-pointer hover:bg-surface-sunken' : ''}`}>
                    {cols.map(c => {
                      const v = r[c.name];
                      const link = rows.data.links[c.name];
                      return (
                        <td key={c.name} className="max-w-[260px] truncate whitespace-nowrap px-3 py-2 text-ink">
                          {link && v ? (
                            <Link to={`/admin/data/${link}/${v}`} onClick={e => e.stopPropagation()} className="font-mono text-accent-text underline">{String(v).slice(0, 8)}…</Link>
                          ) : c.kind === 'uuid' && v ? <span className="font-mono">{String(v).slice(0, 8)}…</span> : cell(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.data.items.length ? <p className="p-8 text-center text-sm text-ink-subtle">No rows match.</p> : null}
          </div>
          <Pager page={page} pageSize={50} total={rows.data.total} onPage={setPage} />
        </>
      )}
      {analyze ? <AnalyzeSheet info={info} column={analyze} setColumn={setAnalyze} filters={fParam} q={q} onClose={() => setAnalyze(null)} /> : null}
    </div>
  );
}

function AnalyzeSheet({ info, column, setColumn, filters, q, onClose }: { info: TableInfo; column: string; setColumn: (c: string) => void; filters?: string; q: string; onClose: () => void }) {
  const [interval, setInterval] = useState('day');
  const [days, setDays] = useState('90');
  const a = useQuery({
    queryKey: ['admin', 'data', 'analyze', info.name, column, filters, q, interval, days],
    queryFn: () => adminGet<Analysis>(`/data/tables/${info.name}/analyze`, { column, filters, q: q || undefined, interval, days }),
  });
  const d = a.data;
  return (
    <Sheet open onClose={onClose} eyebrow={`Analyse · ${pretty(info.name)}`} title={column} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Select label="Column" value={column} onChange={setColumn} options={info.columns.filter(c => !c.secret).map(c => ({ value: c.name, label: `${c.name} (${c.kind})` }))} />
          {d && (d.kind === 'datetime' || d.kind === 'date') ? (
            <>
              <Select label="Interval" value={interval} onChange={setInterval} options={['hour', 'day', 'week', 'month'].map(v => ({ value: v, label: `per ${v}` }))} />
              <Select label="Range" value={days} onChange={setDays} options={[['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['365', '1 year'], ['3650', 'all time']].map(([value, label]) => ({ value, label }))} />
            </>
          ) : null}
        </div>
        {filters || q ? <Badge label="Using the table's current filters and search" tone="info" /> : null}
        {a.isLoading ? <Skeleton className="h-48" /> : a.isError || !d ? <ErrorState message={adminError(a.error).message} /> : (
          <>
            <Text variant="caption" tone="subtle">{d.total.toLocaleString('en-IN')} rows · {d.nulls.toLocaleString('en-IN')} empty{d.distinct != null ? ` · ${d.distinct.toLocaleString('en-IN')} distinct` : ''}</Text>
            {d.series ? (
              <Card>
                <Text variant="subtitle" className="mb-2">Rows per {interval}</Text>
                <LineChart label="Trend" points={fillSeries(d.series, interval).map(s => ({ x: s.bucket.slice(0, interval === 'hour' ? 13 : 10), y: s.count }))} format={v => String(Math.round(v))} />
                <Text variant="caption" tone="subtle" className="mt-2">First {cell(d.min)} · latest {cell(d.max)}</Text>
              </Card>
            ) : null}
            {d.by_weekday?.length ? (
              <Card><Text variant="subtitle" className="mb-2">By weekday</Text><BarChart bars={[1, 2, 3, 4, 5, 6, 7].map(w => ({ label: DAYS[w], value: d.by_weekday!.find(x => x.weekday === w)?.count ?? 0 }))} height={100} /></Card>
            ) : null}
            {d.by_hour_ist?.length ? (
              <Card><Text variant="subtitle" className="mb-2">By hour of day (IST)</Text><BarChart bars={Array.from({ length: 24 }, (_, h) => ({ label: h % 3 === 0 ? String(h) : '', value: d.by_hour_ist!.find(x => x.hour === h)?.count ?? 0 }))} height={100} /></Card>
            ) : null}
            {d.histogram ? (
              <Card>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
                  {(['min', 'p50', 'avg', 'p90', 'max', 'sum'] as const).map(k => (
                    <div key={k}><div className="text-[11px] uppercase text-ink-subtle">{k === 'p50' ? 'median' : k}</div><div className="font-semibold tabular-nums">{d[k] != null ? Number(d[k]).toLocaleString('en-IN') : '—'}</div></div>
                  ))}
                </div>
                <BarChart bars={d.histogram.map(b => ({ label: '', value: b.count, caption: `${b.from}–${b.to}` }))} height={110} formatValue={v => `${v} rows`} />
                <div className="mt-1 flex justify-between text-[11px] text-ink-subtle"><span>{d.histogram[0].from}</span><span>{d.histogram[d.histogram.length - 1].to}</span></div>
              </Card>
            ) : null}
            {d.top ? (
              <Card padding="none">
                {d.top.map((t, i) => {
                  const max = d.top![0].count || 1;
                  return (
                    <div key={i} className="relative flex justify-between gap-3 border-b border-border px-4 py-2 text-sm last:border-0">
                      <div className="absolute inset-y-0 left-0 bg-accent-soft" style={{ width: `${(t.count / max) * 100}%` }} aria-hidden />
                      <span className="relative min-w-0 truncate">{cell(t.value)}</span>
                      <span className="relative font-semibold tabular-nums">{t.count.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </Card>
            ) : null}
            {d.note ? <Text tone="muted">{d.note}</Text> : null}
          </>
        )}
      </div>
    </Sheet>
  );
}

function RecordSheet({ table, id, onClose }: { table: string; id: string; onClose: () => void }) {
  const r = useQuery({ queryKey: ['admin', 'data', 'record', table, id], queryFn: () => adminGet<RecordRes>(`/data/tables/${table}/rows/${id}`) });
  const d = r.data;
  const userId = table === 'users' ? id : table === 'personal_profiles' ? (d?.data.user_id as string | undefined) : undefined;
  return (
    <Sheet open onClose={onClose} eyebrow={pretty(table)} title={d?.label ?? 'Record'} size="lg">
      {r.isLoading ? <Skeleton className="h-60" /> : r.isError || !d ? <ErrorState message={adminError(r.error).message} /> : (
        <div className="flex flex-col gap-5">
          {userId ? <Button size="sm" icon={ExternalLink} label="Open member 360" to={`/admin/users/${userId}`} /> : null}
          {table === 'gyms' ? <Button size="sm" icon={ExternalLink} label="Open gym 360" to={`/admin/gyms/${id}`} /> : null}
          <dl className="divide-y divide-border rounded-gm-lg border border-border">
            {Object.entries(d.data).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-3 px-3 py-2 text-sm">
                <dt className="truncate text-ink-subtle">{k}</dt>
                <dd className="min-w-0 break-words">{v != null && typeof v === 'object' ? <JsonView value={v} /> : cell(v)}</dd>
              </div>
            ))}
          </dl>
          {d.references.length ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-2">Points to</Text>
              <div className="flex flex-col gap-1">
                {d.references.map(ref => (
                  <Link key={ref.column} to={`/admin/data/${ref.table}/${ref.id}`} className="flex justify-between rounded-gm-md bg-surface-sunken px-3 py-2 text-sm hover:text-accent-text">
                    <span>{ref.column} → {pretty(ref.table)}</span><span className="truncate pl-3 font-semibold">{ref.label ?? ref.id}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Related records ({d.related.reduce((a, x) => a + x.count, 0).toLocaleString('en-IN')})</Text>
            {d.related.length ? (
              <div className="flex flex-col gap-1">
                {d.related.map(rel => (
                  <Link key={`${rel.table}.${rel.column}`} to={`/admin/data/${rel.table}?f=${encodeURIComponent(JSON.stringify([{ col: rel.column, op: 'eq', value: id }]))}`}
                    className="flex items-center justify-between gap-3 rounded-gm-md bg-surface-sunken px-3 py-2 text-sm hover:text-accent-text">
                    <span className="min-w-0"><span className="font-semibold">{pretty(rel.table)}</span><span className="text-ink-subtle"> · {rel.column}</span>
                      {rel.sample.length ? <span className="block truncate text-xs text-ink-subtle">{rel.sample.map(s => s.label).join(' · ')}</span> : null}</span>
                    <Badge label={rel.count.toLocaleString('en-IN')} />
                  </Link>
                ))}
              </div>
            ) : <Text tone="muted">Nothing else references this record.</Text>}
          </section>
          <Button size="sm" variant="ghost" icon={Plus} label="Filter this table by this record" to={`/admin/data/${table}?f=${encodeURIComponent(JSON.stringify([{ col: d.pk, op: 'eq', value: id }]))}`} />
        </div>
      )}
    </Sheet>
  );
}
