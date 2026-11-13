import { useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus } from 'lucide-react';
import { Avatar, Button } from '../../components/kit';
import type { UserCard } from '../../api/social';
import { useFollow } from '../../hooks/useRunTogether';

export function FollowButton({ user, size = 'sm' }: { user: Pick<UserCard, 'user_id' | 'is_following' | 'follows_you'>; size?: 'sm' | 'md' }) {
  const follow = useFollow();
  const on = user.is_following;
  return (
    <Button
      size={size}
      variant={on ? 'secondary' : 'primary'}
      icon={on ? UserCheck : UserPlus}
      label={on ? 'Following' : user.follows_you ? 'Follow back' : 'Follow'}
      onClick={e => {
        e.stopPropagation();
        follow.mutate({ userId: user.user_id, follow: !on });
      }}
    />
  );
}

/** Settings-style row for a person: avatar, name, @username · city, follow button. */
export function PersonRow({ user, me }: { user: UserCard; me?: string }) {
  const navigate = useNavigate();
  const open = () => navigate(`/app/u/${user.user_id}`);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => e.key === 'Enter' && open()}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-surface-sunken"
    >
      <Avatar name={user.name} src={user.avatar_url} size={44} />
      <div className="min-w-0 flex-1">
        <div className="truncate t-subtitle text-ink">{user.name}</div>
        <div className="truncate t-caption text-ink-muted">
          {[user.username ? `@${user.username}` : null, user.city, user.follows_you ? 'Follows you' : null].filter(Boolean).join(' · ') || ' '}
        </div>
      </div>
      {user.user_id !== me ? <FollowButton user={user} /> : null}
    </div>
  );
}
