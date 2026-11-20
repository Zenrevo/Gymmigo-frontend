import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Text } from '../components/kit';
import { adminGet, type Paged } from './api';
import { when } from './format';
import { useAdmin } from './useAdmin';

type Entry = { id: number; created_at: string; actor: string | null; action: string; summary: string | null };

/** "Who changed this, when": the latest audit entries for one member or gym. */
export function RecentChanges({ targetId }: { targetId: string }) {
  const { can } = useAdmin();
  const q = useQuery({
    queryKey: ['admin', 'audit', 'target', targetId],
    queryFn: () => adminGet<Paged<Entry>>('/audit', { target_id: targetId, page_size: 8 }),
    enabled: can('audit.view'),
  });
  if (!can('audit.view')) return null;
  const items = (q.data?.items ?? []).filter(e => !e.action.startsWith('data.view'));
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <Text variant="subtitle">Admin changes</Text>
        <Link className="text-xs text-accent-text underline" to="/admin/audit">Audit log</Link>
      </div>
      {items.length ? items.map(e => (
        <div key={e.id} className="flex justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
          <span className="min-w-0">{e.summary || e.action}</span>
          <span className="shrink-0 text-xs text-ink-subtle">{e.actor ?? 'system'} · {when(e.created_at)}</span>
        </div>
      )) : <Text tone="muted">No admin changes yet.</Text>}
    </Card>
  );
}
