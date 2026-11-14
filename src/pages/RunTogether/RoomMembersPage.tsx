import { useParams, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, Skeleton, Text } from '../../components/kit';
import { TitleBar } from './components/RoomBits';
import { useAuth } from '../../context/AuthContext';
import { editionLabel, roomKind } from '../../lib/runRoom/roomLogic';
import { formatClock, formatDuration, formatKm } from '../../lib/runRoom/format';
import { useRoom, useRoomMembers } from '../../hooks/useRunTogether';

/** "Joined": everyone in the room with join time, last run, runs and distance (club: per day). */
export default function RoomMembersPage() {
  const { roomId = '' } = useParams();
  const [params] = useSearchParams();
  const date = params.get('date');
  const { user } = useAuth();
  const room = useRoom(roomId);
  const members = useRoomMembers(roomId, date);
  const club = roomKind(room.data) === 'club';
  const items = members.data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-10">
      <TitleBar eyebrow={room.data?.title ?? 'Run room'} title="Joined" backTo={`/app/run-room/${roomId}`} right={items.length ? <Badge label={String(members.data?.total ?? items.length)} /> : undefined} />
      <Text variant="footnote" tone="muted">
        {club ? `${editionLabel(date)} in the Gymmigo Run Club. Running now first, then by distance.` : 'Everyone in this room. Running now first, then by distance.'}
      </Text>
      {members.isLoading ? (
        <Skeleton className="h-64" rounded="xl" />
      ) : !items.length ? (
        <EmptyState icon={Users} title="Nobody yet" message="People show up here as soon as they join." />
      ) : (
        <Card padding="none" className="divide-y divide-border">
          {items.map(m => (
            <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} src={m.avatar_url} size={44} ring={m.color} status={m.running_now ? 'online' : 'none'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Text variant="subtitle" truncate>{m.user_id === user?.id ? 'You' : m.name}</Text>
                  {m.running_now ? <Badge label="Running" tone="success" dot /> : null}
                </div>
                <Text variant="caption" tone="muted">Joined {formatClock(m.joined_at)}{m.role === 'spectator' ? ' · watching' : ''}</Text>
                <Text variant="caption" tone="muted" truncate>
                  {m.last_run_at ? `Last run ${formatClock(m.last_run_at)} · ${m.sessions} ${m.sessions === 1 ? 'run' : 'runs'} · ${formatDuration(m.moving_seconds)}` : 'No runs yet'}
                </Text>
              </div>
              <div className="text-right">
                <span className="t-title text-ink">{formatKm(m.distance_meters)}</span>
                <span className="t-caption text-ink-muted"> km</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
