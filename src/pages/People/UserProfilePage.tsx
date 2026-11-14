import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Send, UserX } from 'lucide-react';
import { Avatar, Button, Card, EmptyState, Skeleton, Text, useToast } from '../../components/kit';
import { TitleBar } from '../RunTogether/components/RoomBits';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/api';
import { roomKind } from '../../lib/runRoom/roomLogic';
import { formatKm } from '../../lib/runRoom/format';
import { useInvite, useMyRooms, useUserProfile } from '../../hooks/useRunTogether';
import { FollowButton } from './PeopleBits';

/** A member's public card: counts, run stats, follow, invite to my room. */
export default function UserProfilePage() {
  const { userId = '' } = useParams();
  const { user: me } = useAuth();
  const toast = useToast();
  const profile = useUserProfile(userId);
  const mine = useMyRooms();
  const invite = useInvite();
  const [invited, setInvited] = useState(false);
  const p = profile.data;
  // Invite target: my most relevant room I can invite to (live rooms, then open rooms; never the club).
  const room = [...(mine.data?.active ?? []), ...(mine.data?.open ?? [])].find(r => roomKind(r) !== 'club' && r.status !== 'finished');

  if (profile.isLoading) return <Skeleton className="mx-auto h-80 w-full max-w-2xl" rounded="xl" />;
  if (!p) return <div className="mx-auto max-w-md py-16"><EmptyState icon={UserX} title="Member not found" actionLabel="Find people" actionTo="/app/people" /></div>;
  const isMe = p.user_id === me?.id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-10">
      <TitleBar eyebrow="Community" backTo="/app/people" />
      <Card padding="xl" className="flex flex-col items-center gap-3 text-center">
        <Avatar name={p.name} src={p.avatar_url} size={88} />
        <div>
          <Text variant="h1">{p.name}</Text>
          <Text variant="footnote" tone="muted" className="flex items-center justify-center gap-1">
            {p.username ? `@${p.username}` : null}
            {p.city ? (
              <>
                {p.username ? ' · ' : null}
                <MapPin size={13} /> {p.city}
              </>
            ) : null}
          </Text>
          {p.follows_you && !isMe ? <Text variant="caption" tone="accent" className="mt-1">Follows you</Text> : null}
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          <Count to={`/app/people/followers?user=${p.user_id}`} value={p.followers_count} label="Followers" />
          <Count to={`/app/people/following?user=${p.user_id}`} value={p.following_count} label="Following" />
          <Count value={p.runs_count} label="Runs" />
          <Count value={formatKm(p.total_distance_meters, 1)} label="km run" />
        </div>
        {!isMe ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <div className="sm:flex-1 [&>button]:w-full"><FollowButton user={p} size="md" /></div>
            {room ? (
              <Button
                className="flex-1"
                variant="secondary"
                icon={Send}
                label={invited ? 'Invited' : `Invite to ${room.title}`}
                disabled={invited}
                loading={invite.isPending}
                onClick={async () => {
                  try {
                    await invite.mutateAsync({ roomId: room.id, userIds: [p.user_id] });
                    setInvited(true);
                    toast({ tone: 'success', title: `${p.name} invited` });
                  } catch (err) {
                    toast({ tone: 'danger', title: getApiErrorMessage(err) });
                  }
                }}
              />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Count({ value, label, to }: { value: number | string; label: string; to?: string }) {
  const body = (
    <div className="rounded-gm-lg bg-surface-sunken px-3 py-3">
      <div className="t-title text-ink">{value}</div>
      <div className="t-caption text-ink-muted">{label}</div>
    </div>
  );
  return to ? <Link to={to} className="block transition hover:opacity-80">{body}</Link> : body;
}
