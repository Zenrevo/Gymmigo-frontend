import { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import { Button, Card, Chip, EmptyState, ErrorState, IconButton, PageHeader, Skeleton, Text, Toggle, useToast } from '../../components/kit';
import { inbox, timeAgo, webRouteFor, type InboxItem, type NotificationPrefs } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/api';

const FILTERS = [['all', 'All'], ['payments', 'Payments'], ['bookings', 'Bookings'], ['reminders', 'Reminders'], ['clubs', 'Clubs'], ['gym', 'Gym']] as const;

/** Inbox: everything we've told you, plus which categories reach your phone. */
export default function NotificationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const q = useInfiniteQuery({
    queryKey: ['notifications', 'page', filter],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => inbox.list({ before: pageParam, category: filter === 'all' ? undefined : filter, limit: 30 }),
    getNextPageParam: last => (last.has_more ? last.next_before ?? undefined : undefined),
  });
  const prefs = useQuery({ queryKey: ['notifications', 'prefs'], queryFn: inbox.prefs });
  const items = (q.data?.pages ?? []).flatMap(p => p.items);
  const unread = q.data?.pages[0]?.unread ?? 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const open = (n: InboxItem) => {
    if (!n.read) inbox.read([n.id]).then(refresh).catch(() => undefined);
    const to = webRouteFor(n, user?.active_role);
    if (to?.startsWith('http')) window.open(to, '_blank', 'noopener');
    else if (to) navigate(to);
  };
  const setPref = async (key: string, on: boolean) => {
    const prev = prefs.data;
    qc.setQueryData<NotificationPrefs>(['notifications', 'prefs'], p => (p ? { categories: p.categories.map(c => (c.key === key ? { ...c, enabled: on } : c)) } : p));
    try {
      qc.setQueryData(['notifications', 'prefs'], await inbox.savePrefs({ [key]: on }));
    } catch (e) {
      qc.setQueryData(['notifications', 'prefs'], prev);
      toast({ tone: 'danger', title: 'Could not save', message: getApiErrorMessage(e) });
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <PageHeader title="Notifications" subtitle="Payments, bookings, reminders and gym news."
          actions={unread ? <Button size="sm" variant="secondary" onClick={() => inbox.readAll().then(refresh)}>Mark all {unread} read</Button> : undefined} />
        <div className="flex flex-wrap gap-2">{FILTERS.map(([v, l]) => <Chip key={v} label={l} selected={filter === v} onClick={() => setFilter(v)} />)}</div>
        {q.isLoading ? <Skeleton className="h-64" /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : !items.length ? (
          <EmptyState icon={Bell} title="You're all caught up" message="Payments, bookings, reminders and gym news show up here." />
        ) : (
          <Card padding="none" className="divide-y divide-line">
            {items.map(n => (
              <div key={n.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-cta'}`} aria-hidden />
                <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                  <Text variant={n.read ? 'body' : 'bodyStrong'}>{n.title}</Text>
                  {n.body ? <Text variant="footnote" tone="muted">{n.body}</Text> : null}
                  <Text variant="caption" tone="subtle">{timeAgo(n.created_at)}</Text>
                </button>
                <IconButton icon={Trash2} label="Delete notification" onClick={() => inbox.remove(n.id).then(refresh)} />
              </div>
            ))}
          </Card>
        )}
        {q.hasNextPage ? <Button variant="secondary" loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load older</Button> : null}
      </div>
      <Card padding="lg" className="h-fit space-y-4">
        <div><Text variant="title">What reaches your phone</Text><Text variant="caption" tone="subtle">Everything is still kept here.</Text></div>
        {prefs.data?.categories.map(c => (
          <div key={c.key} className="flex items-center justify-between gap-3">
            <Text variant="body">{c.label}{c.locked ? <Text as="span" variant="caption" tone="subtle"> · always on</Text> : null}</Text>
            <Toggle checked={c.enabled} disabled={c.locked} onChange={v => setPref(c.key, v)} label={c.label} />
          </div>
        )) ?? <Skeleton className="h-48" />}
      </Card>
    </div>
  );
}
