import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2, ClipboardCheck, Footprints, Radio, type LucideIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { runRoomsApi } from '../api/runRooms';
import { usePrograms } from '../hooks/usePrograms';

export type Update = { key: string; icon: LucideIcon; title: string; body: string; to: string; tone: 'accent' | 'info' | 'success' };

const SEEN_KEY = 'gymmigo_updates_seen';
const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * What needs the member's attention right now, built from real data (the API has no notification inbox):
 * run-room invites, rooms that are live, today's program day to log and plans waiting for approval.
 */
export function useUpdates(enabled: boolean) {
  const rooms = useQuery({ queryKey: ['run-rooms', 'mine'], queryFn: runRoomsApi.mine, enabled, staleTime: 60_000, retry: false });
  const { lists } = usePrograms();
  const [seen, setSeen] = useState<string[]>(readSeen);

  const items: Update[] = [];
  if (enabled) {
    for (const r of rooms.data?.invites ?? [])
      items.push({ key: `invite-${r.id}`, icon: Footprints, title: `Invite: ${r.title || 'Group run'}`, body: 'You were invited to run together. Join as a runner in the app or watch here.', to: `/app/run-room/${r.code}`, tone: 'accent' });
    for (const r of (rooms.data?.active ?? []).filter(r => r.status === 'live' && !r.is_official))
      items.push({ key: `live-${r.id}`, icon: Radio, title: `${r.title || 'Your room'} is live`, body: 'Follow the runners on the map and send a cheer.', to: `/app/run-room/${r.code}`, tone: 'success' });
    for (const p of lists.active) {
      const t = p.today;
      if (t && !t.log && !t.removed && t.type !== 'rest')
        items.push({ key: `log-${p.id}-${t.day}`, icon: CalendarCheck2, title: `Day ${t.day}: ${t.title}`, body: `${p.title}. Log it when you're done.`, to: `/app/plans/${p.id}/days/${t.day}/log`, tone: 'accent' });
    }
    for (const p of lists.drafts)
      items.push({ key: `draft-${p.id}`, icon: ClipboardCheck, title: `${p.title} is ready to review`, body: 'Approve it to add the days to your calendar, or ask Migo to change it.', to: `/app/plans/${p.id}/review`, tone: 'info' });
  }

  const unseen = items.filter(i => !seen.includes(i.key)).length;
  const markSeen = useCallback(() => {
    const keys = items.map(i => i.key);
    setSeen(keys);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(keys));
    } catch {
      // private mode
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(i => i.key).join('|')]);

  return { items, unseen, loading: rooms.isLoading, markSeen };
}
