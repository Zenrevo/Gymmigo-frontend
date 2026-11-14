import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, MapPin, Navigation, Phone, Play, StickyNote } from 'lucide-react';
import { AppBar, Avatar, Badge, Button, Card, ErrorState, Skeleton, StatTile, Text, confirmDialog, useToast, type Tone } from '../../components/kit';
import { MapPanel } from '../../components/explore/MapPanel';
import { useAuth } from '../../context/AuthContext';
import { discoveryApi } from '../../api/discovery';
import { getApiErrorMessage } from '../../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any -- session payload is untyped */

const STATUS_TONE: Record<string, Tone> = { completed: 'success', in_progress: 'accent', cancelled: 'danger', scheduled: 'info', pending_confirmation: 'warning' };

/** Trainer session detail (GET /trainer-bookings/sessions/{id}; cancel). */
export default function SessionDetail() {
  const { sessionId = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      setS(await discoveryApi.session(sessionId));
    } catch (err) {
      console.error('Failed to fetch session details:', err);
      setS(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (sessionId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading)
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4">
        <Skeleton className="h-40 rounded-gm-xl" />
        <Skeleton className="h-60 rounded-gm-xl" />
      </div>
    );
  if (!s)
    return (
      <div className="mx-auto w-full max-w-[720px] py-10">
        <ErrorState title="Session not found" message="It may have been removed, or it isn’t yours." onRetry={load} />
      </div>
    );

  const isTrainer = user?.id === s.trainer_id;
  const other = {
    name: isTrainer ? s.user_name : s.trainer_name,
    phone: isTrainer ? s.user_phone : s.trainer_phone,
    avatar: isTrainer ? s.user_avatar : s.trainer_avatar,
    role: isTrainer ? 'Client' : 'Trainer',
  };
  const hasLoc = s.latitude && s.longitude;
  const directions = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`, '_blank', 'noopener,noreferrer');
  const cancel = async () => {
    if (!(await confirmDialog({ title: 'Cancel session?', message: 'Are you sure you want to cancel this session? This action cannot be undone.', confirmLabel: 'Yes, cancel', cancelLabel: 'Keep it', tone: 'danger' }))) return;
    setCancelling(true);
    try {
      await discoveryApi.cancelSession(sessionId);
      toast({ tone: 'success', title: 'Session cancelled successfully.' });
      await load();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not cancel', message: getApiErrorMessage(err) });
    } finally {
      setCancelling(false);
    }
  };
  const progress = s.sessions_remaining != null && s.total_sessions ? `${s.total_sessions - s.sessions_remaining} / ${s.total_sessions}` : 'N/A';

  return (
    <div className="mx-auto w-full max-w-[960px] pb-10">
      <AppBar backTo="/app/dashboard" caption="SESSION" />
      <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card padding="lg">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={String(s.status).replace(/_/g, ' ')} tone={STATUS_TONE[s.status] ?? 'neutral'} dot />
              {s.session_type ? <Badge label={`${s.session_type} session`} /> : null}
            </div>
            <Text variant="h1" className="mt-2">
              {s.package_name || 'Training session'}
            </Text>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile label="Date" icon={Calendar} value={s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'} />
              <StatTile label="Time" icon={Clock} value={s.scheduled_time ? String(s.scheduled_time).slice(0, 5) : '—'} caption={s.duration_minutes ? `${s.duration_minutes} min` : undefined} />
              <StatTile label="Progress" value={progress} />
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            {hasLoc ? <MapPanel center={{ lat: Number(s.latitude), lng: Number(s.longitude) }} points={[{ id: 'session', lat: Number(s.latitude), lng: Number(s.longitude) }]} zoom={15} className="h-[220px]" /> : null}
            <div className="flex items-center gap-3 p-4">
              <MapPin size={18} className="shrink-0 text-accent" aria-hidden />
              <Text variant="bodyStrong" className="min-w-0 flex-1 truncate">
                {s.location || (s.session_type === 'online' ? 'Online' : 'Location to be shared')}
              </Text>
              {hasLoc ? <Button label="Directions" size="sm" variant="secondary" icon={Navigation} onClick={directions} /> : null}
            </div>
          </Card>

          {s.booking_user_notes ? (
            <Card padding="lg">
              <div className="flex items-center gap-2">
                <StickyNote size={16} className="text-accent" aria-hidden />
                <Text variant="label" tone="subtle">
                  Notes
                </Text>
              </div>
              <Text tone="muted" className="mt-2">
                {s.booking_user_notes}
              </Text>
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <Card padding="lg">
            <Text variant="label" tone="subtle">
              {other.role}
            </Text>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={other.name} src={other.avatar} size={48} />
              <Text variant="title" className="min-w-0 flex-1 truncate">
                {other.name || other.role}
              </Text>
            </div>
            {other.phone ? <Button className="mt-4" label={other.phone} icon={Phone} variant="secondary" fullWidth href={`tel:${other.phone}`} /> : null}
          </Card>
          <Card padding="lg" className="flex flex-col gap-2">
            {s.status === 'scheduled' && isTrainer ? <Button label="Begin session · in the app" icon={Play} fullWidth disabled /> : null}
            {s.status === 'scheduled' ? <Button label="Cancel session" variant="danger" fullWidth loading={cancelling} onClick={cancel} /> : null}
            {s.status === 'completed' ? (
              <div className="flex flex-col items-center gap-1 py-2 text-success">
                <CheckCircle2 size={28} aria-hidden />
                <Text variant="label" tone="success">
                  Session completed
                </Text>
              </div>
            ) : null}
            {s.status === 'pending_confirmation' ? (
              <div className="flex flex-col items-center gap-1 py-2 text-warning">
                <Clock size={28} aria-hidden />
                <Text variant="label" tone="warning">
                  Awaiting confirmation
                </Text>
              </div>
            ) : null}
            {s.status === 'cancelled' ? (
              <Text variant="footnote" tone="muted" className="text-center">
                This session was cancelled.
              </Text>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
