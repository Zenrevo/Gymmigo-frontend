import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Award, BadgeCheck, CalendarCheck, CheckCircle2, Clock, Home, Languages, MapPin, Star, Users, Video } from 'lucide-react';
import { AppBar, Avatar, Badge, Button, Card, EmptyState, ErrorState, ProgressSteps, SectionHeader, Sheet, Skeleton, StatTile, Text, TextArea, cn, useToast } from '../../components/kit';
import { discoveryApi } from '../../api/discovery';
import { getApiErrorMessage } from '../../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any -- trainer payloads are untyped */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);

/** Package booking: start date → notes → review → success (POST /trainer-bookings/bookings). */
function BookingSheet({ trainer, pkg, open, onClose }: { trainer: any; pkg: any | null; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dates] = useState(() =>
    Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    }),
  );
  useEffect(() => {
    if (open) {
      setStep(1);
      setDate('');
      setNotes('');
    }
  }, [open]);
  const amount = pkg ? pkg.discounted_price || pkg.price : trainer.single_session_charges || trainer.hourly_rate || 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      await discoveryApi.bookTrainer({ trainer_id: trainer.id, package_id: pkg?.id || null, start_date: date, user_notes: notes.trim() || undefined } as any);
      setStep(4);
    } catch (err) {
      toast({ tone: 'error', title: 'Booking failed', message: getApiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const titles = ['Pick a start date', 'Goals & notes', 'Review & confirm', 'Request sent'];
  const footer =
    step === 4 ? (
      <Button label="Back to Home" fullWidth to="/app/dashboard" />
    ) : step === 3 ? (
      <Button label="Confirm booking" loading={submitting} fullWidth onClick={submit} />
    ) : (
      <Button label="Continue" disabled={step === 1 && !date} fullWidth onClick={() => setStep(step + 1)} />
    );

  return (
    <Sheet open={open} onClose={onClose} eyebrow={pkg ? pkg.name : 'Single session'} title={titles[step - 1]} footer={footer}>
      {step < 4 ? <ProgressSteps total={3} current={step} className="mb-4" /> : null}
      {step === 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Start date">
          {dates.map(d => {
            const on = date === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setDate(d)}
                className={cn('flex flex-col items-center rounded-gm-md border py-2', on ? 'border-selection bg-selection text-on-selection' : 'border-border bg-surface text-ink hover:border-border-strong')}>
                <span className="t-label-sm">{fmtDay(d, { weekday: 'short' })}</span>
                <span className="t-h2">{fmtDay(d, { day: 'numeric' })}</span>
                <span className="t-caption opacity-70">{fmtDay(d, { month: 'short' })}</span>
              </button>
            );
          })}
        </div>
      ) : step === 2 ? (
        <TextArea label="Goals & notes" rows={4} placeholder="e.g. Knee-friendly leg work, prefer mornings" value={notes} onChange={e => setNotes(e.target.value)} />
      ) : step === 3 ? (
        <Card variant="sunken" padding="md" className="flex flex-col gap-2">
          {[
            ['Coach', trainer.full_name],
            ['Plan', pkg ? pkg.name : 'Single session'],
            ['Starts', date ? fmtDay(date, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
            ...(pkg ? [['Sessions', `${pkg.total_sessions} · valid ${pkg.validity_days} days`]] : []),
            ...(notes.trim() ? [['Notes', notes.trim()]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <Text variant="footnote" tone="muted">
                {k}
              </Text>
              <Text variant="footnote" className="text-right font-semibold">
                {v}
              </Text>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <Text variant="title">Total</Text>
            <Text variant="h2" tone="accent">
              {inr(amount)}
            </Text>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 size={48} className="text-success" aria-hidden />
          <Text tone="muted">{trainer.full_name} will confirm your booking. You’ll see it on Home once it’s accepted.</Text>
        </div>
      )}
    </Sheet>
  );
}

/** Trainer profile: hero, stats, certifications, availability, portfolio, reviews, pricing & packages, booking. */
export default function TrainerProfile() {
  const { trainerId = '' } = useParams();
  const [params] = useSearchParams();
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, avg_rating: 0 });
  const [booking, setBooking] = useState<{ pkg: any | null } | null>(null);
  const [wantBook] = useState(() => params.get('book') === '1');

  const load = async () => {
    setLoading(true);
    try {
      setTrainer(await discoveryApi.trainer(trainerId));
    } catch (err) {
      console.error('Failed to fetch trainer:', err);
      setTrainer(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    discoveryApi
      .trainerReviews(trainerId)
      .then(d => {
        setReviews(d?.reviews || []);
        setMeta({ total: d?.total || 0, avg_rating: d?.avg_rating || 0 });
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId]);
  useEffect(() => {
    if (wantBook && trainer) setBooking({ pkg: trainer.packages?.find((p: any) => p.is_popular) ?? trainer.packages?.[0] ?? null });
  }, [wantBook, trainer]);

  if (loading)
    return (
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4">
        <Skeleton className="h-40 rounded-gm-xxl" />
        <Skeleton className="h-60 rounded-gm-xl" />
      </div>
    );
  if (!trainer)
    return (
      <div className="mx-auto w-full max-w-[720px] py-10">
        <ErrorState title="Trainer not found." onRetry={load} />
      </div>
    );

  const specs: string[] = trainer.specializations || [];
  const packages: any[] = trainer.packages || [];
  const gallery: any[] = trainer.gallery || [];
  const certs: any[] = trainer.certifications || [];
  const pricing = [
    trainer.single_session_charges ? ['Single session', inr(trainer.single_session_charges)] : null,
    trainer.hourly_rate ? ['Hourly', `${inr(trainer.hourly_rate)}/hr`] : null,
    trainer.monthly_charges ? ['Monthly', `${inr(trainer.monthly_charges)}/mo`] : null,
  ].filter(Boolean) as [string, string][];
  const modes = [
    trainer.is_available_online ? { icon: Video, label: 'Online' } : null,
    trainer.is_available_offline ? { icon: MapPin, label: 'In person' } : null,
    trainer.accepts_home_visits ? { icon: Home, label: `Home visits${trainer.travel_distance_km ? ` · ${trainer.travel_distance_km} km` : ''}` } : null,
  ].filter(Boolean) as { icon: typeof Video; label: string }[];

  return (
    <div className="mx-auto w-full max-w-[1080px] pb-10">
      <AppBar backTo="/app/discovery" caption="COACH PROFILE" />
      <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-4">
              <Avatar name={trainer.full_name} src={trainer.avatar_url} size={80} />
              <div className="min-w-0 flex-1">
                <Text variant="labelSm" tone="accent">
                  Performance coach
                </Text>
                <div className="flex items-center gap-2">
                  <Text variant="h1" className="truncate">
                    {trainer.full_name}
                  </Text>
                  {trainer.verification_status === 'verified' ? <BadgeCheck size={20} className="shrink-0 text-info" aria-label="Verified" /> : null}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <Star size={14} className="fill-rating text-rating" aria-hidden />
                  <Text variant="callout" className="font-bold">
                    {trainer.rating_avg ? Number(trainer.rating_avg).toFixed(1) : '—'}
                  </Text>
                  <Text variant="caption" tone="subtle">
                    ({trainer.rating_count || meta.total} reviews)
                  </Text>
                </div>
              </div>
            </div>
            {specs.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {specs.map(s => (
                  <Badge key={s} label={s} tone="accent" />
                ))}
              </div>
            ) : null}
            {trainer.bio ? (
              <Text tone="muted" className="mt-4">
                {trainer.bio}
              </Text>
            ) : null}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile label="Experience" value={trainer.experience_years ?? 0} unit="yrs" icon={Award} />
              <StatTile label="Clients" value={trainer.total_clients ?? 0} icon={Users} />
              <StatTile label="Rating" value={trainer.rating_avg ? Number(trainer.rating_avg).toFixed(1) : '—'} icon={Star} />
            </div>
            {modes.length || trainer.languages_spoken?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {modes.map(m => (
                  <Badge key={m.label} label={m.label} />
                ))}
                {trainer.languages_spoken?.length ? (
                  <span className="t-caption inline-flex items-center gap-1 text-ink-muted">
                    <Languages size={13} aria-hidden /> {trainer.languages_spoken.join(', ')}
                  </span>
                ) : null}
              </div>
            ) : null}
          </Card>

          {certs.length ? (
            <section>
              <SectionHeader label="Certifications" />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {certs.map(c => (
                  <Card key={c.id} padding="md" className="flex items-center gap-3">
                    <Award size={20} className="shrink-0 text-accent" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Text variant="bodyStrong" className="truncate">
                        {c.name}
                      </Text>
                      <Text variant="caption" tone="subtle">
                        {[c.issued_by, c.issue_year].filter(Boolean).join(' · ')}
                      </Text>
                    </div>
                    {c.is_verified ? <Badge label="Verified" tone="success" /> : null}
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {trainer.availability?.length ? (
            <section>
              <SectionHeader label="Weekly availability" />
              <Card padding="none" className="mt-2 px-4">
                {DAY_NAMES.map((day, idx) => {
                  const a = trainer.availability.find((x: any) => x.day_of_week === idx);
                  return (
                    <div key={day} className={cn('flex items-center justify-between py-2.5', idx < 6 && 'border-b border-border')}>
                      <Text variant="footnote" className="font-semibold">
                        {day}
                      </Text>
                      {a ? (
                        <Text variant="footnote" tone="success" className="inline-flex items-center gap-1 font-semibold">
                          <Clock size={13} aria-hidden /> {a.start_time} — {a.end_time}
                        </Text>
                      ) : (
                        <Text variant="footnote" tone="subtle">
                          Off
                        </Text>
                      )}
                    </div>
                  );
                })}
              </Card>
            </section>
          ) : null}

          {gallery.length ? (
            <section>
              <SectionHeader label="Portfolio" />
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.map(img => (
                  <figure key={img.id} className="overflow-hidden rounded-gm-lg bg-surface-sunken">
                    <img src={img.image_url} alt={img.caption || ''} className="aspect-square w-full object-cover" loading="lazy" />
                    {img.caption ? <figcaption className="t-caption px-2 py-1 text-ink-muted">{img.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader label="Reviews" meta={meta.total ? `${meta.avg_rating ? Number(meta.avg_rating).toFixed(1) : '—'} · ${meta.total}` : undefined} />
            <div className="mt-2 flex flex-col gap-2">
              {reviews.length ? (
                reviews.slice(0, 5).map(r => (
                  <Card key={r.id} padding="md">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.user_name} src={r.avatar_url} size={32} />
                      <Text variant="bodyStrong" className="flex-1 truncate">
                        {r.user_name || 'Member'}
                      </Text>
                      {r.is_verified_client ? <Badge label="Client" tone="success" /> : null}
                      <Text variant="caption" tone="subtle">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </Text>
                    </div>
                    <div className="mt-1 flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={12} className={i <= r.rating ? 'fill-rating text-rating' : 'text-ink-subtle'} aria-hidden />
                      ))}
                    </div>
                    {r.title ? <Text variant="subtitle" className="mt-1">{r.title}</Text> : null}
                    {r.review ? <Text variant="footnote" tone="muted">{r.review}</Text> : null}
                    {r.trainer_response ? (
                      <div className="mt-2 rounded-gm-md bg-surface-sunken p-2">
                        <Text variant="labelSm" tone="accent">
                          Coach’s reply
                        </Text>
                        <Text variant="footnote">{r.trainer_response}</Text>
                      </div>
                    ) : null}
                  </Card>
                ))
              ) : (
                <EmptyState compact icon={Star} title="No reviews yet" message="Clients can review after their sessions." />
              )}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card padding="lg">
            <Text variant="label" tone="subtle">
              Pricing
            </Text>
            <div className="mt-2 flex flex-col gap-1.5">
              {pricing.length ? (
                pricing.map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <Text variant="footnote" tone="muted">
                      {k}
                    </Text>
                    <Text variant="bodyStrong">{v}</Text>
                  </div>
                ))
              ) : (
                <Text variant="footnote" tone="muted">
                  Pricing on request
                </Text>
              )}
              {trainer.charges_negotiable ? <Badge label="Negotiable" tone="info" /> : null}
            </div>
            <Button className="mt-4" label="Book a session" icon={CalendarCheck} fullWidth onClick={() => setBooking({ pkg: null })} />
          </Card>
          {packages.length ? (
            <section className="flex flex-col gap-2">
              <Text variant="label" tone="subtle">
                Packages
              </Text>
              {packages.map(p => (
                <Card key={p.id} padding="lg" variant={p.is_popular ? 'accent' : 'surface'} data-testid="trainer-package">
                  <div className="flex items-start justify-between gap-2">
                    <Text variant="title">{p.name}</Text>
                    {p.is_popular ? <Badge label="Popular" tone="accent" /> : null}
                  </div>
                  {p.description ? (
                    <Text variant="footnote" tone="muted" className="mt-1">
                      {p.description}
                    </Text>
                  ) : null}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="t-h2 text-ink">{inr(p.discounted_price || p.price)}</span>
                    {p.discounted_price && p.price > p.discounted_price ? <span className="t-caption text-ink-subtle line-through">{inr(p.price)}</span> : null}
                  </div>
                  <Text variant="caption" tone="subtle">
                    {p.total_sessions} sessions · valid {p.validity_days} days
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.includes_diet_plan ? <Badge label="Diet plan" /> : null}
                    {p.includes_progress_tracking ? <Badge label="Progress tracking" /> : null}
                    {p.allows_rescheduling ? <Badge label="Rescheduling" /> : null}
                  </div>
                  <Button className="mt-3" label="Book this package" size="md" fullWidth variant={p.is_popular ? 'primary' : 'secondary'} onClick={() => setBooking({ pkg: p })} />
                </Card>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
      <BookingSheet trainer={trainer} pkg={booking?.pkg ?? null} open={booking != null} onClose={() => setBooking(null)} />
    </div>
  );
}
