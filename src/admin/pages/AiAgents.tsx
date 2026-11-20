import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Settings2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge, BarChart, Button, Card, ErrorState, Sheet, Skeleton, StatTile, Text, type Tone } from '../../components/kit';
import { adminGet, type Paged } from '../api';
import { useAdmin } from '../useAdmin';
import { when } from '../format';
import { DataTable, Field, PageTitle, Pager, Select, Toolbar } from '../ui';

type AgentStats = {
  agent: string; label: string; engine: string; runs: number; ok: number; blocked: number; errors: number; fallbacks: number;
  success_rate: number | null; avg_latency_ms: number; p95_latency_ms: number; tokens: number; avg_tokens: number;
  repairs: number; revised: number; helpful: number; not_helpful: number; satisfaction: number | null; tool_calls: number;
};
type Overview = {
  days: number;
  totals: { runs: number; ok: number; blocked: number; errors: number; fallbacks: number; tokens: number; repairs: number; revised: number; helpful: number; not_helpful: number; users: number };
  agents: AgentStats[];
  guardrails: { name: string; count: number }[];
  daily: { date: string; runs: number; tokens: number; failures: number }[];
};
type RunRow = {
  id: string; created_at: string; agent: string; label: string; engine: string; user_id: string | null; status: string; model: string | null;
  latency_ms: number | null; total_tokens: number; llm_calls: number; tool_calls: number; repairs: number; input_preview: string | null;
  output_preview: string | null; guardrails: { name: string; action: string }[]; verdict: string | null; feedback: number | null;
};
type Step = { t: number; kind: string; name: string; [k: string]: unknown };
type RunDetail = RunRow & { prompt_tokens: number; output_tokens: number; review: Record<string, unknown> | null; trace: Step[]; error: string | null; feedback_note: string | null };

const STATUS_TONE: Record<string, Tone> = { ok: 'success', blocked: 'warning', error: 'danger', fallback: 'info' };
const GUARD_LABEL: Record<string, string> = {
  pii_redaction: 'Personal data masked', prompt_injection: 'Prompt injection flagged', crisis_protocol: 'Crisis protocol',
  tool_allowlist: 'Tool blocked', tool_call_budget: 'Tool budget hit', llm_call_budget: 'Model budget hit',
  output_check: 'Unsafe answer replaced', ai_disabled_or_budget: 'AI off / daily limit',
};
const num = (n: number) => n.toLocaleString('en-IN');
const secs = (ms?: number | null) => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export default function AiAgents() {
  const { can } = useAdmin();
  const [days, setDays] = useState('7');
  const [agent, setAgent] = useState('');
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const ov = useQuery({ queryKey: ['admin', 'ai', 'overview', days], queryFn: () => adminGet<Overview>('/ai/overview', { days }) });
  const runs = useQuery({
    queryKey: ['admin', 'ai', 'runs', agent, status, feedback, page],
    queryFn: () => adminGet<Paged<RunRow>>('/ai/runs', { agent, status, feedback, page, page_size: 30 }),
  });
  const d = ov.data;

  return (
    <>
      <PageTitle
        title="AI agents"
        subtitle="Quality, cost and safety of every AI feature. Migo, Club designer and Program planner run as governed ADK workflows; every other AI call goes through the governed gateway."
        actions={can('settings.view') ? <Button size="sm" variant="secondary" icon={Settings2} label="AI settings" to="/admin/settings#ai" /> : undefined}
      />
      <Toolbar>
        <Select label="Period" value={days} onChange={setDays} options={[{ value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} />
      </Toolbar>

      {ov.isLoading ? <Skeleton className="h-64" rounded="xl" /> : ov.isError || !d ? <ErrorState onRetry={() => ov.refetch()} /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Runs" value={num(d.totals.runs)} caption={`${num(d.totals.users)} members`} />
            <StatTile label="Success" value={d.totals.runs - d.totals.blocked ? `${Math.round((d.totals.ok / (d.totals.runs - d.totals.blocked)) * 100)}%` : '—'}
              caption={`${d.totals.errors} errors · ${d.totals.fallbacks} fallbacks`} captionTone={d.totals.errors ? 'danger' : 'subtle'} />
            <StatTile label="Tokens" value={num(d.totals.tokens)} caption={d.totals.runs ? `${num(Math.round(d.totals.tokens / d.totals.runs))} per run` : 'no runs'} />
            <StatTile label="Member rating" value={d.totals.helpful + d.totals.not_helpful ? `${Math.round((d.totals.helpful / (d.totals.helpful + d.totals.not_helpful)) * 100)}%` : '—'}
              caption={`${d.totals.helpful} 👍 · ${d.totals.not_helpful} 👎`} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <Text variant="subtitle">Runs per day</Text>
              <Text variant="caption" tone="subtle">{d.totals.repairs} automatic repairs · {d.totals.revised} answers corrected by the reviewer · {d.totals.blocked} blocked</Text>
              <BarChart className="mt-4" ariaLabel="AI runs per day" bars={d.daily.map((x, i, all) => ({
                label: all.length <= 10 || i % Math.ceil(all.length / 8) === 0 ? new Date(x.date).getDate().toString() : '',
                value: x.runs, highlight: x.failures > 0, caption: `${x.failures} failed`,
              }))} />
            </Card>
            <Card>
              <Text variant="subtitle">Guardrails</Text>
              {d.guardrails.length ? d.guardrails.map(g => (
                <div key={g.name} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
                  <span>{GUARD_LABEL[g.name] ?? g.name}</span><span className="font-semibold">{num(g.count)}</span>
                </div>
              )) : <Text tone="muted" className="mt-2">No guardrail hits in this period.</Text>}
            </Card>
          </div>

          <section>
            <Text variant="label" tone="subtle" className="mb-2">By agent</Text>
            <DataTable rows={d.agents} rowKey={a => a.agent} onRowClick={a => (setAgent(a.agent), setPage(1))} empty="No AI activity in this period." columns={[
              { key: 'a', label: 'Agent', render: a => <><div className="font-semibold">{a.label}</div><div className="text-xs text-ink-subtle">{a.engine === 'adk' ? 'ADK workflow' : a.engine === 'gateway' ? 'Gateway' : a.engine}</div></> },
              { key: 'r', label: 'Runs', render: a => num(a.runs) },
              { key: 's', label: 'Success', render: a => <Badge label={a.success_rate == null ? '—' : `${a.success_rate}%`} tone={(a.success_rate ?? 100) >= 97 ? 'success' : (a.success_rate ?? 0) >= 90 ? 'warning' : 'danger'} /> },
              { key: 'l', label: 'Latency avg / p95', render: a => `${secs(a.avg_latency_ms)} / ${secs(a.p95_latency_ms)}` },
              { key: 't', label: 'Tokens / run', render: a => num(a.avg_tokens) },
              { key: 'q', label: 'Repaired / revised', render: a => `${a.repairs} / ${a.revised}` },
              { key: 'f', label: 'Rating', render: a => (a.satisfaction == null ? '—' : `${a.satisfaction}% (${a.helpful + a.not_helpful})`) },
            ]} />
          </section>
        </div>
      )}

      <section className="mt-8">
        <Text variant="title" className="mb-3">Runs</Text>
        <Toolbar>
          <Select label="Agent" value={agent} onChange={v => (setAgent(v), setPage(1))} options={[{ value: '', label: 'All agents' }, ...(d?.agents ?? []).map(a => ({ value: a.agent, label: a.label }))]} />
          <Select label="Status" value={status} onChange={v => (setStatus(v), setPage(1))} options={[{ value: '', label: 'Any status' }, { value: 'ok', label: 'OK' }, { value: 'error', label: 'Error' }, { value: 'fallback', label: 'Fallback' }, { value: 'blocked', label: 'Blocked' }]} />
          <Select label="Filter" value={feedback} onChange={v => (setFeedback(v), setPage(1))} options={[{ value: '', label: 'All runs' }, { value: 'negative', label: 'Rated not helpful' }, { value: 'positive', label: 'Rated helpful' }, { value: 'flagged', label: 'Guardrail hit' }]} />
        </Toolbar>
        {runs.isLoading ? <Skeleton className="h-64" rounded="xl" /> : runs.isError || !runs.data ? <ErrorState onRetry={() => runs.refetch()} /> : (
          <>
            <DataTable rows={runs.data.items} rowKey={r => r.id} onRowClick={r => setOpen(r.id)} empty="No runs match." columns={[
              { key: 'w', label: 'When', render: r => when(r.created_at) },
              { key: 'a', label: 'Agent', render: r => r.label },
              { key: 's', label: 'Status', render: r => <Badge label={r.status} tone={STATUS_TONE[r.status] ?? 'neutral'} /> },
              { key: 'i', label: 'Request', render: r => <span className="line-clamp-2 max-w-[28ch]">{r.input_preview || '—'}</span> },
              { key: 'm', label: 'Steps', render: r => `${r.llm_calls} model · ${r.tool_calls} tool${r.repairs ? ` · ${r.repairs} repair` : ''}` },
              { key: 'l', label: 'Latency', render: r => secs(r.latency_ms) },
              { key: 'f', label: '', render: r => (r.feedback === 1 ? <ThumbsUp size={16} className="text-success" aria-label="Helpful" /> : r.feedback === -1 ? <ThumbsDown size={16} className="text-danger" aria-label="Not helpful" /> : r.guardrails.length ? <Badge label={`${r.guardrails.length} flag${r.guardrails.length > 1 ? 's' : ''}`} tone="warning" className="whitespace-nowrap" /> : null) },
            ]} />
            <Pager page={page} pageSize={30} total={runs.data.total} onPage={setPage} />
          </>
        )}
      </section>
      <RunSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}

function RunSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useQuery({ queryKey: ['admin', 'ai', 'run', id], queryFn: () => adminGet<RunDetail>(`/ai/runs/${id}`), enabled: !!id });
  const r = q.data;
  return (
    <Sheet open={!!id} onClose={onClose} eyebrow={r ? `${r.label} · ${r.engine}` : 'AI run'} title={r ? when(r.created_at) : 'Loading…'} size="lg">
      {!r ? <Skeleton className="h-60" rounded="xl" /> : (
        <div className="flex flex-col gap-5">
          <div>
            <Field label="Status"><Badge label={r.status} tone={STATUS_TONE[r.status] ?? 'neutral'} /></Field>
            <Field label="Model">{r.model}</Field>
            <Field label="Latency">{secs(r.latency_ms)}</Field>
            <Field label="Tokens">{num(r.prompt_tokens)} in · {num(r.output_tokens)} out</Field>
            <Field label="Steps">{r.llm_calls} model calls · {r.tool_calls} tool calls · {r.repairs} repairs</Field>
            {r.user_id ? <Field label="Member"><Link className="text-accent-text underline" to={`/admin/users?open=${r.user_id}`}>{r.user_id.slice(0, 8)}…</Link></Field> : null}
            {r.feedback ? <Field label="Member rating">{r.feedback === 1 ? 'Helpful' : 'Not helpful'}{r.feedback_note ? ` — “${r.feedback_note}”` : ''}</Field> : null}
            {r.error ? <Field label="Error"><span className="text-danger">{r.error}</span></Field> : null}
          </div>
          <section>
            <Text variant="label" tone="subtle" className="mb-1">Request (personal data masked)</Text>
            <Text className="whitespace-pre-line">{r.input_preview || '—'}</Text>
          </section>
          <section>
            <Text variant="label" tone="subtle" className="mb-1">Answer</Text>
            <Text className="whitespace-pre-line">{r.output_preview || '—'}</Text>
          </section>
          {r.review ? (
            <section>
              <Text variant="label" tone="subtle" className="mb-1">Review</Text>
              <pre className="overflow-auto rounded-gm-md bg-surface-sunken p-3 text-xs">{JSON.stringify(r.review, null, 2)}</pre>
            </section>
          ) : null}
          {r.guardrails.length ? (
            <section className="flex flex-wrap gap-1">{r.guardrails.map((g, i) => <Badge key={i} label={`${GUARD_LABEL[g.name] ?? g.name}: ${g.action}`} tone="warning" />)}</section>
          ) : null}
          <section>
            <Text variant="label" tone="subtle" className="mb-2">Trace</Text>
            <ol className="flex flex-col gap-1">
              {r.trace.map((s, i) => {
                const { t, kind, name, ...rest } = s;
                return (
                  <li key={i} className="flex gap-3 rounded-gm-md bg-surface-sunken px-3 py-2 text-xs">
                    <span className="w-14 shrink-0 font-mono text-ink-subtle">{t} ms</span>
                    <span className={kind === 'error' ? 'w-20 shrink-0 font-semibold text-danger' : kind === 'guardrail' ? 'w-20 shrink-0 font-semibold text-warning' : 'w-20 shrink-0 font-semibold'}>{kind}</span>
                    <span className="min-w-0 break-words"><span className="font-semibold">{name}</span>{Object.keys(rest).length ? <span className="text-ink-muted"> · {Object.entries(rest).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}</span> : null}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </Sheet>
  );
}
