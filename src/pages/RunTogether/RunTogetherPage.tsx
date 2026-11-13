import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search, Users } from 'lucide-react';
import { Button, Card, ListGroup, ListItem, PageHeader, SectionHeader, SignatureCard, Skeleton, Text, TextField } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import type { RunRoom } from '../../api/runRooms';
import { isValidRoomCode, normalizeRoomCode, presentMembers, roomKind } from '../../lib/runRoom/roomLogic';
import { formatKm } from '../../lib/runRoom/format';
import { useMyRooms } from '../../hooks/useRunTogether';
import { AvatarStack, ClubCard, RoomStatusPill } from './components/RoomBits';
import { roomPath } from './components/roomView';

/** Run together: the club, create a room, join with a code, invites and your rooms. */
export default function RunTogetherPage() {
  const navigate = useNavigate();
  const mine = useMyRooms();
  const [code, setCode] = useState('');

  const join = (e: FormEvent) => {
    e.preventDefault();
    if (isValidRoomCode(code)) navigate(`/app/run-room/${code}`);
  };

  // Live rooms first (happening now or about to), then open rooms, soonest to close first.
  const active = [
    ...(mine.data?.active ?? []),
    ...(mine.data?.open ?? []).slice().sort((a, b) => (a.ends_at ?? '').localeCompare(b.ends_at ?? '')),
  ];
  const invites = mine.data?.invites ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <PageHeader eyebrow="Running" title="Run together" subtitle="Run with friends or the whole Gymmigo Run Club, everyone on one live map." />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <ClubCard onOpen={r => navigate(roomPath(r))} />
          <SignatureCard glow="none">
            <span className="grid size-11 place-items-center rounded-gm-md bg-accent-soft text-accent-text">
              <Users size={22} />
            </span>
            <Text variant="h2" className="mt-3">Run with friends</Text>
            <Text variant="footnote" tone="muted" className="mt-1">
              A live run you start together, or an open room people join and run in whenever they like until it closes. Everyone shows up on one map.
            </Text>
            <Button className="mt-4" icon={Plus} label="Create a room" to="/app/run-together/new" fullWidth />
          </SignatureCard>
        </div>
        <div className="flex flex-col gap-6">
          <Card padding="lg">
            <form onSubmit={join} className="flex flex-col gap-3">
              <Text variant="label" tone="muted">Have a code?</Text>
              <div className="flex items-end gap-2">
                <TextField
                  className="flex-1"
                  value={code}
                  onChange={e => setCode(normalizeRoomCode(e.target.value))}
                  placeholder="e.g. KP4R7X"
                  aria-label="Room code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={6}
                />
                <Button type="submit" label="Join" disabled={!isValidRoomCode(code)} />
              </div>
            </form>
          </Card>

          {mine.isLoading ? (
            <Skeleton className="h-28" rounded="xl" />
          ) : (
            <>
              {invites.length ? (
                <section>
                  <SectionHeader label="Invites" meta={String(invites.length)} />
                  <div className="flex flex-col gap-2">
                    {invites.map(r => (
                      <RoomCard key={r.id} room={r} cta="Open" onClick={() => navigate(roomPath(r))} />
                    ))}
                  </div>
                </section>
              ) : null}
              {active.length ? (
                <section>
                  <SectionHeader label="Your rooms" />
                  <div className="flex flex-col gap-2">
                    {active.map(r => (
                      <RoomCard key={r.id} room={r} cta={roomKind(r) === 'open' ? 'Open map' : r.status === 'live' ? 'Watch' : 'Open'} onClick={() => navigate(roomPath(r))} />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}

          <ListGroup label="People">
            <ListItem icon={Search} title="Find people" subtitle="Search members and follow them" to="/app/people" chevron />
            <ListItem icon={Users} title="Followers & following" to="/app/people/following" chevron />
          </ListGroup>
        </div>
      </div>
    </div>
  );
}

export function RoomCard({ room, cta, onClick }: { room: RunRoom; cta: string; onClick: () => void }) {
  const { user } = useAuth();
  const people = presentMembers(room);
  const runners = people.filter(m => m.role === 'runner').length;
  const watching = people.length - runners;
  const host = room.members.find(m => m.is_host);
  return (
    <Card onClick={onClick} aria-label={`${room.title}, ${room.status}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Text variant="title" truncate>{room.title}</Text>
          <Text variant="footnote" tone="muted" truncate>
            {host ? (host.user_id === user?.id ? 'You’re hosting' : `Hosted by ${host.name}`) : `Code ${room.code}`}
          </Text>
        </div>
        <RoomStatusPill room={room} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <AvatarStack people={people} size={30} />
        <Text variant="caption" tone="muted" className="flex-1" truncate>
          {roomKind(room) === 'open' && room.today
            ? `${room.today.runners} ${room.today.runners === 1 ? 'runner' : 'runners'} · ${formatKm(room.today.distance_meters, 1)} km so far`
            : `${runners} ${runners === 1 ? 'runner' : 'runners'}${watching ? ` · ${watching} watching` : ''}`}
        </Text>
        <span className="flex items-center gap-1 t-label-sm text-accent-text">
          {cta}
          <ChevronRight size={14} />
        </span>
      </div>
    </Card>
  );
}
