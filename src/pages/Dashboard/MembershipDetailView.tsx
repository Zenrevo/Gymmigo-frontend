import { useEffect, useState } from 'react';
import { Activity, Building2, Calendar, LogOut, Mail, MapPin, Phone, Star } from 'lucide-react';
import { AppBar, Badge, Button, Card, EmptyState, Skeleton, StatTile, Text, TextArea, TextField, cn, useToast, type Tone } from '../../components/kit';
import { getGoogleMapsUrl } from '../../utils/navigation';
import api, { getApiErrorMessage } from '../../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any -- membership payloads are untyped */

const STATUS_TONE: Record<string, Tone> = { active: 'success', pending: 'warning', expired: 'neutral', cancelled: 'danger', rejected: 'danger' };
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (d?: string) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
const nameOf = (x: any) => (typeof x === 'string' ? x : x?.name);

/** One gym's memberships: live status + check-out, passes, attendance, gym contact and review. */
export default function MembershipDetailView({ gymGroup, onBack }: { gymGroup: any; onBack: () => void }) {
  const toast = useToast();
  const [gym, setGym] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAttendance = async () => {
    const res = await api.get(`/memberships/check-ins/history?gym_id=${gymGroup.gym_id}`);
    setAttendance(res.data.data);
  };

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const [g, a] = await Promise.all([api.get(`/gyms/${gymGroup.gym_id}`), api.get(`/memberships/check-ins/history?gym_id=${gymGroup.gym_id}`)]);
        if (!live) return;
        setGym(g.data.data ? g.data.data : g.data);
        setAttendance(a.data.data);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [gymGroup]);

  const active = attendance?.check_ins?.find((c: any) => !c.check_out_time);
  const checkOut = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api.post(`/memberships/check-out/${active.id}`, {});
      await loadAttendance();
      toast({ tone: 'success', title: 'Successfully checked out!' });
    } catch {
      toast({ tone: 'error', title: 'Failed to check out. Please try scanning again.' });
    } finally {
      setBusy(false);
    }
  };
  const submitReview = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api.post('/memberships/reviews', { gym_id: gymGroup.gym_id, rating, title: title || 'Review', review: text });
      toast({ tone: 'success', title: 'Review submitted successfully!' });
      setText('');
      setTitle('');
      setRating(5);
      setGym((g: any) => ({ ...g, can_review: false }));
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const memberships: any[] = gymGroup.memberships || [];
  const totalVisits = attendance?.total || memberships.reduce((s, m) => s + (m.total_check_ins || 0), 0) || 0;
  const timed = (attendance?.check_ins || []).filter((c: any) => c.duration_minutes != null);
  const avgDuration = timed.length ? Math.round(timed.reduce((s: number, c: any) => s + c.duration_minutes, 0) / timed.length) : 0;
  const cur = gym?.current_occupancy ?? gymGroup.current_occupancy ?? 0;
  const max = gym?.max_capacity ?? gymGroup.max_capacity ?? 100;
  const ratio = max ? cur / max : 0;
  const addr = gym?.addresses?.[0];

  return (
    <div className="mx-auto w-full max-w-[1080px] pb-10">
      <AppBar onBack={onBack} caption="MY MEMBERSHIP" />
      {loading ? (
        <div className="mt-2 flex flex-col gap-4">
          <Skeleton className="h-32 rounded-gm-xl" />
          <Skeleton className="h-60 rounded-gm-xl" />
        </div>
      ) : (
        <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-gm-lg bg-surface-sunken">
                  {gym?.logo_url || gymGroup.gym_logo_url ? <img src={gym?.logo_url || gymGroup.gym_logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 size={24} className="text-accent" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <Text variant="h1" className="truncate">
                    {gymGroup.gym_name}
                  </Text>
                  <Text variant="caption" tone="subtle">
                    Detailed overview & attendance
                  </Text>
                </div>
                <Button label="Gym page" size="sm" variant="secondary" to={`/app/gyms/${gymGroup.gym_id}`} />
              </div>
              <div className="mt-4 rounded-gm-md bg-surface-sunken p-3">
                <div className="flex items-center justify-between">
                  <Text variant="label" tone="subtle">
                    Live crowd
                  </Text>
                  <Text variant="footnote" className="font-semibold tabular-nums">
                    {cur} / {max}
                  </Text>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                  <div className={cn('h-full rounded-full', ratio > 0.8 ? 'bg-danger' : ratio > 0.5 ? 'bg-warning' : 'bg-success')} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                </div>
              </div>
              {active ? (
                <div className="mt-4 flex items-center gap-3 rounded-gm-md border border-success bg-success-soft p-3">
                  <Activity size={18} className="text-success" aria-hidden />
                  <Text variant="footnote" className="flex-1">
                    Checked in since {fmtTime(active.check_in_time)}
                  </Text>
                  <Button label="Check out" size="sm" variant="secondary" icon={LogOut} loading={busy} onClick={checkOut} />
                </div>
              ) : null}
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Total visits" value={totalVisits} icon={Calendar} />
              <StatTile label="Avg session" value={avgDuration} unit="min" icon={Activity} />
            </div>

            <section className="flex flex-col gap-2">
              <Text variant="label" tone="subtle">
                Passes
              </Text>
              {memberships.map(m => (
                <Card key={m.id} padding="md">
                  <div className="flex items-center gap-2">
                    <Text variant="bodyStrong" className="flex-1 truncate">
                      {m.plan_name || m.name || 'Membership'}
                    </Text>
                    <Badge label={m.status} tone={STATUS_TONE[m.status] ?? 'neutral'} />
                  </div>
                  <Text variant="caption" tone="subtle">
                    Valid until {fmtDate(m.end_date)}
                  </Text>
                  {m.selected_addons?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.selected_addons.map((a: any, i: number) => (
                        <Badge key={i} label={nameOf(a)} />
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </section>

            <section className="flex flex-col gap-2">
              <Text variant="label" tone="subtle">
                Attendance
              </Text>
              {attendance?.check_ins?.length ? (
                <Card padding="none" className="px-4">
                  {attendance.check_ins.map((c: any, i: number) => (
                    <div key={c.id ?? i} className={cn('flex items-center justify-between py-3', i < attendance.check_ins.length - 1 && 'border-b border-border')}>
                      <div>
                        <Text variant="bodyStrong">{fmtDate(c.check_in_time)}</Text>
                        <Text variant="caption" tone="muted">
                          {fmtTime(c.check_in_time)}
                          {c.check_out_time ? ` → ${fmtTime(c.check_out_time)}` : ' · in progress'}
                        </Text>
                      </div>
                      {c.duration_minutes != null ? <Badge label={`${c.duration_minutes} min`} /> : <Badge label="Live" tone="success" dot />}
                    </div>
                  ))}
                </Card>
              ) : (
                <EmptyState compact icon={Calendar} title="No visits yet" message="Scan the gym’s QR at the desk to check in." />
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <Card padding="lg" className="flex flex-col gap-3">
              <Text variant="label" tone="subtle">
                Contact
              </Text>
              {addr ? (
                <a href={getGoogleMapsUrl(`${addr.address_line1}, ${gym?.city ?? ''}`, addr.latitude, addr.longitude)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-accent-text">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <Text variant="footnote">{[addr.address_line1, gym?.city].filter(Boolean).join(', ')}</Text>
                </a>
              ) : null}
              {gym?.contact_phone ? (
                <a href={`tel:${gym.contact_phone}`} className="flex items-center gap-2">
                  <Phone size={16} className="text-accent" aria-hidden />
                  <Text variant="footnote">{gym.contact_phone}</Text>
                </a>
              ) : null}
              {gym?.contact_email ? (
                <a href={`mailto:${gym.contact_email}`} className="flex items-center gap-2">
                  <Mail size={16} className="text-accent" aria-hidden />
                  <Text variant="footnote">{gym.contact_email}</Text>
                </a>
              ) : null}
            </Card>
            {gym?.facilities?.length || gym?.amenities?.length ? (
              <Card padding="lg">
                <Text variant="label" tone="subtle">
                  Facilities & amenities
                </Text>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(gym.facilities || []), ...(gym.amenities || [])].map((f: any, i: number) => (
                    <Badge key={i} label={nameOf(f)} />
                  ))}
                </div>
              </Card>
            ) : null}
            {gym?.can_review ? (
              <Card padding="lg" className="flex flex-col gap-3">
                <Text variant="subtitle">Rate your gym</Text>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} stars`} onClick={() => setRating(i)}>
                      <Star size={24} className={i <= rating ? 'fill-rating text-rating' : 'text-ink-subtle'} />
                    </button>
                  ))}
                </div>
                <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <TextArea label="Your review" rows={3} value={text} onChange={e => setText(e.target.value)} />
                <Button label="Submit review" loading={saving} disabled={!text.trim()} onClick={submitReview} />
              </Card>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
