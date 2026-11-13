import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Avatar, Button, cn, SegmentedControl, Sheet, Skeleton, Text, TextField, useToast } from '../../../components/kit';
import { getApiErrorMessage } from '../../../utils/api';
import type { RunRoom } from '../../../api/runRooms';
import type { UserCard } from '../../../api/social';
import { useDebounced } from '../../../hooks/useDebounced';
import { useFollowList, useInvite, useUserSearch } from '../../../hooks/useRunTogether';

/** Invite friends, people you follow, or anyone you search for (multi-select). */
export function InviteSheet({ open, onClose, room }: { open: boolean; onClose: () => void; room: RunRoom }) {
  const toast = useToast();
  const [tab, setTab] = useState<'friends' | 'following' | 'search'>('friends');
  const [q, setQ] = useState('');
  const query = useDebounced(q.trim(), 300);
  const [picked, setPicked] = useState<Record<string, UserCard>>({});
  const friends = useFollowList('friends');
  const following = useFollowList('following');
  const search = useUserSearch(tab === 'search' ? query : '');
  const invite = useInvite();

  const inRoom = useMemo(() => new Set([...room.members.filter(m => m.state !== 'left').map(m => m.user_id), ...room.invited.map(u => u.user_id)]), [room]);
  const list = tab === 'friends' ? friends : tab === 'following' ? following : search;
  const people = (list.data?.items ?? []).filter(u => !inRoom.has(u.user_id));
  const count = Object.keys(picked).length;

  const send = async () => {
    try {
      await invite.mutateAsync({ roomId: room.id, userIds: Object.keys(picked) });
      toast({ tone: 'success', title: `Invited ${count} ${count === 1 ? 'person' : 'people'}` });
      setPicked({});
      onClose();
    } catch (err) {
      toast({ tone: 'danger', title: getApiErrorMessage(err) });
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={room.title}
      title="Invite people"
      size="md"
      footer={<Button label={count ? `Send ${count} ${count === 1 ? 'invite' : 'invites'}` : 'Pick people to invite'} disabled={!count} loading={invite.isPending} onClick={send} fullWidth />}
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'friends', label: 'Friends' },
            { value: 'following', label: 'Following' },
            { value: 'search', label: 'Search' },
          ]}
        />
        {tab === 'search' ? (
          <TextField autoFocus placeholder="Search by name or username" value={q} onChange={e => setQ(e.target.value)} aria-label="Search people" prefix={<Search size={16} />} />
        ) : null}
        {list.isLoading && (tab !== 'search' || query.length >= 2) ? (
          <Skeleton className="h-40" rounded="xl" />
        ) : !people.length ? (
          <Text variant="footnote" tone="muted" className="py-6 text-center">
            {tab === 'search' ? (query.length < 2 ? 'Type at least 2 letters.' : 'No one found.') : tab === 'friends' ? 'Friends are people who follow you back.' : 'You’re not following anyone yet.'}
          </Text>
        ) : (
          <ul className="flex flex-col gap-1">
            {people.map(u => {
              const on = !!picked[u.user_id];
              return (
                <li key={u.user_id}>
                  <button
                    type="button"
                    onClick={() => setPicked(p => (on ? Object.fromEntries(Object.entries(p).filter(([k]) => k !== u.user_id)) : { ...p, [u.user_id]: u }))}
                    className={cn('flex w-full items-center gap-3 rounded-gm-md px-2 py-2 text-left transition', on ? 'bg-accent-soft' : 'hover:bg-surface-sunken')}
                    aria-pressed={on}
                  >
                    <Avatar name={u.name} src={u.avatar_url} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate t-subtitle text-ink">{u.name}</span>
                      <span className="block truncate t-caption text-ink-muted">{[u.username ? `@${u.username}` : null, u.city].filter(Boolean).join(' · ') || ' '}</span>
                    </span>
                    <span className={cn('grid size-6 place-items-center rounded-full border', on ? 'border-accent bg-accent text-on-accent' : 'border-border-strong')}>
                      {on ? <Check size={14} /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
