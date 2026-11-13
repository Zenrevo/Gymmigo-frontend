import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Radio } from 'lucide-react';
import { Button, Card, DateField, SelectableCard, Text, TextField, TimeField } from '../../components/kit';
import { getApiErrorMessage } from '../../utils/api';
import { apiErrorCode } from '../../api/envelope';
import { endsAtError } from '../../lib/runRoom/roomLogic';
import { useCreateRoom } from '../../hooks/useRunTogether';
import { EndTimeChips, TrackInAppCard, TitleBar } from './components/RoomBits';
import { resolveEndsAt } from './components/roomView';

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Create a live run (start together) or an open room (join and run any time until it closes). */
export default function RoomCreatePage() {
  const navigate = useNavigate();
  const create = useCreateRoom();
  const [kind, setKind] = useState<'live' | 'open'>('live');
  const [title, setTitle] = useState('');
  const [preset, setPreset] = useState('24h');
  const [date, setDate] = useState(() => localDate(new Date(Date.now() + 86_400_000)));
  const [time, setTime] = useState(() => localTime(new Date(Date.now() + 86_400_000)));
  const [today] = useState(() => localDate(new Date()));
  const [error, setError] = useState('');

  const endsAt = kind === 'open' ? resolveEndsAt(preset, date, time) : null;
  const endsError = endsAt ? endsAtError(endsAt) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (endsError) return;
    setError('');
    try {
      const room = await create.mutateAsync({
        title: title.trim() || undefined,
        kind,
        ...(endsAt ? { ends_at: endsAt.toISOString() } : null),
      });
      navigate(`/app/run-room/${room.id}`, { replace: true });
    } catch (err) {
      setError(apiErrorCode(err) === 'TOO_MANY_OPEN_ROOMS' ? 'You can host up to 5 open rooms at once.' : getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-10">
      <TitleBar eyebrow="Run together" title="Create a room" backTo="/app/run-together" />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectableCard
          icon={Radio}
          title="Live run"
          description="Start together. You press Start, everyone runs at once, you end it."
          selected={kind === 'live'}
          onSelect={() => setKind('live')}
        />
        <SelectableCard
          icon={CalendarClock}
          title="Open room"
          description="People join and run whenever they like until it closes."
          selected={kind === 'open'}
          onSelect={() => setKind('open')}
        />
      </div>
      <Card padding="lg" className="flex flex-col gap-5">
        <TextField label="Room name" optional placeholder="e.g. Sunday tempo run" maxLength={60} value={title} onChange={e => setTitle(e.target.value)} />
        {kind === 'open' ? (
          <div className="flex flex-col gap-3">
            <Text variant="label" tone="muted">Closes in</Text>
            <EndTimeChips value={preset} onChange={setPreset} />
            {preset === 'custom' ? (
              <div className="grid grid-cols-2 gap-3">
                <DateField label="Date" value={date} onChange={setDate} min={today} />
                <TimeField label="Time" value={time} onChange={setTime} />
              </div>
            ) : null}
            {endsAt && !endsError ? (
              <Text variant="footnote" tone="muted">
                Closes {endsAt.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </Text>
            ) : null}
            {endsError ? <Text variant="footnote" tone="danger">{endsError}</Text> : null}
          </div>
        ) : null}
      </Card>
      <TrackInAppCard compact />
      {error ? <Text variant="footnote" tone="danger" align="center">{error}</Text> : null}
      <Button type="submit" label={kind === 'live' ? 'Create live run' : 'Create open room'} loading={create.isPending} disabled={!!endsError} fullWidth />
    </form>
  );
}
