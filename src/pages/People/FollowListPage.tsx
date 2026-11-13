import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, EmptyState, SegmentedControl, Skeleton } from '../../components/kit';
import { TitleBar } from '../RunTogether/components/RoomBits';
import { useAuth } from '../../context/AuthContext';
import { useFollowList } from '../../hooks/useRunTogether';
import { PersonRow } from './PeopleBits';

type Tab = 'friends' | 'following' | 'followers';
const TABS: Tab[] = ['friends', 'following', 'followers'];

/** Friends / Following / Followers (yours, or another member's with ?user=). */
export default function FollowListPage() {
  const { tab: raw } = useParams();
  const [params] = useSearchParams();
  const other = params.get('user') ?? undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : 'friends';
  const shownTab: Tab = other && tab === 'friends' ? 'followers' : tab;
  const list = useFollowList(shownTab, other);
  const items = list.data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-10">
      <TitleBar eyebrow="Community" title={other ? 'Connections' : 'Your people'} backTo={other ? `/app/u/${other}` : '/app/people'} />
      <SegmentedControl
        value={shownTab}
        onChange={t => navigate(`/app/people/${t}${other ? `?user=${other}` : ''}`, { replace: true })}
        options={(other ? (['followers', 'following'] as Tab[]) : TABS).map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
      />
      {list.isLoading ? (
        <Skeleton className="h-48" rounded="xl" />
      ) : items.length ? (
        <Card padding="none" className="divide-y divide-border overflow-hidden">
          {items.map(u => (
            <PersonRow key={u.user_id} user={u} me={user?.id} />
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title={shownTab === 'friends' ? 'No friends yet' : shownTab === 'following' ? 'Not following anyone' : 'No followers yet'}
          message={shownTab === 'friends' ? 'Friends are people you follow who follow you back.' : 'Find people to follow and run with.'}
          actionLabel="Find people"
          actionTo="/app/people"
          compact
        />
      )}
    </div>
  );
}
