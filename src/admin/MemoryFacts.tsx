import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Text, TextField } from '../components/kit';
import { adminDelete, adminError, adminGet, adminPatch, adminPost } from './api';
import { when } from './format';
import { Select } from './ui';
import { useAdmin } from './useAdmin';

type Fact = { id: string; category: string; fact: string; confidence: number; source: string; first_seen_at: string | null; last_confirmed_at: string | null; expires_at: string | null; active: boolean };
type Memory = { facts: Fact[]; categories: string[]; conversation: { summary: string | null; summarized_messages: number; updated_at: string | null } | null };

const TONE: Record<string, 'danger' | 'warning' | 'accent' | 'neutral'> = { injury: 'danger', health: 'warning', diet: 'warning', dislike: 'neutral', goal: 'accent', milestone: 'accent' };

/** Migo 2 long-term memory for one member: facts the curator learned (editable) and the rolling chat summary. */
export function MemoryFacts({ uid }: { uid: string }) {
  const { can } = useAdmin();
  const qc = useQueryClient();
  const key = ['admin', 'ai-memory', uid];
  const q = useQuery({ queryKey: key, queryFn: () => adminGet<Memory>(`/ai/members/${uid}/memory`) });
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState({ category: 'preference', fact: '' });
  const [busy, setBusy] = useState('');
  const manage = can('ai.manage');

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: key });
      setEditing(null);
    } catch (e) {
      alert(adminError(e).message);
    } finally {
      setBusy('');
    }
  };

  const m = q.data;
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Text variant="subtitle">Long-term memory ({m?.facts.length ?? 0} facts)</Text>
        <Text variant="caption" tone="subtle">Learned from chats; used in every answer</Text>
      </div>
      {q.isLoading ? <Text tone="muted">Loading…</Text> : !m ? <Text tone="muted">Couldn’t load memory.</Text> : (
        <div className="flex flex-col gap-2">
          {m.facts.length === 0 ? <Text tone="muted">Nothing learned yet.</Text> : null}
          {m.facts.map(f => (
            <div key={f.id} className="flex flex-wrap items-start gap-2 border-b border-border pb-2 last:border-0">
              <Badge label={f.category} tone={TONE[f.category] ?? 'neutral'} />
              <div className="min-w-0 flex-1">
                {editing === f.id ? (
                  <TextField label="Fact" value={text} onChange={e => setText(e.target.value)} />
                ) : (
                  <Text className="break-words">{f.fact}</Text>
                )}
                <Text variant="caption" tone="subtle">
                  {f.source === 'admin' ? 'Added by admin' : `Confidence ${Math.round(f.confidence * 100)}%`} · confirmed {when(f.last_confirmed_at)}
                  {f.expires_at ? ` · expires ${when(f.expires_at)}` : ''}
                </Text>
              </div>
              {manage ? (
                <div className="flex gap-1">
                  {editing === f.id ? (
                    <>
                      <Button size="sm" label="Save" loading={busy === f.id} onClick={() => act(f.id, () => adminPatch(`/ai/memory/${f.id}`, { fact: text }))} />
                      <Button size="sm" variant="ghost" label="Cancel" onClick={() => setEditing(null)} />
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" label="Edit" onClick={() => (setEditing(f.id), setText(f.fact))} />
                      <Button size="sm" variant="ghost" label="Forget" loading={busy === f.id} onClick={() => confirm('Forget this fact?') && act(f.id, () => adminDelete(`/ai/memory/${f.id}`))} />
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ))}
          {manage ? (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <Select label="Category" value={adding.category} onChange={v => setAdding(a => ({ ...a, category: v }))} options={m.categories.map(c => ({ value: c, label: c }))} />
              <div className="min-w-[12rem] flex-1"><TextField label="New fact" value={adding.fact} onChange={e => setAdding(a => ({ ...a, fact: e.target.value }))} placeholder="e.g. Trains at 6 am on weekdays" /></div>
              <Button size="md" variant="secondary" label="Add" disabled={adding.fact.trim().length < 2} loading={busy === 'new'}
                onClick={() => act('new', async () => { await adminPost(`/ai/members/${uid}/memory`, adding); setAdding(a => ({ ...a, fact: '' })); })} />
            </div>
          ) : null}
          <div className="mt-2 rounded-gm-md bg-surface-sunken p-3">
            <Text variant="label" tone="subtle">Current chat summary</Text>
            <Text variant="footnote" className="whitespace-pre-line">
              {m.conversation?.summary || 'No long conversation to summarise yet.'}
            </Text>
            {m.conversation?.summarized_messages ? <Text variant="caption" tone="subtle">{m.conversation.summarized_messages} older messages folded in · {when(m.conversation.updated_at)}</Text> : null}
          </div>
        </div>
      )}
    </Card>
  );
}
