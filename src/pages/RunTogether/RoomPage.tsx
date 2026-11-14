import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, Eye, Flag, LogOut, Play, Share2, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  SegmentedControl,
  SectionHeader,
  Skeleton,
  Text,
  confirmDialog,
  useToast,
} from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/api';
import { apiErrorCode } from '../../api/envelope';
import type { CheerKind, RunRoom } from '../../api/runRooms';
import {
  CHEER_TEXT,
  editionLabel,
  effectiveSessions,
  memberTotals,
  presentMembers,
  rankRunners,
  roomKind,
  runningNow,
  safeRoomCode,
  stepEdition,
} from '../../lib/runRoom/roomLogic';
import { formatKm } from '../../lib/runRoom/format';
import { useRoomLive } from '../../hooks/useRoomLive';
import { useCheer, useFinishRoom, useJoinRoom, useLeaveRoom, useRemoveMember, useRoom, useStartRoom } from '../../hooks/useRunTogether';
import { AvatarStack, CheerBar, Leaderboard, RoomStatusPill, TrackInAppCard, TitleBar } from './components/RoomBits';
import { rowFromMember, rowFromSession, rowFromTotal } from './components/roomView';
import { RoomMap } from './components/RoomMap';
import { InviteSheet } from './components/InviteSheet';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `/app/run-room/:codeOrId`: join preview → lobby → live map, or the anytime map for open rooms and the club. */
export default function RoomPage() {
  const { codeOrId = '' } = useParams();
  const target = UUID.test(codeOrId) ? codeOrId : safeRoomCode(codeOrId);
  const room = useRoom(target || undefined);
  const { user } = useAuth();

  if (!target) return <NotFound />;
  if (room.isLoading) return <Skeleton className="mx-auto h-[70vh] w-full max-w-6xl" rounded="xl" />;
  if (room.isError || !room.data) return <NotFound />;
  const r = room.data;
  const member = r.my_role && r.my_state !== 'invited' && r.my_state !== 'left';
  if (!member) return <JoinPreview room={r} />;
  if (roomKind(r) === 'live' && r.status === 'lobby') return <Lobby room={r} me={user?.id} onRefresh={() => room.refetch()} />;
  return <LiveView initial={r} me={user?.id} />;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16">
      <EmptyState icon={Users} title="Room not found" message="Check the code, or ask the host to share the link again." actionLabel="Back to Run together" actionTo="/app/run-together" />
    </div>
  );
}

/* ---------------- Join preview ---------------- */

function JoinPreview({ room }: { room: RunRoom }) {
  const navigate = useNavigate();
  const join = useJoinRoom();
  const toast = useToast();
  const people = presentMembers(room);
  const host = room.members.find(m => m.is_host);
  const club = roomKind(room) === 'club';

  const watch = async () => {
    try {
      const joined = await join.mutateAsync({ target: { roomId: room.id }, role: 'spectator' });
      navigate(`/app/run-room/${joined.id}`, { replace: true });
    } catch (err) {
      const code = apiErrorCode(err);
      toast({ tone: 'danger', title: code === 'ROOM_FINISHED' ? 'This room has ended' : code === 'ROOM_FULL' ? 'This room is full' : getApiErrorMessage(err) });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <TitleBar eyebrow={club ? 'Official club' : room.my_state === 'invited' ? 'You’re invited' : 'Join a room'} backTo="/app/run-together" />
      <Card padding="xl" className="flex flex-col items-center gap-4 text-center">
        <RoomStatusPill room={room} />
        <Text variant="h1">{room.title}</Text>
        <Text variant="footnote" tone="muted">
          {club ? 'Open to everyone. Run any time; a fresh map every day.' : host ? `Hosted by ${host.name} · code ${room.code}` : `Code ${room.code}`}
        </Text>
        {people.length ? (
          <div className="flex flex-col items-center gap-2">
            <AvatarStack people={people} size={40} max={7} />
            <Text variant="caption" tone="muted">{people.length} {people.length === 1 ? 'person' : 'people'} in the room</Text>
          </div>
        ) : null}
        {room.status === 'finished' ? (
          <Text variant="callout" tone="muted">This room has ended.</Text>
        ) : (
          <Button icon={Eye} label={club ? 'Open today’s map' : 'Watch & cheer'} loading={join.isPending} onClick={watch} fullWidth />
        )}
      </Card>
      {room.status !== 'finished' ? <TrackInAppCard /> : null}
    </div>
  );
}

/* ---------------- Lobby (live rooms before the start) ---------------- */

function Lobby({ room, me, onRefresh }: { room: RunRoom; me?: string; onRefresh: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const start = useStartRoom();
  const leave = useLeaveRoom();
  const remove = useRemoveMember();
  const [inviting, setInviting] = useState(false);
  const isHost = room.host_id === me;
  const people = presentMembers(room);
  const runners = people.filter(m => m.role === 'runner');
  const watchers = people.filter(m => m.role === 'spectator');

  useEffect(() => {
    const t = setInterval(onRefresh, 4000);
    return () => clearInterval(t);
  }, [onRefresh]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: 'success', title: `${what} copied` });
    } catch {
      toast({ tone: 'info', title: text });
    }
  };
  const share = () => {
    const text = `Run with me on Gymmigo: ${room.title}. Code ${room.code}`;
    if (navigator.share) navigator.share({ title: room.title, text, url: room.share_url }).catch(() => undefined);
    else copy(`${text} ${room.share_url}`, 'Invite link');
  };
  const doLeave = async () => {
    if (!(await confirmDialog({ title: 'Leave this room?', confirmLabel: 'Leave', tone: 'danger' }))) return;
    await leave.mutateAsync(room.id);
    navigate('/app/run-together', { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <TitleBar eyebrow="Run room" title={room.title} backTo="/app/run-together" right={<IconButton icon={Share2} label="Share" onClick={share} />} />
      <Card padding="lg" className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge label="Lobby" tone="warning" dot />
          <Text variant="label" tone="muted">Room code</Text>
        </div>
        <button type="button" onClick={() => copy(room.code, 'Code')} className="flex gap-2" aria-label={`Copy code ${room.code}`}>
          {room.code.split('').map((c, i) => (
            <span key={i} className="grid h-14 w-11 place-items-center rounded-gm-md border border-border bg-surface-sunken t-h1 text-ink">{c}</span>
          ))}
        </button>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button icon={UserPlus} label="Invite" onClick={() => setInviting(true)} />
          <Button icon={Copy} variant="secondary" label="Copy link" onClick={() => copy(room.share_url, 'Link')} />
        </div>
      </Card>

      <MemberSection title="Runners" meta={`${runners.length} / ${room.max_runners}`} members={runners} room={room} me={me} isHost={isHost} onRemove={id => remove.mutate({ roomId: room.id, userId: id })} />
      {watchers.length ? <MemberSection title="Watching" members={watchers} room={room} me={me} isHost={isHost} onRemove={id => remove.mutate({ roomId: room.id, userId: id })} /> : null}
      {room.invited.length ? (
        <section>
          <SectionHeader label="Invited" meta={String(room.invited.length)} />
          <Card padding="sm" className="flex flex-wrap gap-3 p-3">
            {room.invited.map(u => (
              <span key={u.user_id} className="flex items-center gap-2">
                <Avatar name={u.name} src={u.avatar_url} size={28} />
                <Text variant="footnote">{u.name}</Text>
              </span>
            ))}
          </Card>
        </section>
      ) : null}

      <TrackInAppCard compact />
      <div className="flex flex-col gap-2">
        {isHost ? (
          <Button
            icon={Play}
            label="Start the run"
            loading={start.isPending}
            onClick={async () => {
              try {
                await start.mutateAsync(room.id);
              } catch (err) {
                toast({ tone: 'danger', title: getApiErrorMessage(err) });
              }
            }}
            fullWidth
          />
        ) : (
          <Text variant="footnote" tone="muted" align="center">Waiting for the host to start the run…</Text>
        )}
        {isHost ? <Text variant="caption" tone="muted" align="center">Everyone in the room gets a notification and goes live.</Text> : null}
        <Button variant="ghost" icon={LogOut} label="Leave room" onClick={doLeave} />
      </div>
      <InviteSheet open={inviting} onClose={() => setInviting(false)} room={room} />
    </div>
  );
}

function MemberSection({
  title,
  meta,
  members,
  room,
  me,
  isHost,
  onRemove,
}: {
  title: string;
  meta?: string;
  members: RunRoom['members'];
  room: RunRoom;
  me?: string;
  isHost: boolean;
  onRemove: (userId: string) => void;
}) {
  return (
    <section>
      <SectionHeader label={title} meta={meta ?? String(members.length)} />
      <Card padding="none" className="divide-y divide-border">
        {members.map(m => (
          <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={m.name} src={m.avatar_url} size={40} ring={m.color} />
            <div className="min-w-0 flex-1">
              <Text variant="subtitle" truncate>
                {m.name}
                {m.user_id === me ? <span className="t-footnote text-ink-muted"> (you)</span> : null}
              </Text>
              <Text variant="caption" tone="muted">{m.role === 'spectator' ? 'Watching' : 'Ready to run'}</Text>
            </div>
            {m.is_host ? <Badge label="Host" tone="accent" /> : null}
            {isHost && m.user_id !== me && room.status !== 'finished' ? <IconButton icon={X} label={`Remove ${m.name}`} variant="ghost" size={32} onClick={() => onRemove(m.user_id)} /> : null}
          </div>
        ))}
      </Card>
    </section>
  );
}

/* ---------------- Live / anytime map ---------------- */

function LiveView({ initial, me }: { initial: RunRoom; me?: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const live = useRoomLive(initial.id, { initialRoom: initial });
  const room = live.room ?? initial;
  const kind = roomKind(room);
  const anytime = kind !== 'live';
  const sessions = useMemo(() => effectiveSessions(room, live.sessions), [room, live.sessions]);
  const [tab, setTab] = useState<'now' | 'today'>(anytime ? 'now' : 'today');
  const [focus, setFocus] = useState<string | null>(null);
  const cheer = useCheer();
  const finish = useFinishRoom();
  const leave = useLeaveRoom();
  const isHost = room.host_id === me;
  const viewingPast = !!live.date;
  const ended = room.status === 'finished';

  // Toast cheers from other people as they arrive (not the backlog loaded with the room).
  const seenCheers = useRef<number | null>(null);
  useEffect(() => {
    const last = live.cheers[live.cheers.length - 1]?.seq ?? 0;
    if (seenCheers.current === null) {
      if (live.loaded) seenCheers.current = last;
      return;
    }
    for (const c of live.cheers) {
      if (c.seq > seenCheers.current && c.from_user_id !== me) toast({ tone: 'success', title: `${c.from_name}: ${CHEER_TEXT[c.kind].message}` });
    }
    seenCheers.current = Math.max(seenCheers.current, last);
  }, [live.cheers, live.loaded, me, toast]);

  const now = runningNow(sessions);
  const totals = memberTotals(sessions);
  const ranked = rankRunners(room.members);
  const rows = anytime ? (tab === 'now' ? now.map(rowFromSession) : totals.map(rowFromTotal)) : ranked.map(rowFromMember);

  const sendCheer = async (kind: CheerKind) => {
    try {
      await cheer.mutateAsync({ roomId: room.id, kind, to: focus });
      toast({ tone: 'success', title: focus ? 'Cheer sent' : 'Cheer sent to everyone' });
    } catch (err) {
      toast({ tone: 'danger', title: apiErrorCode(err) === 'CHEER_TOO_FAST' ? 'Easy — one cheer every couple of seconds' : getApiErrorMessage(err) });
    }
  };
  const doFinish = async () => {
    if (!(await confirmDialog({ title: kind === 'open' ? 'Close this room?' : 'End the run for everyone?', confirmLabel: kind === 'open' ? 'Close room' : 'End run', tone: 'danger' }))) return;
    await finish.mutateAsync(room.id);
  };
  const doLeave = async () => {
    if (!(await confirmDialog({ title: kind === 'club' ? 'Leave the club?' : 'Leave this room?', confirmLabel: 'Leave', tone: 'danger' }))) return;
    await leave.mutateAsync(room.id);
    navigate('/app/run-together', { replace: true });
  };

  const summary = anytime
    ? `${totals.length} ${totals.length === 1 ? 'runner' : 'runners'} · ${formatKm(totals.reduce((a, t) => a + t.distance_meters, 0), 1)} km · ${now.length} running now`
    : `${ranked.length} ${ranked.length === 1 ? 'runner' : 'runners'}${ended ? ' · finished' : ''}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-10">
      <TitleBar
        eyebrow={kind === 'club' ? 'Official' : kind === 'open' ? 'Open room' : ended ? 'Finished' : 'Live run'}
        title={room.title}
        backTo="/app/run-together"
        right={
          <div className="flex items-center gap-2">
            {live.offline ? <Badge label="Reconnecting" tone="warning" dot /> : <RoomStatusPill room={room} />}
            <IconButton icon={Users} label="Joined" onClick={() => navigate(`/app/run-room/${room.id}/members${live.date ? `?date=${live.date}` : ''}`)} />
          </div>
        }
      />
      {kind === 'club' ? (
        <div className="flex items-center justify-center gap-2">
          <IconButton icon={ChevronLeft} label="Previous day" variant="ghost" onClick={() => live.setDate(stepEdition(live.date, -1))} />
          <Text variant="label" className="min-w-32 text-center">{editionLabel(live.date)}</Text>
          <IconButton icon={ChevronRight} label="Next day" variant="ghost" disabled={!live.date} onClick={() => live.setDate(stepEdition(live.date, 1))} />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <RoomMap
          className="h-[52vh] min-h-[320px] lg:h-[calc(100vh-200px)]"
          sessions={sessions}
          trails={live.trails}
          me={me}
          viewingPast={viewingPast || ended}
          focusUserId={focus}
          onSelect={setFocus}
        />
        <Card padding="lg" className="flex flex-col gap-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
          <Text variant="caption" tone="muted">{viewingPast ? `${editionLabel(live.date)} · ` : ''}{summary}</Text>
          {anytime ? (
            <SegmentedControl
              size="sm"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'now', label: `Running now · ${now.length}` },
                { value: 'today', label: kind === 'club' ? (viewingPast ? 'That day' : 'Today') : 'Leaderboard' },
              ]}
            />
          ) : (
            <Text variant="label" tone="muted">Leaderboard</Text>
          )}
          {!live.loaded ? (
            <Skeleton className="h-40" rounded="xl" />
          ) : (
            <Leaderboard rows={rows} me={me} onSelect={setFocus} empty={tab === 'now' && anytime ? 'Nobody is running right now.' : 'No runs yet.'} />
          )}
          {focus ? (
            <Button size="sm" variant="secondary" label={`Cheering ${rows.find(r => r.user_id === focus)?.name ?? 'runner'} · show everyone`} onClick={() => setFocus(null)} />
          ) : null}
          {!viewingPast && !ended ? <CheerBar onCheer={sendCheer} disabled={cheer.isPending} label={focus ? 'Cheer this runner' : 'Cheer everyone'} /> : null}
          {anytime ? (
            <Text variant="caption" tone="muted" className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> The start and end of others’ routes are hidden.
            </Text>
          ) : null}
          {!ended ? <TrackInAppCard compact /> : null}
          <div className="flex flex-col gap-1">
            {isHost && !ended && kind !== 'club' ? <Button variant="danger" icon={Flag} label={kind === 'open' ? 'Close room' : 'End run for everyone'} onClick={doFinish} loading={finish.isPending} /> : null}
            {kind !== 'live' || !isHost ? <Button variant="ghost" icon={LogOut} label={kind === 'club' ? 'Leave the club' : 'Leave room'} onClick={doLeave} /> : null}
            <Link to={`/app/run-room/${room.id}/members`} className="py-2 text-center t-footnote text-accent-text">See everyone who joined</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
