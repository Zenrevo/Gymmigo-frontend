import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Card, EmptyState, ListGroup, ListItem, Skeleton, Text, TextField } from '../../components/kit';
import { TitleBar } from '../RunTogether/components/RoomBits';
import { useAuth } from '../../context/AuthContext';
import { useDebounced } from '../../hooks/useDebounced';
import { useFollowList, useUserSearch } from '../../hooks/useRunTogether';
import { PersonRow } from './PeopleBits';

/** Search members by name, username or exact phone number, and follow them. */
export default function FindPeoplePage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const query = useDebounced(q.trim(), 300);
  const search = useUserSearch(query);
  const friends = useFollowList('friends');
  const results = search.data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-10">
      <TitleBar eyebrow="Community" title="Find people" backTo="/app/run-together" />
      <TextField autoFocus placeholder="Search by name, username or phone number" value={q} onChange={e => setQ(e.target.value)} prefix={<Search size={18} />} aria-label="Search people" />
      {query.length >= 2 ? (
        search.isLoading ? (
          <Skeleton className="h-48" rounded="xl" />
        ) : results.length ? (
          <Card padding="none" className="divide-y divide-border overflow-hidden">
            {results.map(u => (
              <PersonRow key={u.user_id} user={u} me={user?.id} />
            ))}
          </Card>
        ) : (
          <EmptyState icon={Search} title="No one found" message="Try another name. Phone numbers must match exactly." compact />
        )
      ) : (
        <>
          <Text variant="footnote" tone="muted">Phone numbers are never shown. Follow people to invite them to runs and see them in Friends.</Text>
          <ListGroup label="Your people">
            <ListItem icon={Users} title="Friends" subtitle="People who follow you back" to="/app/people/friends" chevron value={friends.data ? String(friends.data.total) : undefined} />
            <ListItem icon={Users} title="Following" to="/app/people/following" chevron />
            <ListItem icon={Users} title="Followers" to="/app/people/followers" chevron />
          </ListGroup>
        </>
      )}
    </div>
  );
}
