import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  LayoutGrid,
  MapPin,
  MessageSquarePlus,
  Navigation,
  Phone,
  ReceiptIndianRupee,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import {
  AppBar,
  Badge,
  BarChart,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  SectionHeader,
  SelectableCard,
  Sheet,
  Skeleton,
  Text,
  TextArea,
  TextField,
  cn,
  useToast,
} from '../../components/kit';
import { MapPanel } from '../../components/explore/MapPanel';
import { useGeoLocation } from '../../context/LocationContext';
import { getGoogleMapsUrl } from '../../utils/navigation';
import { getApiErrorMessage } from '../../utils/api';
import { discoveryApi } from '../../api/discovery';

/* eslint-disable @typescript-eslint/no-explicit-any -- gym payloads are untyped */

type Tab = 'overview' | 'plans' | 'insights' | 'photos' | 'amenities' | 'equipment' | 'reviews';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'plans', label: 'Plans' },
  { key: 'insights', label: 'Crowd' },
  { key: 'photos', label: 'Photos' },
  { key: 'amenities', label: 'Amenities' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'reviews', label: 'Reviews' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const distanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const fmtTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const timeSlots = (plan: any): { start: string; end: string }[] => {
  if (plan.access_time_slots?.length) return plan.access_time_slots;
  if (plan.access_start_time && plan.access_end_time) return [{ start: plan.access_start_time, end: plan.access_end_time }];
  return [{ start: '06:00', end: '22:00' }];
};
const isQualifyingPlan = (plan: any) => ['month', 'quarter', 'half_year', 'year'].includes(plan.duration_type) || plan.duration_days >= 30;
const priceOf = (p: any) => Number(p.discounted_price || p.price || 0);
const nameOf = (x: any) => (typeof x === 'string' ? x : x?.name);
const todayName = () => DAYS[(new Date().getDay() + 6) % 7];

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= value ? 'fill-rating text-rating' : 'text-ink-subtle'} aria-hidden />
      ))}
    </span>
  );
}

function FactTile({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string; sub?: string }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-1.5 text-ink-subtle">
        <Icon size={14} aria-hidden />
        <Text variant="labelSm" tone="subtle">
          {label}
        </Text>
      </div>
      <Text variant="title" className="mt-1 tabular-nums">
        {value}
      </Text>
      {sub ? (
        <Text variant="caption" tone="subtle">
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}

function ActionTile({ icon: Icon, label, onClick, disabled, accent }: { icon: typeof Clock; label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 flex-col items-center gap-1.5 rounded-gm-lg border py-3 transition-colors disabled:opacity-40',
        accent ? 'border-accent-border bg-accent-soft text-accent-text' : 'border-border bg-surface text-ink hover:bg-surface-sunken',
      )}>
      <Icon size={20} aria-hidden />
      <span className="t-caption font-bold">{label}</span>
    </button>
  );
}

/** Gym profile — the app's GymProfile + Checkout: hero, tabs, plan cart, checkout, crowd insights, reviews. */
export default function GymProfile() {
  const { gymId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedLocation } = useGeoLocation();

  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'overview');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statDay, setStatDay] = useState(todayName);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, any>>({}); // one plan per slot
  const [addons, setAddons] = useState<any[]>([]);
  const [checkout, setCheckout] = useState<null | 'review' | 'payment' | 'done'>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setGym(await discoveryApi.gym(gymId));
    } catch (err) {
      console.error('Failed to fetch gym details:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gymId) return;
    void load();
    setStatsLoading(true);
    discoveryApi
      .gymWorkoutStats(gymId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const d = await discoveryApi.gymReviews(gymId);
      setReviews(d?.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };
  useEffect(() => {
    if (tab === 'reviews' && gymId) void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, gymId]);

  const grouped = useMemo(() => {
    const acc: Record<string, any[]> = {};
    for (const p of gym?.membership_plans || []) (acc[p.slot_name || 'Full Access'] ??= []).push(p);
    return acc;
  }, [gym]);

  if (loading)
    return (
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <Skeleton className="h-[280px] rounded-gm-xxl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-gm-xl" />
      </div>
    );
  if (failed || !gym)
    return (
      <div className="mx-auto w-full max-w-[720px] py-10">
        <ErrorState title="Unable to load this gym right now" onRetry={load} />
        <div className="mt-3 flex justify-center">
          <Button label="Back to Explore" variant="ghost" to="/app/discovery" />
        </div>
      </div>
    );

  const addr = gym.addresses?.[0];
  const dist = addr?.latitude && selectedLocation ? distanceKm(selectedLocation, addr) : null;
  const cover =
    gym.cover_image_url ||
    gym.images?.find((i: any) => i.is_primary)?.image_url ||
    gym.images?.find((i: any) => i.is_primary)?.url ||
    gym.images?.[0]?.image_url ||
    gym.images?.[0]?.url ||
    gym.logo_url;
  const photos: string[] = (gym.images || []).map((i: any) => i.image_url || i.url).filter(Boolean);
  const facilities: string[] = (gym.facilities || []).map(nameOf).filter(Boolean);
  const amenities: string[] = (gym.amenities || []).map(nameOf).filter(Boolean);
  const equipment: any[] = gym.equipment || [];
  const plans: any[] = gym.membership_plans || [];
  const lowestPlan = plans.reduce<any>((lo, p) => (lo == null || priceOf(p) < priceOf(lo) ? p : lo), null);
  const occRatio = gym.max_capacity ? (gym.current_occupancy || 0) / gym.max_capacity : null;
  const occ = occRatio == null ? null : occRatio > 0.8 ? { label: 'Busy now', tone: 'danger' as const } : occRatio > 0.5 ? { label: 'Moderate now', tone: 'warning' as const } : { label: 'Quiet now', tone: 'success' as const };
  const directions = () => window.open(getGoogleMapsUrl(`${addr?.address_line1 ?? ''}, ${gym.city ?? ''}`, addr?.latitude, addr?.longitude), '_blank', 'noopener,noreferrer');
  const bestToday = stats?.hourly_distribution?.[todayName()]?.best_time;
  const askMigo = () =>
    navigate(`/app/assistant?initialPrompt=${encodeURIComponent(`Build my workout for today at ${gym.name}${bestToday ? `. The quietest time today is ${bestToday}` : ''}.`)}`);

  const cartPlans = Object.entries(cart);
  const entryFee = gym.is_new_member ? cartPlans.reduce((s, [, p]) => s + (isQualifyingPlan(p) ? Number(p.entry_fee || 0) : 0), 0) : 0;
  const addonTotal = addons.reduce((s, a) => s + Number(a.price || 0), 0);
  const total = cartPlans.reduce((s, [, p]) => s + priceOf(p), 0) + entryFee + addonTotal;

  const togglePlan = (slot: string, plan: any) =>
    setCart(prev => {
      const copy = { ...prev };
      if (copy[slot]?.id === plan.id) delete copy[slot];
      else copy[slot] = plan;
      return copy;
    });
  const toggleAddon = (a: any) => setAddons(prev => (prev.some(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]));

  const submitCart = async () => {
    if (!cartPlans.length) return;
    setSubmitting(true);
    try {
      await discoveryApi.applyCart({
        gym_id: gym.id,
        plans: cartPlans.map(([, p]) => ({ plan_id: p.id, selected_addons: addons.map(a => ({ id: a.id, name: a.name, price: a.price })) })) as any,
        payment_method: 'cash',
      });
      setCheckout('done');
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) || 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    setReviewSaving(true);
    try {
      await discoveryApi.postGymReview({ gym_id: gymId, rating, title: reviewTitle || 'Review', review: reviewText });
      toast({ tone: 'success', title: 'Review submitted successfully!' });
      setReviewOpen(false);
      setReviewText('');
      setReviewTitle('');
      setRating(5);
      setGym((g: any) => ({ ...g, can_review: false }));
      void loadReviews();
    } catch (err) {
      toast({ tone: 'error', title: getApiErrorMessage(err) || 'Failed to submit review.' });
    } finally {
      setReviewSaving(false);
    }
  };

  const hourly = Object.entries(stats?.hourly_distribution?.[statDay] || {}).filter(([k]) => k !== 'best_time') as [string, number][];

  const sidebar = (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="overflow-hidden">
        <MapPanel center={addr?.latitude ? { lat: Number(addr.latitude), lng: Number(addr.longitude) } : null} points={addr?.latitude ? [{ id: gym.id, lat: Number(addr.latitude), lng: Number(addr.longitude), title: gym.name }] : []} zoom={15} className="h-[180px]" />
        <div className="flex items-center gap-3 p-4">
          <MapPin size={18} className="shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <Text variant="callout" className="truncate font-bold">
              {addr?.address_line1 || gym.city}
            </Text>
            <Text variant="caption" tone="subtle" className="truncate">
              {[gym.city, gym.state].filter(Boolean).join(', ')}
              {dist != null ? ` · ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} away` : ''}
            </Text>
          </div>
          <Button label="Navigate" size="sm" variant="secondary" icon={Navigation} onClick={directions} />
        </div>
      </Card>
      {gym.contact_phone ? (
        <Card padding="md">
          <a href={`tel:${gym.contact_phone}`} className="flex items-center gap-3">
            <Phone size={18} className="text-accent" aria-hidden />
            <Text variant="bodyStrong">{gym.contact_phone}</Text>
          </a>
        </Card>
      ) : null}
      {gym.operating_hours?.length ? (
        <Card padding="md">
          <Text variant="label" tone="subtle">
            Operating hours
          </Text>
          <div className="mt-2 flex flex-col gap-1.5">
            {gym.operating_hours.map((h: any) => (
              <div key={h.day_of_week} className="flex justify-between">
                <Text variant="caption" tone={(new Date().getDay() + 6) % 7 === h.day_of_week ? 'accent' : 'muted'} className="font-semibold">
                  {String(h.day_name).slice(0, 3)}
                </Text>
                <Text variant="caption">{h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}</Text>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-6">
      <AppBar backTo="/app/discovery" caption="GYM PROFILE" />

      {/* Hero */}
      <div className="relative mt-2 h-[240px] overflow-hidden rounded-gm-xxl bg-surface-sunken sm:h-[320px]" data-theme="dark">
        {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Building2 size={96} className="absolute inset-0 m-auto text-ink-subtle" aria-hidden />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-gm-lg border border-white/20 bg-black/40 backdrop-blur">
            {gym.logo_url ? <img src={gym.logo_url} alt="" className="h-full w-full object-contain" /> : <Building2 className="text-accent" size={28} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1 text-white">
            <div className="flex flex-wrap items-center gap-2">
              {gym.is_verified ? <Badge label="Verified partner" tone="accent" /> : null}
              {occ ? <Badge label={`${occ.label} · ${gym.current_occupancy}/${gym.max_capacity}`} tone={occ.tone} dot /> : null}
            </div>
            <h1 className="t-display mt-1 line-clamp-2 text-white">{gym.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80">
              <span className="t-callout inline-flex items-center gap-1">
                <MapPin size={14} aria-hidden /> {gym.city}
              </span>
              <span className="t-caption inline-flex items-center gap-1">
                <Star size={13} className="fill-rating text-rating" aria-hidden />
                <b>{gym.rating_avg ? Number(gym.rating_avg).toFixed(1) : 'New'}</b>
                {gym.rating_count ? <span className="text-white/60">({gym.rating_count})</span> : null}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-background px-4 py-2 [scrollbar-width:none] lg:mx-0 lg:px-0" role="tablist" aria-label="Gym sections">
        {TABS.map(t => (
          <Chip key={t.key} label={t.label} selected={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {tab === 'overview' ? (
            <>
              <div className="flex gap-2">
                <ActionTile icon={ReceiptIndianRupee} label="Plans" onClick={() => setTab('plans')} />
                <ActionTile icon={Navigation} label="Directions" onClick={directions} />
                <ActionTile icon={Phone} label="Call" disabled={!gym.contact_phone} onClick={() => (window.location.href = `tel:${gym.contact_phone}`)} />
                <ActionTile icon={Sparkles} label="Ask Migo" accent onClick={askMigo} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <FactTile label="Starting pass" icon={ReceiptIndianRupee} value={lowestPlan ? inr(priceOf(lowestPlan)) : '—'} sub={lowestPlan ? `${lowestPlan.duration_days} days` : undefined} />
                <FactTile label="Equipment" icon={Dumbbell} value={String(equipment.length)} sub={equipment.length === 1 ? 'station' : 'stations'} />
                <FactTile label="Hours" icon={Clock} value={gym.is_24_hours ? '24/7' : 'Scheduled'} />
                <FactTile label="Facilities" icon={LayoutGrid} value={String(facilities.length)} sub={gym.is_verified ? 'verified' : undefined} />
              </div>
              {facilities.length ? (
                <Card padding="lg">
                  <Text variant="labelSm" tone="accent">
                    Facilities
                  </Text>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {facilities.map(f => (
                      <Badge key={f} label={f} />
                    ))}
                  </div>
                </Card>
              ) : null}
              <section>
                <SectionHeader label="About the facility" />
                <Text tone="muted" className="mt-2">
                  {gym.description || 'Welcome to our fitness facility.'}
                </Text>
              </section>
              {equipment.length ? (
                <Card padding="lg">
                  <div className="flex items-center justify-between">
                    <Text variant="subtitle">Flagship hardware loadout</Text>
                    <button type="button" className="t-label text-accent-text hover:underline" onClick={() => setTab('equipment')}>
                      See all
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {equipment.slice(0, 6).map((e: any, i: number) => (
                      <div key={e.id ?? i} className="rounded-gm-md bg-surface-sunken px-3 py-2">
                        <Text variant="footnote" className="line-clamp-2 font-semibold">
                          {e.name}
                        </Text>
                        {e.quantity ? (
                          <Text variant="caption" tone="subtle">
                            ×{e.quantity}
                          </Text>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
              <div className="lg:hidden">{sidebar}</div>
            </>
          ) : null}

          {tab === 'plans' ? (
            plans.length ? (
              <div className="flex flex-col gap-6" data-testid="gym-plans">
                {Object.entries(grouped).map(([slot, list]) => (
                  <section key={slot}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <Text variant="h2">{slot}</Text>
                      <Text variant="labelSm" tone="subtle">
                        Pick one
                      </Text>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {list.map(plan => {
                        const sel = cart[slot]?.id === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            role="checkbox"
                            aria-checked={sel}
                            onClick={() => togglePlan(slot, plan)}
                            className={cn(
                              'flex flex-col gap-2 rounded-gm-xl border p-4 text-left transition-colors',
                              sel ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:border-border-strong',
                            )}>
                            <div className="flex items-start justify-between gap-2">
                              <Text variant="bodyStrong">{plan.name}</Text>
                              {sel ? <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden /> : null}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="t-h2 tabular-nums text-ink">{inr(priceOf(plan))}</span>
                              {plan.discounted_price && plan.price > plan.discounted_price ? <span className="t-caption text-ink-subtle line-through">{inr(plan.price)}</span> : null}
                              <span className="t-caption text-ink-subtle">· {plan.duration_days} days</span>
                            </div>
                            {plan.entry_fee > 0 && gym.is_new_member && isQualifyingPlan(plan) ? <Text variant="caption" tone="accent">+ {inr(plan.entry_fee)} entry fee (new member)</Text> : null}
                            <div className="flex flex-wrap gap-1.5">
                              {timeSlots(plan).map((s, i) => (
                                <Badge key={i} label={`${fmtTime(s.start)} – ${fmtTime(s.end)}`} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
                {cartPlans.length && gym.addons?.length ? (
                  <section>
                    <Text variant="h2" className="mb-2">
                      Add-ons
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {gym.addons.map((a: any) => (
                        <Chip key={a.id} label={`${a.name} · +${inr(a.price)}`} selected={addons.some(x => x.id === a.id)} onClick={() => toggleAddon(a)} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <EmptyState icon={Dumbbell} title="No plans listed yet" message="This gym hasn’t published membership plans." />
            )
          ) : null}

          {tab === 'insights' ? (
            statsLoading ? (
              <Skeleton className="h-60 rounded-gm-xl" />
            ) : !stats ? (
              <EmptyState icon={Clock} title="No crowd data yet" message="Check-ins build this chart over time." />
            ) : (
              <>
                <Card padding="lg">
                  <Text variant="subtitle">Check-ins this week</Text>
                  <BarChart
                    className="mt-4"
                    ariaLabel="Weekly check-ins"
                    bars={DAYS.map(d => ({ label: d.slice(0, 3), value: Number(stats.weekly_stats?.[d] || 0), highlight: d === statDay }))}
                  />
                </Card>
                <Card padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text variant="subtitle">Hourly crowd</Text>
                    <Badge label={`Best time: ${stats.hourly_distribution?.[statDay]?.best_time || '—'}`} tone="success" />
                  </div>
                  <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {DAYS.map(d => (
                      <Chip key={d} label={d.slice(0, 3)} selected={statDay === d} onClick={() => setStatDay(d)} />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {hourly.length ? (
                      hourly.map(([range, count]) => {
                        const max = Math.max(1, ...hourly.map(([, v]) => v));
                        const best = range === stats.hourly_distribution?.[statDay]?.best_time;
                        return (
                          <div key={range} className="flex items-center gap-3">
                            <Text variant="caption" tone={best ? 'success' : 'muted'} className="w-28 shrink-0">
                              {range}
                            </Text>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                              <div className={cn('h-full rounded-full', best ? 'bg-success' : 'bg-accent')} style={{ width: `${Math.max(2, (count / max) * 100)}%` }} />
                            </div>
                            <Text variant="caption" className="w-6 text-right tabular-nums">
                              {count}
                            </Text>
                          </div>
                        );
                      })
                    ) : (
                      <Text variant="footnote" tone="muted">
                        No check-ins recorded for {statDay}.
                      </Text>
                    )}
                  </div>
                </Card>
                <Button label="Plan my session with Migo" icon={Sparkles} variant="secondary" onClick={askMigo} />
              </>
            )
          ) : null}

          {tab === 'photos' ? (
            photos.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((url, i) => (
                  <button key={url + i} type="button" onClick={() => setLightbox(url)} className="aspect-square overflow-hidden rounded-gm-lg bg-surface-sunken">
                    <img src={url} alt={`${gym.name} photo ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No photos yet" message="The gym hasn’t uploaded photos." />
            )
          ) : null}

          {tab === 'amenities' ? (
            amenities.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map(a => (
                  <Card key={a} padding="md" className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" aria-hidden />
                    <Text variant="footnote" className="font-semibold">
                      {a}
                    </Text>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="No amenities listed" />
            )
          ) : null}

          {tab === 'equipment' ? (
            equipment.length ? (
              <Card padding="none" className="px-4">
                {equipment.map((e: any, i: number) => (
                  <div key={e.id ?? i} className={cn('flex items-center gap-3 py-3', i < equipment.length - 1 && 'border-b border-border')}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-gm-md bg-surface-sunken">
                      <Dumbbell size={16} aria-hidden />
                    </span>
                    <Text variant="bodyStrong" className="flex-1">
                      {e.name}
                    </Text>
                    {e.quantity ? <Badge label={`×${e.quantity}`} /> : null}
                  </div>
                ))}
              </Card>
            ) : (
              <EmptyState icon={Dumbbell} title="No equipment listed" />
            )
          ) : null}

          {tab === 'reviews' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Text variant="h2">{gym.rating_avg ? Number(gym.rating_avg).toFixed(1) : '—'}</Text>
                  <Stars value={Math.round(gym.rating_avg || 0)} />
                  <Text variant="caption" tone="subtle">
                    {gym.rating_count || 0} reviews
                  </Text>
                </div>
                {gym.can_review ? <Button label="Write a review" size="sm" icon={MessageSquarePlus} onClick={() => setReviewOpen(true)} /> : null}
              </div>
              {reviewsLoading ? (
                <Skeleton className="h-28 rounded-gm-xl" />
              ) : reviews.length ? (
                reviews.map(r => (
                  <Card key={r.id} padding="lg">
                    <div className="flex items-center gap-2">
                      <Text variant="bodyStrong" className="flex-1 truncate">
                        {r.user_name || 'Anonymous member'}
                      </Text>
                      {r.is_verified_member ? <Badge label="Verified member" tone="success" /> : null}
                      <Text variant="caption" tone="subtle">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                      </Text>
                    </div>
                    <Stars value={r.rating} size={12} />
                    {r.title ? <Text variant="subtitle" className="mt-2">{r.title}</Text> : null}
                    <Text tone="muted" className="mt-1">
                      {r.review}
                    </Text>
                    {r.owner_response ? (
                      <div className="mt-3 rounded-gm-md bg-surface-sunken p-3">
                        <Text variant="labelSm" tone="accent">
                          Response from the gym
                        </Text>
                        <Text variant="footnote" className="mt-1">
                          {r.owner_response}
                        </Text>
                      </div>
                    ) : null}
                  </Card>
                ))
              ) : (
                <EmptyState icon={Star} title="No reviews yet" message="Members who train here can leave the first one." />
              )}
            </div>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[128px]">{sidebar}</div>
        </aside>
      </div>

      {/* Cart bar */}
      <div className="sticky bottom-[84px] z-20 mt-6 rounded-gm-xl border border-border bg-surface/95 px-4 py-3 shadow-raised backdrop-blur md:bottom-4">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <Text variant="labelSm" tone="subtle">
              {cartPlans.length ? `${cartPlans.length} plan${cartPlans.length > 1 ? 's' : ''} selected` : 'Starting from'}
            </Text>
            <Text variant="h2" tone="accent" className="tabular-nums">
              {cartPlans.length ? inr(total) : lowestPlan ? inr(priceOf(lowestPlan)) : '—'}
            </Text>
          </div>
          {cartPlans.length ? (
            <Button label="Proceed" iconRight={ArrowRight} onClick={() => setCheckout('review')} />
          ) : (
            <Button label="Choose plan" variant="secondary" iconRight={ArrowRight} onClick={() => setTab('plans')} />
          )}
        </div>
      </div>

      {/* Checkout */}
      <Sheet
        open={checkout != null}
        onClose={() => (checkout === 'done' ? navigate('/app/memberships') : setCheckout(null))}
        eyebrow={checkout === 'done' ? 'Request sent' : checkout === 'payment' ? 'Step 2 of 2' : 'Step 1 of 2'}
        title={checkout === 'done' ? 'Waiting for the gym' : checkout === 'payment' ? 'Payment' : 'Review your pass'}
        footer={
          checkout === 'done' ? (
            <div className="flex flex-col gap-2">
              <Button label="View my memberships" fullWidth to="/app/memberships" />
              <Button label="Back to home" variant="ghost" fullWidth to="/app/dashboard" />
            </div>
          ) : checkout === 'payment' ? (
            <Button label="Confirm & send" iconRight={ArrowRight} loading={submitting} fullWidth onClick={submitCart} />
          ) : (
            <Button label="Continue" iconRight={ArrowRight} fullWidth onClick={() => setCheckout('payment')} />
          )
        }>
        {checkout === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={48} className="text-success" aria-hidden />
            <Text variant="title">{cartPlans.length} plan(s) submitted</Text>
            <Text tone="muted">{gym.name} will approve your request. Pay at the front desk; your pass activates once approved.</Text>
          </div>
        ) : checkout === 'payment' ? (
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
            <SelectableCard icon={Banknote} title="Cash" description="Pay at the facility after the gym approves." selected onSelect={() => undefined} />
            <SelectableCard icon={CreditCard} title="Online" description="Pay securely online." badge="Coming soon" disabled onSelect={() => undefined} />
            <Text variant="caption" tone="subtle">
              Total due at the desk: {inr(total)}
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Card variant="sunken" padding="md" className="flex items-center gap-3">
              <Building2 size={20} className="text-accent" aria-hidden />
              <div className="min-w-0">
                <Badge label="Partner facility" tone="accent" />
                <Text variant="title" className="mt-1 truncate">
                  {gym.name}
                </Text>
              </div>
            </Card>
            <Text variant="title">Order summary</Text>
            {cartPlans.map(([slot, p]) => (
              <div key={slot} className="flex items-start justify-between gap-3 border-b border-border pb-2">
                <div className="min-w-0">
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" tone="subtle">
                    {slot} · {p.duration_days} days · {timeSlots(p).map(s => `${fmtTime(s.start)}–${fmtTime(s.end)}`).join(', ')}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text variant="bodyStrong" className="tabular-nums">
                    {inr(priceOf(p))}
                  </Text>
                  <button type="button" aria-label={`Remove ${p.name}`} onClick={() => togglePlan(slot, p)} className="text-ink-subtle hover:text-danger">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {addons.map(a => (
              <div key={a.id} className="flex justify-between">
                <Text variant="footnote">
                  {a.name} <span className="text-ink-subtle">· Add-on</span>
                </Text>
                <Text variant="footnote">+{inr(a.price)}</Text>
              </div>
            ))}
            {entryFee ? (
              <div className="flex justify-between">
                <Text variant="footnote">
                  Entry fee <span className="text-ink-subtle">· One time</span>
                </Text>
                <Text variant="footnote">+{inr(entryFee)}</Text>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <Text variant="title">Total</Text>
              <Text variant="h1" tone="accent" className="tabular-nums">
                {inr(total)}
              </Text>
            </div>
          </div>
        )}
      </Sheet>

      {/* Review */}
      <Sheet open={reviewOpen} onClose={() => setReviewOpen(false)} eyebrow={gym.name} title="Write a review" footer={<Button label="Submit review" loading={reviewSaving} disabled={!reviewText.trim()} fullWidth onClick={submitReview} />}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} stars`} onClick={() => setRating(i)}>
                <Star size={30} className={i <= rating ? 'fill-rating text-rating' : 'text-ink-subtle'} />
              </button>
            ))}
          </div>
          <TextField label="Title" placeholder="e.g. Best facility in the city!" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} />
          <TextArea label="Your review" rows={4} value={reviewText} onChange={e => setReviewText(e.target.value)} />
        </div>
      </Sheet>

      {/* Lightbox */}
      {lightbox ? (
        <div role="dialog" aria-label="Photo" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close photo" className="absolute right-4 top-4 text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-gm-lg object-contain" />
        </div>
      ) : null}
    </div>
  );
}
