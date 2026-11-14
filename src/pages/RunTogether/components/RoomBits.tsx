import type React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Hand, Smartphone, ThumbsUp, Trophy, Zap, type LucideIcon } from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, cn, SignatureCard, Skeleton, Text } from '../../../components/kit';
import type { CheerKind, RunRoom } from '../../../api/runRooms';
import type { Row } from './roomView';
import { CHEER_KINDS, CHEER_TEXT, endsInText, formatGapDistance, presentMembers, roomKind } from '../../../lib/runRoom/roomLogic';
import { formatDuration, formatKm, formatPace } from '../../../lib/runRoom/format';
import { useClub } from '../../../hooks/useRunTogether';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo';

export function RoomStatusPill({ room }: { room: RunRoom }) {
  if (room.status === 'finished') return <Badge label="Finished" tone="neutral" />;
  if (roomKind(room) === 'club') return <Badge label="Official" tone="accent" />;
  if (roomKind(room) === 'open') return <Badge label={room.ends_at ? `Open · ${endsInText(room.ends_at)}` : 'Open'} tone="success" dot />;
  if (room.status === 'live') return <Badge label="Live" tone="danger" dot />;
  return <Badge label="Lobby" tone="warning" dot />;
}

export function AvatarStack({ people, size = 32, max = 5 }: { people: { user_id: string; name: string; avatar_url: string | null; color?: string }[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div key={p.user_id} className={cn(i > 0 && '-ml-2')} style={{ zIndex: max - i }}>
          <Avatar name={p.name} src={p.avatar_url} size={size} ring={p.color} />
        </div>
      ))}
      {extra > 0 ? <span className="-ml-2 grid place-items-center rounded-full bg-surface-sunken t-caption text-ink-muted border border-border" style={{ width: size, height: size }}>+{extra}</span> : null}
    </div>
  );
}

/** Web can watch and cheer; recording a run needs the phone's GPS. */
export function TrackInAppCard({ compact }: { compact?: boolean }) {
  return (
    <Card variant="sunken" padding={compact ? 'sm' : 'md'}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-gm-md bg-accent-soft text-accent-text">
          <Smartphone size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <Text variant="subtitle">Track your run with the Gymmigo app</Text>
          <Text variant="footnote" tone="muted">
            The web can watch the map and cheer. To run in this room, open it in the app — your GPS run shows up here live.
          </Text>
          {!compact ? <Button className="mt-3" size="sm" variant="secondary" label="Get the app" href={PLAY_URL} target="_blank" /> : null}
        </div>
      </div>
    </Card>
  );
}

const CHEER_ICON: Record<CheerKind, LucideIcon> = { clap: ThumbsUp, fire: Flame, go: Zap, strong: Trophy, almost: Hand };

export function CheerBar({ onCheer, disabled, label = 'Cheer everyone' }: { onCheer: (k: CheerKind) => void; disabled?: boolean; label?: string }) {
  return (
    <div>
      <Text variant="labelSm" tone="subtle" className="mb-2">{label}</Text>
      <div className="grid grid-cols-5 gap-2">
        {CHEER_KINDS.map(k => {
          const Icon = CHEER_ICON[k];
          return (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => onCheer(k)}
              className="flex flex-col items-center gap-1 rounded-gm-md border border-border bg-surface px-1 py-2.5 text-accent-text transition hover:bg-surface-sunken disabled:opacity-50"
            >
              <Icon size={18} />
              <span className="t-label-sm text-ink-muted">{CHEER_TEXT[k].label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Ranked list: position, avatar, name, pace/time + gap to the runner ahead, distance. */
export function Leaderboard({ rows, me, onSelect, empty = 'Nobody is running yet.' }: { rows: Row[]; me?: string; onSelect?: (userId: string) => void; empty?: string }) {
  if (!rows.length) return <Text variant="footnote" tone="muted" className="py-4">{empty}</Text>;
  return (
    <ol className="divide-y divide-border">
      {rows.map((r, i) => {
        const ahead = i > 0 ? rows[i - 1].distance_meters : null;
        const gap = i > 0 && ahead != null && r.distance_meters != null ? `${formatGapDistance(ahead - r.distance_meters)} behind` : null;
        return (
          <li key={r.user_id}>
            <button type="button" onClick={() => onSelect?.(r.user_id)} className="flex w-full items-center gap-3 py-3 text-left">
              <span className={cn('w-5 t-subtitle', i === 0 ? 'text-accent-text' : 'text-ink-muted')}>{i + 1}</span>
              <Avatar name={r.name} src={r.avatar_url} size={36} ring={r.color} status={r.running ? 'online' : 'none'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate t-subtitle text-ink">{r.user_id === me ? 'You' : r.name}</span>
                <span className="block truncate t-caption text-ink-muted">
                  {[r.sub, r.moving_seconds ? formatDuration(r.moving_seconds) : null, r.pace ? `${formatPace(r.pace)}/km` : null, gap].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="text-right">
                <span className="t-title text-ink">{r.distance_meters != null ? formatKm(r.distance_meters) : '–'}</span>
                <span className="t-caption text-ink-muted"> km</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The official Gymmigo Run Club: today's numbers and who's running now. */
export function ClubCard({ onOpen }: { onOpen: (room: RunRoom) => void }) {
  const club = useClub();
  if (club.isLoading) return <Skeleton className="h-44" rounded="xl" />;
  if (!club.data) return null;
  const room = club.data;
  const today = room.today;
  const running = presentMembers(room).filter(m => m.state === 'running');
  return (
    <SignatureCard>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-gm-md bg-accent-soft text-accent-text">
          <Trophy size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="h2">Gymmigo Run Club</Text>
            <Badge label="Official" tone="accent" />
          </div>
          <Text variant="footnote" tone="muted">Open to everyone. Run any time; a fresh map every day.</Text>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-gm-lg bg-surface-sunken py-3 text-center">
        <Stat value={String(today?.runners ?? 0)} label="runners today" />
        <Stat value={formatKm(today?.distance_meters ?? 0, 1)} label="km today" />
        <Stat value={String(running.length)} label="running now" dot={running.length > 0} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        {running.length ? <AvatarStack people={running} size={30} /> : null}
        <Button className="flex-1" label="Open today’s map" onClick={() => onOpen(room)} />
      </div>
    </SignatureCard>
  );
}

function Stat({ value, label, dot }: { value: string; label: string; dot?: boolean }) {
  return (
    <div className="px-2">
      <div className="flex items-center justify-center gap-1.5 t-title text-ink">
        {dot ? <span className="size-2 rounded-full bg-success" /> : null}
        {value}
      </div>
      <div className="t-caption text-ink-muted">{label}</div>
    </div>
  );
}

export function EndTimeChips({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const opts = [
    ['2h', '2 hours'],
    ['24h', '24 hours'],
    ['3d', '3 days'],
    ['7d', '7 days'],
    ['custom', 'Custom'],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(([k, l]) => (
        <Chip key={k} label={l} selected={value === k} onClick={() => onChange(k)} />
      ))}
    </div>
  );
}

/** Back button + eyebrow over title + actions (AppBar centres its caption, which collides with a title). */
export function TitleBar({ eyebrow, title, backTo, right }: { eyebrow?: React.ReactNode; title?: React.ReactNode; backTo: string; right?: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3">
      <Link
        to={backTo}
        aria-label="Back"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-gm-md border border-border bg-surface text-ink transition-colors hover:bg-surface-sunken"
      >
        <ArrowLeft size={18} aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        {eyebrow ? <div className="t-label-sm text-accent-text">{eyebrow}</div> : null}
        {title ? <h1 className="t-h2 truncate text-ink">{title}</h1> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}
