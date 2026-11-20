import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { Badge, Button, Card, ErrorState, Skeleton, Text, TextArea, TextField, Toggle } from '../../components/kit';
import { adminGet, adminPatch, adminPost } from '../api';
import { useAdmin } from '../useAdmin';
import { when } from '../format';
import { PageTitle, PromptDialog } from '../ui';
import { useAdminAction } from '../useAdminAction';

type Setting = {
  key: string; value: unknown; value_type: 'bool' | 'string' | 'number' | 'text'; category: string; label: string; description: string | null;
  is_public: boolean; is_immutable: boolean; locked_at: string | null; locked_by: string | null; updated_by: string | null; updated_at: string | null;
};

const CATEGORY_LABEL: Record<string, string> = { ai: 'AI agents & governance', monitor: 'Live monitor alerts', features: 'Features', platform: 'Platform', payments: 'Payments', app: 'App versions', general: 'General' };

export default function SettingsPage() {
  const { can } = useAdmin();
  const { busy, run } = useAdminAction();
  const [locking, setLocking] = useState<Setting | null>(null);
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => adminGet<Setting[]>('/settings') });
  const editable = can('settings.manage');
  const save = (s: Setting, value: unknown) => run(s.key, () => adminPatch(`/settings/${s.key}`, { value }), `${s.label} saved`, ['settings']);

  const cats = [...new Set((q.data ?? []).map(s => s.category))];
  const loaded = !!q.data;
  useEffect(() => {
    // /admin/settings#ai jumps to that section once the settings have loaded.
    const id = window.location.hash.slice(1);
    if (loaded && id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loaded]);

  return (
    <>
      <PageTitle title="Features & settings" subtitle="Turn features on or off for every app and website user. Changes apply within 15 seconds." />
      <Card variant="sunken" className="mb-5">
        <div className="flex gap-3">
          <Lock size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
          <Text variant="footnote" tone="muted">
            <strong className="text-ink">Locked</strong> settings are immutable: the database refuses any change, forever, even from the server.
            Lock only what must never change (for example currency or country).
          </Text>
        </div>
      </Card>
      {q.isLoading ? <Skeleton className="h-64" rounded="xl" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : (
        <div className="flex flex-col gap-6">
          {cats.map(cat => (
            <section key={cat} id={cat} className="scroll-mt-20">
              <Text variant="label" tone="subtle" className="mb-2">{CATEGORY_LABEL[cat] ?? cat}</Text>
              <Card padding="none">
                {q.data.filter(s => s.category === cat).map(s => (
                  <SettingRow key={s.key} s={s} editable={editable && !s.is_immutable} busy={busy === s.key} canLock={can('settings.lock')} onSave={v => save(s, v)} onLock={() => setLocking(s)} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
      <PromptDialog
        open={!!locking}
        tone="danger"
        title={`Lock “${locking?.label}” forever?`}
        message={<>It stays at <strong>{JSON.stringify(locking?.value)}</strong> and can never be changed or unlocked. Type <strong>{locking?.key}</strong> to confirm.</>}
        label="Setting key"
        placeholder={locking?.key}
        multiline={false}
        confirmLabel="Lock forever"
        onCancel={() => setLocking(null)}
        onConfirm={async confirm => {
          if (locking && (await run('lock', () => adminPost(`/settings/${locking.key}/lock`, { confirm }), 'Setting locked', ['settings']))) setLocking(null);
        }}
      />
    </>
  );
}

function SettingRow({ s, editable, busy, canLock, onSave, onLock }: { s: Setting; editable: boolean; busy: boolean; canLock: boolean; onSave: (v: unknown) => void; onLock: () => void }) {
  const [draft, setDraft] = useState<string>(s.value == null ? '' : String(s.value));
  const dirty = draft !== (s.value == null ? '' : String(s.value));
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Text variant="bodyStrong">{s.label}</Text>
          {s.is_immutable ? <Badge label="Locked" tone="neutral" /> : null}
          {s.is_public ? <Badge label="Sent to apps" tone="info" /> : null}
        </div>
        {s.description ? <Text variant="footnote" tone="muted">{s.description}</Text> : null}
        <Text variant="caption" tone="subtle" className="mt-1 font-mono">
          {s.key}
          {s.is_immutable ? ` · locked by ${s.locked_by} ${when(s.locked_at, false)}` : s.updated_by ? ` · changed by ${s.updated_by} ${when(s.updated_at)}` : ''}
        </Text>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-72 sm:items-end">
        {s.value_type === 'bool' ? (
          <Toggle label={s.label} checked={s.value === true} disabled={!editable || busy} onChange={v => onSave(v)} />
        ) : s.key.endsWith('.engine') ? (
          <select
            aria-label={s.label}
            value={String(s.value ?? 'adk')}
            disabled={!editable || busy}
            onChange={e => onSave(e.target.value)}
            className="h-10 rounded-gm-lg border border-border bg-surface px-3 text-sm text-ink"
          >
            {s.key === 'ai.migo.engine' ? <option value="multi">Multi-agent (specialists + MCP + memory)</option> : null}
            <option value="adk">ADK workflow (governed)</option>
            <option value="legacy">Previous pipeline</option>
          </select>
        ) : !editable ? (
          <Text className="break-words sm:text-right">{s.value == null ? <span className="text-ink-subtle">Server default</span> : String(s.value)}</Text>
        ) : (
          <>
            {s.value_type === 'text' ? (
              <TextArea aria-label={s.label} value={draft} onChange={e => setDraft(e.target.value)} rows={2} placeholder="Empty = default" />
            ) : (
              <TextField aria-label={s.label} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Empty = default" inputMode={s.value_type === 'number' ? 'decimal' : undefined} />
            )}
            {dirty ? (
              <Button size="sm" label="Save" loading={busy} onClick={() => onSave(draft.trim() === '' ? null : s.value_type === 'number' ? Number(draft) : draft)} />
            ) : null}
          </>
        )}
        {canLock && !s.is_immutable ? <Button size="sm" variant="ghost" icon={Lock} label="Lock" aria-label={`Lock ${s.label} forever`} onClick={onLock} /> : null}
      </div>
    </div>
  );
}
